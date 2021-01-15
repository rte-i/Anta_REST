from api_iso_antares.filesystem.config.model import Config
from api_iso_antares.filesystem.folder_node import FolderNode
from api_iso_antares.filesystem.inode import TREE
from api_iso_antares.filesystem.root.output.simulation.mode.mcind.scn.areas.item.area import (
    OutputSimulationModeMcIndScnAreasArea as Area,
)
from api_iso_antares.filesystem.root.output.simulation.mode.mcind.scn.areas.item.set import (
    OutputSimulationModeMcIndScnAreasSet as Set,
)


class OutputSimulationModeMcIndScnAreas(FolderNode):
    def build(self, config: Config) -> TREE:
        children: TREE = {
            a: Area(config.next_file(a), area=a) for a in config.area_names()
        }

        for s in config.set_names():
            children[f"@ {s}"] = Set(config.next_file(f"@ {s}"), set=s)
        return children
