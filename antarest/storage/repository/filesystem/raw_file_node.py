import shutil
from typing import List, Optional

from antarest.storage.repository.filesystem.config.model import StudyConfig
from antarest.storage.repository.filesystem.inode import INode, TREE
from antarest.storage.repository.filesystem.lazy_node import LazyNode


class RawFileNode(LazyNode[str, str, str]):
    def __init__(self, config: StudyConfig):
        self.config = config

    def build(self, config: StudyConfig) -> TREE:
        pass  # end node has nothing to build

    def load(
        self,
        url: Optional[List[str]] = None,
        depth: int = -1,
        expanded: bool = False,
    ) -> str:
        return self.config.path.read_text()

    def dump(self, data: str, url: Optional[List[str]] = None) -> None:
        self.config.path.write_text(data)

    def check_errors(
        self, data: str, url: Optional[List[str]] = None, raising: bool = False
    ) -> List[str]:
        if not self.config.path.exists():
            msg = f"{self.config.path} not exist"
            if raising:
                raise ValueError(msg)
            return [msg]
        return []