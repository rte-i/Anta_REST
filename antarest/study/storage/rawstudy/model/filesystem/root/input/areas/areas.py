from antarest.study.storage.rawstudy.model.filesystem.config.model import (
    FileStudyTreeConfig,
)
from antarest.study.storage.rawstudy.model.filesystem.folder_node import (
    FolderNode,
)
from antarest.study.storage.rawstudy.model.filesystem.inode import TREE
from antarest.study.storage.rawstudy.model.filesystem.root.input.areas.item.item import (
    InputAreasItem,
)
from antarest.study.storage.rawstudy.model.filesystem.root.input.areas.list import (
    InputAreasList,
)
from antarest.study.storage.rawstudy.model.filesystem.root.input.areas.sets import (
    InputAreasSets,
)


class InputAreas(FolderNode):
    def build(self, config: FileStudyTreeConfig) -> TREE:
        children: TREE = {
            a: InputAreasItem(self.context, config.next_file(a))
            for a in config.area_names()
        }
        children["list"] = InputAreasList(
            self.context, config.next_file("list.txt")
        )
        children["sets"] = InputAreasSets(
            self.context, config.next_file("sets.ini")
        )
        return children