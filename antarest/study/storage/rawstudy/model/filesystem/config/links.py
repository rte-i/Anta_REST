# Copyright (c) 2024, RTE (https://www.rte-france.com)
#
# See AUTHORS.txt
#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#
# SPDX-License-Identifier: MPL-2.0
#
# This file is part of the Antares project.

"""
Object model used to read and update link configuration.
"""

import typing as t

from pydantic import BeforeValidator, Field, PlainSerializer, field_validator, model_validator

from antarest.core.exceptions import LinkValidationError
from antarest.study.business.enum_ignore_case import EnumIgnoreCase
from antarest.study.storage.rawstudy.model.filesystem.config.field_validators import (
    validate_color_rgb,
    validate_colors,
    validate_filtering,
)
from antarest.study.storage.rawstudy.model.filesystem.config.ini_properties import IniProperties


# noinspection SpellCheckingInspection
class AssetType(EnumIgnoreCase):
    """
    Enum representing the type of asset for a link between two areas.

    Attributes:
        AC: Represents an Alternating Current link. This is the most common type of electricity transmission.
        DC: Represents a Direct Current link. This is typically used for long-distance transmission.
        GAZ: Represents a gas link. This is used when the link is related to gas transmission.
        VIRT: Represents a virtual link. This is used when the link doesn't physically exist
            but is used for modeling purposes.
        OTHER: Represents any other type of link that doesn't fall into the above categories.
    """

    AC = "ac"
    DC = "dc"
    GAZ = "gaz"
    VIRT = "virt"
    OTHER = "other"


class TransmissionCapacity(EnumIgnoreCase):
    """
    Enum representing the transmission capacity of a link.

    Attributes:
        INFINITE: Represents a link with infinite transmission capacity.
            This means there are no limits on the amount of electricity that can be transmitted.
        IGNORE: Represents a link where the transmission capacity is ignored.
            This means the capacity is not considered during simulations.
        ENABLED: Represents a link with a specific transmission capacity.
            This means the capacity is considered in the model and has a certain limit.
    """

    INFINITE = "infinite"
    IGNORE = "ignore"
    ENABLED = "enabled"


class LinkStyle(EnumIgnoreCase):
    """
    Enum representing the style of a link in a network visualization.

    Attributes:
        DOT: Represents a dotted line style.
        PLAIN: Represents a solid line style.
        DASH: Represents a dashed line style.
        DOT_DASH: Represents a line style with alternating dots and dashes.
    """

    DOT = "dot"
    PLAIN = "plain"
    DASH = "dash"
    DOT_DASH = "dotdash"
    OTHER = "other"


class FilterOption(EnumIgnoreCase):
    """
    Enum representing the time filter options for data visualization or analysis in Antares Web.

    Attributes:
        HOURLY: Represents filtering data by the hour.
        DAILY: Represents filtering data by the day.
        WEEKLY: Represents filtering data by the week.
        MONTHLY: Represents filtering data by the month.
        ANNUAL: Represents filtering data by the year.
    """

    HOURLY = "hourly"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    ANNUAL = "annual"


def validate_filters(
    filter_value: t.Union[t.List[FilterOption], str], enum_cls: t.Type[FilterOption]
) -> t.List[FilterOption]:
    if isinstance(filter_value, str):
        if not filter_value.strip():
            return []

        filter_accepted_values = [e for e in enum_cls]

        options = filter_value.replace(" ", "").split(",")

        invalid_options = [opt for opt in options if opt not in filter_accepted_values]
        if invalid_options:
            raise LinkValidationError(
                f"Invalid value(s) in filters: {', '.join(invalid_options)}. "
                f"Allowed values are: {', '.join(filter_accepted_values)}."
            )

        return [enum_cls(opt) for opt in options]

    return filter_value


def join_with_comma(values: t.List[FilterOption]) -> str:
    return ", ".join(value.name.lower() for value in values)


comma_separated_enum_list = t.Annotated[
    t.List[FilterOption],
    BeforeValidator(lambda x: validate_filters(x, FilterOption)),
    PlainSerializer(lambda x: join_with_comma(x)),
]


class LinkProperties(IniProperties):
    """
    Configuration read from a section in the `input/links/<area1>/properties.ini` file.

    Usage:

    >>> from antarest.study.storage.rawstudy.model.filesystem.config.links import LinkProperties
    >>> from pprint import pprint

    Create and validate a new `LinkProperties` object from a dictionary read from a configuration file.

    >>> obj = {
    ...     "hurdles-cost": "false",
    ...     "loop-flow": "false",
    ...     "use-phase-shifter": "false",
    ...     "transmission-capacities": "infinite",
    ...     "asset-type": "ac",
    ...     "link-style": "plain",
    ...     "link-width": "1",
    ...     "colorr": "80",
    ...     "colorg": "192",
    ...     "colorb": "255",
    ...     "comments": "This is a link",
    ...     "display-comments": "true",
    ...     "filter-synthesis": "hourly, daily, weekly, monthly, annual",
    ...     "filter-year-by-year": "hourly, daily, weekly, monthly, annual",
    ... }

    >>> opt = LinkProperties(**obj)

    >>> pprint(opt.model_dump(by_alias=True), width=80)
    {'asset-type': <AssetType.AC: 'ac'>,
     'colorRgb': '#50C0FF',
     'comments': 'This is a link',
     'display-comments': True,
     'filter-synthesis': 'hourly, daily, weekly, monthly, annual',
     'filter-year-by-year': 'hourly, daily, weekly, monthly, annual',
     'hurdles-cost': False,
     'link-style': 'plain',
     'link-width': 1,
     'loop-flow': False,
     'transmission-capacities': <TransmissionCapacity.INFINITE: 'infinite'>,
     'use-phase-shifter': False}

    >>> pprint(opt.to_config(), width=80)
    {'asset-type': 'ac',
     'colorb': 255,
     'colorg': 192,
     'colorr': 80,
     'comments': 'This is a link',
     'display-comments': True,
     'filter-synthesis': 'hourly, daily, weekly, monthly, annual',
     'filter-year-by-year': 'hourly, daily, weekly, monthly, annual',
     'hurdles-cost': False,
     'link-style': 'plain',
     'link-width': 1,
     'loop-flow': False,
     'transmission-capacities': 'infinite',
     'use-phase-shifter': False}
    """

    hurdles_cost: bool = Field(default=False, alias="hurdles-cost")
    loop_flow: bool = Field(default=False, alias="loop-flow")
    use_phase_shifter: bool = Field(default=False, alias="use-phase-shifter")
    transmission_capacities: TransmissionCapacity = Field(
        default=TransmissionCapacity.ENABLED, alias="transmission-capacities"
    )
    asset_type: AssetType = Field(default=AssetType.AC, alias="asset-type")
    link_style: str = Field(default="plain", alias="link-style")
    link_width: int = Field(default=1, alias="link-width")
    comments: str = Field(default="", alias="comments")  # unknown field?!
    display_comments: bool = Field(default=True, alias="display-comments")
    filter_synthesis: str = Field(default="", alias="filter-synthesis")
    filter_year_by_year: str = Field(default="", alias="filter-year-by-year")
    color_rgb: str = Field(
        "#707070",
        alias="colorRgb",
        description="color of the area in the map",
    )

    @field_validator("filter_synthesis", "filter_year_by_year", mode="before")
    def _validate_filtering(cls, v: t.Any) -> str:
        return validate_filtering(v)

    @field_validator("color_rgb", mode="before")
    def _validate_color_rgb(cls, v: t.Any) -> str:
        return validate_color_rgb(v)

    @model_validator(mode="before")
    def _validate_colors(cls, values: t.MutableMapping[str, t.Any]) -> t.Mapping[str, t.Any]:
        return validate_colors(values)
