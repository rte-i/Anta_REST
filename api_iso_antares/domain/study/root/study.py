from typing import Dict, Optional

from api_iso_antares.domain.study.inode import TREE
from api_iso_antares.domain.study.config import Config
from api_iso_antares.domain.study.default_node import DefaultNode
from api_iso_antares.domain.study.root.desktop import Desktop
from api_iso_antares.domain.study.root.layers.layers import Layers
from api_iso_antares.domain.study.root.settings.settings import Settings
from api_iso_antares.domain.study.root.study_antares import StudyAntares


class Study(DefaultNode):
    def __init__(self, config: Config):
        children = {
            "desktop": Desktop(config.next_file("Desktop.ini")),
            "study": StudyAntares(config.next_file("study.antares")),
            "settings": Settings(config.next_file("settings")),
            "layers": Layers(config.next_file("layers")),
        }
        DefaultNode.__init__(self, children)
