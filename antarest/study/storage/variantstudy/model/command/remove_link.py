from antarest.study.storage.rawstudy.model.filesystem.factory import FileStudy
from antarest.study.storage.variantstudy.model.command.common import (
    CommandOutput,
    CommandName,
)
from antarest.study.storage.variantstudy.model.command.icommand import ICommand
from antarest.study.storage.variantstudy.model.command_context import (
    CommandContext,
)


class RemoveLink(ICommand):
    id: str

    def __init__(self) -> None:
        super().__init__(command_name=CommandName.REMOVE_LINK, version=1)

    def apply(
        self, study_data: FileStudy, command_context: CommandContext
    ) -> CommandOutput:
        raise NotImplementedError()

    def revert(self, study_data: FileStudy) -> CommandOutput:
        raise NotImplementedError()
