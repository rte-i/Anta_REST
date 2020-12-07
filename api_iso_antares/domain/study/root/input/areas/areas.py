from api_iso_antares.domain.study.config import Config
from api_iso_antares.domain.study.folder_node import FolderNode
from api_iso_antares.domain.study.inode import TREE
from api_iso_antares.domain.study.root.input.areas.item.item import (
    InputAreasItem,
)
from api_iso_antares.domain.study.root.input.areas.list import InputAreasList


class InputAreas(FolderNode):
    def __init__(self, config: Config):
        children: TREE = {
            a: InputAreasItem(config.next_file(a)) for a in config.area_names
        }
        children["list"] = InputAreasList(config.next_file("list.txt"))
        FolderNode.__init__(self, children)
