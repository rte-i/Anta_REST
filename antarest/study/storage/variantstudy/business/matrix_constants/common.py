# Copyright (c) 2025, RTE (https://www.rte-france.com)
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


from typing import List, TypeAlias

import pandas as pd

# Define MatrixData as float for type annotation purposes
MatrixData: TypeAlias = float

NULL_MATRIX = pd.DataFrame()
NULL_SCENARIO_MATRIX = pd.DataFrame([[0.0]] * 8760)
FIXED_4_COLUMNS = pd.DataFrame([[0.0, 0.0, 0.0, 0.0]] * 8760)
FIXED_8_COLUMNS = pd.DataFrame([[0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]] * 8760)

DAILY_ROW_OF_24S: List[List[MatrixData]] = [[24.0]] * 365
DAILY_ROW_OF_1S: List[List[MatrixData]] = [[1.0]] * 365
DAILY_ROW_OF_0_5S: List[List[MatrixData]] = [[0.5]] * 365
DAILY_ROW_OF_0S: List[List[MatrixData]] = [[0.0]] * 365
