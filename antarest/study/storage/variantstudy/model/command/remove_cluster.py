from typing import Any, Dict, List, Tuple

from antarest.study.storage.rawstudy.model.filesystem.config.model import Area, FileStudyTreeConfig
from antarest.study.storage.rawstudy.model.filesystem.factory import FileStudy
from antarest.study.storage.variantstudy.business.utils_binding_constraint import (
    remove_area_cluster_from_binding_constraints,
)
from antarest.study.storage.variantstudy.model.command.common import CommandName, CommandOutput
from antarest.study.storage.variantstudy.model.command.icommand import MATCH_SIGNATURE_SEPARATOR, ICommand
from antarest.study.storage.variantstudy.model.model import CommandDTO


class RemoveCluster(ICommand):
    """
    Command used to remove a thermal cluster in an area.
    """

    # Overloaded metadata
    # ===================

    command_name = CommandName.REMOVE_THERMAL_CLUSTER
    version = 1

    # Command parameters
    # ==================

    area_id: str
    cluster_id: str

    def _apply_config(self, study_data: FileStudyTreeConfig) -> Tuple[CommandOutput, Dict[str, Any]]:
        """
        Applies configuration changes to the study data: remove the thermal clusters from the storages list.

        Args:
            study_data: The study data configuration.

        Returns:
            A tuple containing the command output and a dictionary of extra data.
            On success, the dictionary is empty.
        """
        # Search the Area in the configuration
        if self.area_id not in study_data.areas:
            message = f"Area '{self.area_id}' does not exist in the study configuration."
            return CommandOutput(status=False, message=message), {}
        area: Area = study_data.areas[self.area_id]

        # Search the Thermal cluster in the area
        thermal = next(
            iter(thermal for thermal in area.thermals if thermal.id == self.cluster_id),
            None,
        )
        if thermal is None:
            message = f"Thermal cluster '{self.cluster_id}' does not exist in the area '{self.area_id}'."
            return CommandOutput(status=False, message=message), {}

        for thermal in area.thermals:
            if thermal.id == self.cluster_id:
                break
        else:
            message = f"Thermal cluster '{self.cluster_id}' does not exist in the area '{self.area_id}'."
            return CommandOutput(status=False, message=message), {}

        # Remove the Thermal cluster from the configuration
        area.thermals.remove(thermal)

        remove_area_cluster_from_binding_constraints(study_data, self.area_id, self.cluster_id)

        message = f"Thermal cluster '{self.cluster_id}' removed from the area '{self.area_id}'."
        return CommandOutput(status=True, message=message), {}

    def _apply(self, study_data: FileStudy) -> CommandOutput:
        """
        Applies the study data to update thermal cluster configurations and saves the changes:
        remove corresponding the configuration and remove the attached time series.

        Args:
            study_data: The study data to be applied.

        Returns:
            The output of the command execution.
        """
        # Search the Area in the configuration
        if self.area_id not in study_data.config.areas:
            message = f"Area '{self.area_id}' does not exist in the study configuration."
            return CommandOutput(status=False, message=message)

        # It is required to delete the files and folders that correspond to the thermal cluster
        # BEFORE updating the configuration, as we need the configuration to do so.
        # Specifically, deleting the time series uses the list of thermal clusters from the configuration.

        series_id = self.cluster_id.lower()
        paths = [
            ["input", "thermal", "clusters", self.area_id, "list", self.cluster_id],
            ["input", "thermal", "prepro", self.area_id, series_id],
            ["input", "thermal", "series", self.area_id, series_id],
        ]
        area: Area = study_data.config.areas[self.area_id]
        if len(area.thermals) == 1:
            paths.append(["input", "thermal", "prepro", self.area_id])
            paths.append(["input", "thermal", "series", self.area_id])

        for path in paths:
            study_data.tree.delete(path)

        self._remove_cluster_from_binding_constraints(study_data)

        # Deleting the renewable cluster in the configuration must be done AFTER
        # deleting the files and folders.
        return self._apply_config(study_data.config)[0]

    def to_dto(self) -> CommandDTO:
        return CommandDTO(
            action=self.command_name.value,
            args={"area_id": self.area_id, "cluster_id": self.cluster_id},
        )

    def match_signature(self) -> str:
        return str(
            self.command_name.value
            + MATCH_SIGNATURE_SEPARATOR
            + self.cluster_id
            + MATCH_SIGNATURE_SEPARATOR
            + self.area_id
        )

    def match(self, other: ICommand, equal: bool = False) -> bool:
        if not isinstance(other, RemoveCluster):
            return False
        return self.cluster_id == other.cluster_id and self.area_id == other.area_id

    def _create_diff(self, other: "ICommand") -> List["ICommand"]:
        return []

    def get_inner_matrices(self) -> List[str]:
        return []

    # noinspection SpellCheckingInspection
    def _remove_cluster_from_binding_constraints(self, study_data: FileStudy) -> None:
        config = study_data.tree.get(["input", "bindingconstraints", "bindingconstraints"])

        # Binding constraints IDs to remove
        ids_to_remove = set()

        # Cluster IDs are stored in lower case in the binding contraints configuration file.
        cluster_id = self.cluster_id.lower()
        for bc_id, bc_props in config.items():
            if f"{self.area_id}.{cluster_id}" in bc_props.keys():
                ids_to_remove.add(bc_id)

        for bc_id in ids_to_remove:
            study_data.tree.delete(["input", "bindingconstraints", config[bc_id]["id"]])
            bc = next(iter([bind for bind in study_data.config.bindings if bind.id == config[bc_id]["id"]]))
            study_data.config.bindings.remove(bc)
            del config[bc_id]

        study_data.tree.save(
            config,
            ["input", "bindingconstraints", "bindingconstraints"],
        )
