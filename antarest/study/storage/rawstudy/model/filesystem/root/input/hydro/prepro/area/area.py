from antarest.study.storage.rawstudy.model.filesystem.config.model import (
    FileStudyTreeConfig,
)
from antarest.study.storage.rawstudy.model.filesystem.folder_node import (
    FolderNode,
)
from antarest.study.storage.rawstudy.model.filesystem.inode import TREE
from antarest.study.storage.rawstudy.model.filesystem.root.input.hydro.prepro.area.energy import (
    InputHydroPreproAreaEnergy,
)
from antarest.study.storage.rawstudy.model.filesystem.root.input.hydro.prepro.area.prepro import (
    InputHydroPreproAreaPrepro,
)


class InputHydroPreproArea(FolderNode):
    def build(self, config: FileStudyTreeConfig) -> TREE:
        children: TREE = {
            "energy": InputHydroPreproAreaEnergy(
                self.context, config.next_file("energy.txt")
            ),
            "prepro": InputHydroPreproAreaPrepro(
                self.context, config.next_file("prepro.ini")
            ),
        }
        return children