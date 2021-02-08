from antarest.storage.filesystem.config.model import StudyConfig
from antarest.storage.filesystem.folder_node import FolderNode
from antarest.storage.filesystem.inode import TREE
from antarest.storage.filesystem.root.input.hydro.common.capacity.capacity import (
    InputHydroCommonCapacity,
)


class InputHydroCommon(FolderNode):
    def build(self, config: StudyConfig) -> TREE:
        children: TREE = {
            "capacity": InputHydroCommonCapacity(config.next_file("capacity"))
        }
        return children
