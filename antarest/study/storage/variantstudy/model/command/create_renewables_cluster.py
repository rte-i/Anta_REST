from typing import Any, Dict, List, Tuple, cast

from pydantic import validator

from antarest.core.model import JSON
from antarest.study.storage.rawstudy.model.filesystem.config.model import (
    ENR_MODELLING,
    Area,
    FileStudyTreeConfig,
    transform_name_to_id,
)
from antarest.study.storage.rawstudy.model.filesystem.config.renewable import create_renewable_config
from antarest.study.storage.rawstudy.model.filesystem.factory import FileStudy
from antarest.study.storage.variantstudy.model.command.common import CommandName, CommandOutput
from antarest.study.storage.variantstudy.model.command.icommand import MATCH_SIGNATURE_SEPARATOR, ICommand
from antarest.study.storage.variantstudy.model.model import CommandDTO


class CreateRenewablesCluster(ICommand):
    """
    Command used to create a renewable cluster in an area.
    """

    # Overloaded metadata
    # ===================

    command_name = CommandName.CREATE_RENEWABLES_CLUSTER
    version = 1

    # Command parameters
    # ==================

    area_id: str
    cluster_name: str
    parameters: Dict[str, str]

    @validator("cluster_name")
    def validate_cluster_name(cls, val: str) -> str:
        valid_name = transform_name_to_id(val, lower=False)
        if valid_name != val:
            raise ValueError("Area name must only contains [a-zA-Z0-9],&,-,_,(,) characters")
        return val

    def _apply_config(self, study_data: FileStudyTreeConfig) -> Tuple[CommandOutput, Dict[str, Any]]:
        if study_data.enr_modelling != ENR_MODELLING.CLUSTERS.value:
            message = (
                f"Parameter 'renewable-generation-modelling'"
                f" must be set to '{ENR_MODELLING.CLUSTERS.value}'"
                f" instead of '{study_data.enr_modelling}'"
            )
            return CommandOutput(status=False, message=message), {}

        # Search the Area in the configuration
        if self.area_id not in study_data.areas:
            return (
                CommandOutput(
                    status=False,
                    message=f"Area '{self.area_id}' does not exist in the study configuration.",
                ),
                {},
            )

        cluster_id = transform_name_to_id(self.cluster_name)
        for cluster in study_data.areas[self.area_id].renewables:
            if cluster.id == cluster_id:
                return (
                    CommandOutput(
                        status=False,
                        message=f"Renewable cluster '{cluster_id}' already exists in the area '{self.area_id}'.",
                    ),
                    {},
                )

        study_data.areas[self.area_id].renewables.append(Cluster(id=cluster_id, name=self.cluster_name))
        return (
            CommandOutput(
                status=True,
                message=f"Renewable cluster '{cluster_id}' added to area '{self.area_id}'.",
            ),
            {"cluster_id": cluster_id},
        )

    def _apply(self, study_data: FileStudy) -> CommandOutput:
        output, data = self._apply_config(study_data.config)
        if not output.status:
            return output

        # default values
        if "ts-interpretation" not in self.parameters:
            self.parameters["ts-interpretation"] = "power-generation"
        self.parameters.setdefault("name", self.cluster_name)

        cluster_id = data["cluster_id"]
        config = study_data.tree.get(["input", "renewables", "clusters", self.area_id, "list"])
        config[cluster_id] = self.parameters

        # Series identifiers are in lower case.
        series_id = cluster_id.lower()
        new_cluster_data: JSON = {
            "input": {
                "renewables": {
                    "clusters": {self.area_id: {"list": config}},
                    "series": {
                        self.area_id: {
                            series_id: {"series": self.command_context.generator_matrix_constants.get_null_matrix()}
                        }
                    },
                }
            }
        }
        study_data.tree.save(new_cluster_data)

        return output

    def to_dto(self) -> CommandDTO:
        return CommandDTO(
            action=self.command_name.value,
            args={
                "area_id": self.area_id,
                "cluster_name": self.cluster_name,
                "parameters": self.parameters,
            },
        )

    def match_signature(self) -> str:
        return str(
            self.command_name.value
            + MATCH_SIGNATURE_SEPARATOR
            + self.area_id
            + MATCH_SIGNATURE_SEPARATOR
            + self.cluster_name
        )

    def match(self, other: ICommand, equal: bool = False) -> bool:
        if not isinstance(other, CreateRenewablesCluster):
            return False
        simple_match = self.area_id == other.area_id and self.cluster_name == other.cluster_name
        if not equal:
            return simple_match
        return simple_match and self.parameters == other.parameters

    def _create_diff(self, other: "ICommand") -> List["ICommand"]:
        other = cast(CreateRenewablesCluster, other)
        from antarest.study.storage.variantstudy.model.command.update_config import UpdateConfig

        commands: List[ICommand] = []
        if self.parameters != other.parameters:
            commands.append(
                UpdateConfig(
                    target=f"input/renewables/clusters/{self.area_id}/list/{self.cluster_name}",
                    data=other.parameters,
                    command_context=self.command_context,
                )
            )
        return commands

    def get_inner_matrices(self) -> List[str]:
        return []
