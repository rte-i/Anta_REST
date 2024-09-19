/**
 * Copyright (c) 2024, RTE (https://www.rte-france.com)
 *
 * See AUTHORS.txt
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * SPDX-License-Identifier: MPL-2.0
 *
 * This file is part of the Antares project.
 */

import * as RA from "ramda-adjunct";
import { RoleType } from "../../../common/types";

export const RESERVED_USER_NAMES = ["admin"];
export const RESERVED_GROUP_NAMES = ["admin"];

export const ROLE_TYPE_KEYS = Object.values(RoleType).filter(
  RA.isString,
) as Array<keyof typeof RoleType>;
