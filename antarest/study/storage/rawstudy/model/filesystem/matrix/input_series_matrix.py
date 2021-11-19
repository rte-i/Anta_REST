import logging
from typing import List, Optional

import pandas as pd  # type: ignore
from pandas.errors import EmptyDataError  # type: ignore

from antarest.core.model import JSON
from antarest.study.storage.rawstudy.model.filesystem.config.model import (
    FileStudyTreeConfig,
)
from antarest.study.storage.rawstudy.model.filesystem.context import (
    ContextServer,
)
from antarest.study.storage.rawstudy.model.filesystem.inode import TREE
from antarest.study.storage.rawstudy.model.filesystem.matrix.matrix import (
    MatrixNode,
)

logger = logging.getLogger(__name__)


class InputSeriesMatrix(MatrixNode):
    """
    Generic node to handle input matrix behavior
    """

    def __init__(
        self,
        context: ContextServer,
        config: FileStudyTreeConfig,
        nb_columns: Optional[int] = None,
    ):
        super().__init__(context=context, config=config, freq="hourly")
        self.nb_columns = nb_columns

    def parse(
        self,
    ) -> JSON:
        try:
            matrix: pd.DataFrame = pd.read_csv(
                self.config.path,
                sep="\t",
                dtype=float,
                header=None,
            )
            matrix.dropna(how="any", axis=1, inplace=True)
            data: JSON = matrix.to_dict(orient="split")

            return data
        except EmptyDataError:
            logger.warning(f"Empty file found when parsing {self.config.path}")
            return {}

    def _dump_json(self, data: JSON) -> None:
        df = pd.DataFrame(**data)
        if not df.empty:
            df.to_csv(
                self.config.path,
                sep="\t",
                header=False,
                index=False,
                float_format="%.6f",
            )
        else:
            self.config.path.write_bytes(b"")

    def check_errors(
        self,
        data: JSON,
        url: Optional[List[str]] = None,
        raising: bool = False,
    ) -> List[str]:
        self._assert_url_end(url)

        errors = []
        if not self.config.path.exists():
            errors.append(
                f"Input Series Matrix f{self.config.path} not exists"
            )
        if self.nb_columns and len(data) != self.nb_columns:
            errors.append(
                f"{self.config.path}: Data was wrong size. expected {self.nb_columns} get {len(data)}"
            )
        return errors
