from typing import Union, List, Any, Optional

from pydantic import validator

from antarest.core.custom_types import JSON
from antarest.matrixstore.model import MatrixContent, MatrixData
from antarest.study.storage.rawstudy.model.filesystem.factory import FileStudy
from antarest.study.storage.rawstudy.model.filesystem.folder_node import (
    ChildNotFoundError,
)
from antarest.study.storage.rawstudy.model.filesystem.matrix.matrix import (
    MatrixNode,
)
from antarest.study.storage.variantstudy.model.model import CommandDTO
from antarest.study.storage.variantstudy.model.command.common import (
    CommandOutput,
    CommandName,
)
from antarest.study.storage.variantstudy.model.command.icommand import (
    ICommand,
    MATCH_SIGNATURE_SEPARATOR,
)
from antarest.study.storage.variantstudy.model.command.utils import (
    validate_matrix,
    strip_matrix_protocol,
)


class ReplaceMatrix(ICommand):
    target: str
    matrix: Union[List[List[MatrixData]], str]

    _validate_matrix = validator(
        "matrix", each_item=True, always=True, allow_reuse=True
    )(validate_matrix)

    def __init__(self, **data: Any) -> None:
        super().__init__(
            command_name=CommandName.REPLACE_MATRIX, version=1, **data
        )

    def _apply(self, study_data: FileStudy) -> CommandOutput:
        replace_matrix_data: JSON = {}
        target_matrix = replace_matrix_data
        url = self.target.split("/")
        for element in url[:-1]:
            target_matrix[element] = {}
            target_matrix = target_matrix[element]

        target_matrix[url[-1]] = self.matrix

        try:
            last_node = study_data.tree.get_node(url)
            assert isinstance(last_node, MatrixNode)
        except (KeyError, ChildNotFoundError):
            return CommandOutput(
                status=False,
                message=f"Path '{self.target}' does not exist.",
            )
        except AssertionError:
            return CommandOutput(
                status=False,
                message=f"Path '{self.target}' does not target a matrix.",
            )

        study_data.tree.save(replace_matrix_data)

        return CommandOutput(
            status=True,
            message=f"Matrix '{self.target}' has been successfully replaced.",
        )

    def to_dto(self) -> CommandDTO:
        return CommandDTO(
            action=CommandName.REPLACE_MATRIX.value,
            args={
                "target": self.target,
                "matrix": strip_matrix_protocol(self.matrix),
            },
        )

    def match_signature(self) -> str:
        return str(
            self.command_name.value + MATCH_SIGNATURE_SEPARATOR + self.target
        )

    def match(self, other: ICommand, equal: bool = False) -> bool:
        if not isinstance(other, ReplaceMatrix):
            return False
        simple_match = self.target == other.target
        if not equal:
            return simple_match
        return simple_match and self.matrix == other.matrix

    def revert(
        self, history: List["ICommand"], base: Optional[FileStudy] = None
    ) -> List["ICommand"]:
        for command in reversed(history):
            if (
                isinstance(command, ReplaceMatrix)
                and command.target == self.target
            ):
                return [command]
        if base is not None:
            from antarest.study.storage.variantstudy.model.command.utils_extractor import (
                CommandExtraction,
            )

            return [
                (
                    self.command_context.command_extractor
                    or CommandExtraction(self.command_context.matrix_service)
                ).generate_replace_matrix(base.tree, self.target.split("/"))
            ]
        return []

    def _create_diff(self, other: "ICommand") -> List["ICommand"]:
        return [other]

    def get_inner_matrices(self) -> List[str]:
        assert isinstance(self.matrix, str)
        return [strip_matrix_protocol(self.matrix)]