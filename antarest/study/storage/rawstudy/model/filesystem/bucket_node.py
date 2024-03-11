import typing as t

from antarest.core.model import JSON, SUB_JSON
from antarest.study.storage.rawstudy.model.filesystem.config.model import FileStudyTreeConfig
from antarest.study.storage.rawstudy.model.filesystem.context import ContextServer
from antarest.study.storage.rawstudy.model.filesystem.folder_node import FolderNode
from antarest.study.storage.rawstudy.model.filesystem.inode import TREE, INode
from antarest.study.storage.rawstudy.model.filesystem.raw_file_node import RawFileNode


class RegisteredFile:
    def __init__(
        self,
        key: str,
        node: t.Optional[t.Callable[[ContextServer, FileStudyTreeConfig], INode[t.Any, t.Any, t.Any]]],
        filename: str = "",
    ):
        self.key = key
        self.node = node
        self.filename = filename or key


class BucketNode(FolderNode):
    """
    Node to handle structure free, user purpose folder. BucketNode accept any file or sub folder as children.
    """

    def __init__(
        self,
        context: ContextServer,
        config: FileStudyTreeConfig,
        registered_files: t.Optional[t.List[RegisteredFile]] = None,
        default_file_node: t.Callable[..., INode[t.Any, t.Any, t.Any]] = RawFileNode,
    ):
        super().__init__(context, config)
        self.registered_files: t.List[RegisteredFile] = registered_files or []
        self.default_file_node: t.Callable[..., INode[t.Any, t.Any, t.Any]] = default_file_node

    def _get_registered_file_by_key(self, key: str) -> t.Optional[RegisteredFile]:
        return next((rf for rf in self.registered_files if rf.key == key), None)

    def _get_registered_file_by_filename(self, filename: str) -> t.Optional[RegisteredFile]:
        return next((rf for rf in self.registered_files if rf.filename == filename), None)

    def save(
        self,
        data: SUB_JSON,
        url: t.Optional[t.List[str]] = None,
    ) -> None:
        self._assert_not_in_zipped_file()
        if not self.config.path.exists():
            self.config.path.mkdir()

        if not url:
            assert isinstance(data, dict)
            for key, value in data.items():
                self._save(value, key)
        else:
            key = url[0]
            if len(url) > 1:
                registered_file = self._get_registered_file_by_key(key)
                if registered_file:
                    node = registered_file.node or self.default_file_node
                    node(self.context, self.config.next_file(key)).save(data, url[1:])
                else:
                    BucketNode(self.context, self.config.next_file(key)).save(data, url[1:])
            else:
                self._save(data, key)

    def _save(self, data: SUB_JSON, key: str) -> None:
        registered_file = self._get_registered_file_by_key(key)
        if registered_file:
            node, filename = (
                registered_file.node or self.default_file_node,
                registered_file.filename,
            )

            node(self.context, self.config.next_file(filename)).save(data)
        elif isinstance(data, (str, bytes)):
            self.default_file_node(self.context, self.config.next_file(key)).save(data)
        elif isinstance(data, dict):
            BucketNode(self.context, self.config.next_file(key)).save(data)

    def build(self) -> TREE:
        if not self.config.path.is_dir():
            return {}

        children: TREE = {}
        for item in sorted(self.config.path.iterdir()):
            registered_file = self._get_registered_file_by_filename(item.name)
            if registered_file:
                node = registered_file.node or self.default_file_node
                children[registered_file.key] = node(self.context, self.config.next_file(item.name))
            elif item.is_file():
                children[item.name] = self.default_file_node(self.context, self.config.next_file(item.name))
            else:
                children[item.name] = BucketNode(self.context, self.config.next_file(item.name))

        return children

    def check_errors(
        self,
        data: JSON,
        url: t.Optional[t.List[str]] = None,
        raising: bool = False,
    ) -> t.List[str]:
        return []
