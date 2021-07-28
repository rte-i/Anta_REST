from typing import List, Optional, cast, Dict, Any

from antarest.core.custom_types import JSON, SUB_JSON
from antarest.study.storage.rawstudy.io.reader import IniReader
from antarest.study.storage.rawstudy.io.reader.ini_reader import IReader
from antarest.study.storage.rawstudy.io.writer.ini_writer import IniWriter
from antarest.study.storage.rawstudy.model.filesystem.config.model import (
    FileStudyTreeConfig,
)
from antarest.study.storage.rawstudy.model.filesystem.inode import (
    INode,
    TREE,
)
from antarest.study.storage.rawstudy.model.filesystem.context import (
    ContextServer,
)


class IniReaderError(Exception):
    """
    Left node to handle .ini file behavior
    """

    def __init__(self, name: str, mes: str):
        super(IniReaderError, self).__init__(f"Error read node {name} = {mes}")


class IniFileNode(INode[SUB_JSON, SUB_JSON, JSON]):
    def __init__(
        self,
        context: ContextServer,
        config: FileStudyTreeConfig,
        types: Dict[str, Any],
        reader: Optional[IReader] = None,
    ):
        self.context = context
        self.path = config.path
        self.types = types
        self.reader = reader or IniReader()
        self.writer = IniWriter()

    def build(self, config: FileStudyTreeConfig) -> TREE:
        pass  # end node has nothing to build

    def get(
        self,
        url: Optional[List[str]] = None,
        depth: int = -1,
        expanded: bool = False,
        formatted: bool = True,
    ) -> SUB_JSON:
        if depth == 0:
            return {}
        url = url or []
        try:
            json = self.reader.read(self.path)
        except Exception as e:
            raise IniReaderError(self.__class__.__name__, str(e))
        if len(url) == 2:
            json = json[url[0]][url[1]]
        elif len(url) == 1:
            json = json[url[0]]
        else:
            json = {k: {} for k in json} if depth == 1 else json
        return cast(SUB_JSON, json)

    def save(self, data: SUB_JSON, url: Optional[List[str]] = None) -> None:
        url = url or []
        json = self.reader.read(self.path) if self.path.exists() else {}
        if len(url) == 2:
            json[url[0]][url[1]] = data
        elif len(url) == 1:
            json[url[0]] = data
        else:
            json = cast(JSON, data)
        self.writer.write(json, self.path)

    def check_errors(
        self,
        data: JSON,
        url: Optional[List[str]] = None,
        raising: bool = False,
    ) -> List[str]:
        errors = list()
        for section, params in self.types.items():
            if section not in data:
                msg = f"section {section} not in {self.__class__.__name__}"
                if raising:
                    raise ValueError(msg)
                errors.append(msg)
            else:
                self._validate_param(
                    section, params, data[section], errors, raising
                )

        return errors

    def normalize(self) -> None:
        pass  # no external store in this node

    def denormalize(self) -> None:
        pass  # no external store in this node

    def _validate_param(
        self,
        section: str,
        params: Any,
        data: JSON,
        errors: List[str],
        raising: bool,
    ) -> None:
        for param, typing in params.items():
            if param not in data:
                msg = f"param {param} of section {section} not in {self.__class__.__name__}"
                if raising:
                    raise ValueError(msg)
                errors.append(msg)
            else:
                if not isinstance(data[param], typing):
                    msg = f"param {param} of section {section} in {self.__class__.__name__} bad type"
                    if raising:
                        raise ValueError(msg)
                    errors.append(msg)