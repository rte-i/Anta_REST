import datetime
import logging
import time
from abc import ABC, abstractmethod
from concurrent.futures import ThreadPoolExecutor, Future
from http import HTTPStatus
from typing import Callable, Optional, List, Dict

from fastapi import HTTPException

from antarest.core.config import Config
from antarest.core.interfaces.eventbus import IEventBus
from antarest.core.jwt import DEFAULT_ADMIN_USER
from antarest.core.requests import (
    RequestParameters,
    MustBeAuthenticatedError,
)
from antarest.core.tasks.model import (
    TaskDTO,
    TaskListFilter,
    TaskJob,
    TaskStatus,
    TaskJobLog,
    TaskResult,
)
from antarest.core.tasks.repository import TaskJobRepository
from antarest.core.utils.fastapi_sqlalchemy import db

logger = logging.getLogger(__name__)

TaskUpdateNotifier = Callable[[str], None]
Task = Callable[[TaskUpdateNotifier], TaskResult]


class ITaskService(ABC):
    @abstractmethod
    def add_task(
        self,
        action: Task,
        name: Optional[str],
        request_params: RequestParameters,
    ) -> str:
        raise NotImplementedError()

    @abstractmethod
    def status_task(
        self, task_id: str, request_params: RequestParameters
    ) -> TaskDTO:
        raise NotImplementedError()

    @abstractmethod
    def list_tasks(
        self, task_filter: TaskListFilter, request_params: RequestParameters
    ) -> List[TaskDTO]:
        raise NotImplementedError()

    @abstractmethod
    def await_task(
        self, task_id: str, timeout_sec: Optional[int] = None
    ) -> None:
        raise NotImplementedError()


def noop_notifier(message: str) -> None:
    pass


class TaskJobService(ITaskService):
    def __init__(
        self,
        config: Config,
        repository: TaskJobRepository,
        event_bus: IEventBus,
    ):
        self.config = config
        self.repo = repository
        self.event_bus = event_bus
        self.tasks: Dict[str, Future[None]] = {}
        self.threadpool = ThreadPoolExecutor(
            max_workers=config.tasks.max_workers, thread_name_prefix="taskjob_"
        )
        # set the status of previously running job to FAILED due to server restart
        self._fix_running_status()

    def add_task(
        self,
        action: Task,
        name: Optional[str],
        request_params: RequestParameters,
    ) -> str:
        if not request_params.user:
            raise MustBeAuthenticatedError()

        task = self.repo.save(
            TaskJob(
                name=name or "Unnamed",
                owner_id=request_params.user.impersonator,
            )
        )
        future = self.threadpool.submit(self._run_task, action, task)
        self.tasks[task.id] = future
        return str(task.id)

    def status_task(
        self, task_id: str, request_params: RequestParameters
    ) -> TaskDTO:
        if not request_params.user:
            raise MustBeAuthenticatedError()

        task = self.repo.get(task_id)
        if not task:
            raise HTTPException(
                status_code=HTTPStatus.NOT_FOUND,
                detail=f"Failed to retrieve task {task_id} in db",
            )
        return task.to_dto()

    def list_tasks(
        self, task_filter: TaskListFilter, request_params: RequestParameters
    ) -> List[TaskDTO]:
        return [
            task.to_dto()
            for task in self.list_db_tasks(task_filter, request_params)
        ]

    def list_db_tasks(
        self, task_filter: TaskListFilter, request_params: RequestParameters
    ) -> List[TaskJob]:
        if not request_params.user:
            raise MustBeAuthenticatedError()
        return self.repo.list(
            task_filter,
            request_params.user.impersonator
            if not request_params.user.is_site_admin()
            else None,
        )

    def await_task(
        self, task_id: str, timeout_sec: Optional[int] = None
    ) -> None:
        if task_id in self.tasks:
            self.tasks[task_id].result(timeout_sec)
        else:
            logger.warning(
                f"Task {task_id} not handled by this worker, will poll for task completion from db"
            )
            end = time.time() + (timeout_sec or 1)
            while timeout_sec is None or time.time() < end:
                task = self.repo.get(task_id)
                if not task:
                    logger.error(f"Awaited task {task_id} was not found")
                    break
                if TaskStatus(task.status).is_final():
                    break
                time.sleep(2)

    def _run_task(self, callback: Task, task: TaskJob) -> None:
        with db():
            task.status = TaskStatus.RUNNING.value
            self.repo.save(task)
        try:
            with db():
                result = callback(self._task_logger(task.id))
            self._update_task_status(
                task,
                TaskStatus.COMPLETED if result.success else TaskStatus.FAILED,
                result.success,
                result.message,
                result.return_value,
            )
        except Exception as e:
            logger.error(
                f"Exception when running task {task.name}", exc_info=e
            )
            self._update_task_status(task, TaskStatus.FAILED, False, str(e))

    def _task_logger(self, task_id: str) -> Callable[[str], None]:
        def log_msg(message: str) -> None:
            task = self.repo.get(task_id)
            if task:
                task.logs.append(TaskJobLog(message=message, task_id=task_id))
                with db():
                    self.repo.save(task)

        return log_msg

    def _fix_running_status(self) -> None:
        with db():
            previous_tasks = self.list_db_tasks(
                TaskListFilter(
                    status=[TaskStatus.RUNNING, TaskStatus.PENDING]
                ),
                request_params=RequestParameters(user=DEFAULT_ADMIN_USER),
            )
            for task in previous_tasks:
                self._update_task_status(
                    task,
                    TaskStatus.FAILED,
                    False,
                    "Task was interrupted due to server restart",
                )

    def _update_task_status(
        self,
        task: TaskJob,
        status: TaskStatus,
        result: bool,
        message: str,
        command_result: Optional[str] = None,
    ) -> None:
        with db():
            task.status = status.value
            task.result_msg = message
            task.result_status = result
            task.result = command_result
            if status.is_final():
                task.completion_date = datetime.datetime.utcnow()
            self.repo.save(task)