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

import type { AxiosRequestConfig } from "axios";
import type { StudyMetadata } from "../../../../common/types";
import { O } from "ts-toolbelt";
import { TableExportFormat } from "./constants";

export type TTableExportFormat = O.UnionOf<typeof TableExportFormat>;

export interface DownloadMatrixParams {
  studyId: StudyMetadata["id"];
  path: string;
  format?: TTableExportFormat;
  header?: boolean;
  index?: boolean;
}

export interface ImportFileParams {
  studyId: StudyMetadata["id"];
  path: string;
  file: File;
  createMissing?: boolean;
  onUploadProgress?: AxiosRequestConfig["onUploadProgress"];
}

export interface DeleteFileParams {
  studyId: StudyMetadata["id"];
  path: string;
}
