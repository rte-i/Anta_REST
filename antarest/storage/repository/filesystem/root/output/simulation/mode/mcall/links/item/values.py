from antarest.storage.repository.filesystem.config.model import StudyConfig
from antarest.storage.repository.filesystem.matrix.date_serializer import (
    FactoryDateSerializer,
)
from antarest.storage.repository.filesystem.matrix.head_writer import (
    LinkHeadWriter,
)
from antarest.storage.repository.filesystem.matrix.output_series_matrix import (
    OutputSeriesMatrix,
)


class OutputSimulationModeMcAllLinksItemValues(OutputSeriesMatrix):
    def __init__(self, config: StudyConfig, freq: str, src: str, dest: str):
        super(OutputSimulationModeMcAllLinksItemValues, self).__init__(
            config=config,
            date_serializer=FactoryDateSerializer.create(freq, src),
            head_writer=LinkHeadWriter(src, dest, freq),
        )