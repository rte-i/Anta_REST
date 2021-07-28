import enum
import uuid
from typing import Any, List

from dataclasses import dataclass
from dataclasses_json import DataClassJsonMixin  # type: ignore
from datetime import datetime
from pydantic import BaseModel
from sqlalchemy import Column, String, Enum, DateTime, Table, ForeignKey, Integer, Boolean  # type: ignore
from sqlalchemy.orm import relationship  # type: ignore
from sqlalchemy.orm.collections import attribute_mapped_collection  # type: ignore

from antarest.core.persistence import Base
from antarest.login.model import GroupDTO, Identity, UserInfo


class Matrix(Base):  # type: ignore
    __tablename__ = "matrix"

    id = Column(String(64), primary_key=True)
    width = Column(Integer)
    height = Column(Integer)
    created_at = Column(DateTime)

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, Matrix):
            return False

        res: bool = (
            self.id == other.id
            and self.width == other.width
            and self.height == other.height
            and self.created_at == other.created_at
        )
        return res


class MatrixInfoDTO(BaseModel):
    id: str
    name: str


class MatrixDataSetDTO(BaseModel):
    id: str
    name: str
    matrices: List[MatrixInfoDTO]
    owner: UserInfo
    groups: List[GroupDTO]
    public: bool
    created_at: datetime
    updated_at: datetime


groups_dataset_relation = Table(
    "matrix_dataset_group",
    Base.metadata,
    Column(
        "dataset_id", String(64), ForeignKey("dataset.id"), primary_key=True
    ),
    Column("group_id", String(36), ForeignKey("groups.id"), primary_key=True),
)


class MatrixDataSetRelation(Base):  # type: ignore
    __tablename__ = "dataset_matrices"
    dataset_id = Column(
        String,
        ForeignKey("dataset.id", name="fk_matrixdatasetrelation_dataset_id"),
        primary_key=True,
    )
    matrix_id = Column(
        String,
        ForeignKey("matrix.id", name="fk_matrixdatasetrelation_matrix_id"),
        primary_key=True,
    )
    name = Column(String, primary_key=True)
    matrix = relationship(Matrix)

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, MatrixDataSetRelation):
            return False

        res: bool = (
            self.matrix_id == other.matrix_id
            and self.dataset_id == other.dataset_id
            and self.name == other.name
        )

        return res


class MatrixDataSet(Base):  # type: ignore
    __tablename__ = "dataset"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4()),
        unique=True,
    )
    name = Column(String)
    owner_id = Column(
        Integer,
        ForeignKey("identities.id", name="fk_matrixdataset_identities_id"),
    )
    public = Column(Boolean, default=False)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    owner = relationship(Identity)
    groups = relationship(
        "Group",
        secondary=lambda: groups_dataset_relation,
    )
    matrices = relationship(
        MatrixDataSetRelation, cascade="all, delete, delete-orphan"
    )

    def to_dto(self) -> MatrixDataSetDTO:
        return MatrixDataSetDTO(
            id=self.id,
            name=self.name,
            matrices=[
                MatrixInfoDTO(name=matrix.name, id=matrix.matrix.id)
                for matrix in self.matrices
            ],
            owner=UserInfo(id=self.owner.id, name=self.owner.name),
            groups=[
                GroupDTO(id=group.id, name=group.name) for group in self.groups
            ],
            public=self.public,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, MatrixDataSet):
            return False

        res: bool = (
            self.id == other.id
            and self.name == other.name
            and self.public == other.public
            and self.matrices == other.matrices
            and self.groups == other.groups
            and self.owner_id == other.owner_id
        )

        return res


class MatrixDTO(BaseModel):
    width: int
    height: int
    index: List[str]
    columns: List[str]
    data: List[List[int]]
    created_at: int = 0
    id: str = ""


@dataclass
class MatrixContent(DataClassJsonMixin):  # type: ignore
    data: List[List[int]]
    index: List[str]
    columns: List[str]


class MatrixDataSetUpdateDTO(BaseModel):
    name: str
    groups: List[str]
    public: bool