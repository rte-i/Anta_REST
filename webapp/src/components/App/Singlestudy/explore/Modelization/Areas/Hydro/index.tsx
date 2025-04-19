/**
 * Copyright (c) 2025, RTE (https://www.rte-france.com)
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

import { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router";
import type { StudyMetadata } from "../../../../../../../common/types";
import TabWrapper from "../../../TabWrapper";
import useAppSelector from "../../../../../../../redux/hooks/useAppSelector";
import { getCurrentAreaId } from "../../../../../../../redux/selectors";
import {
  getAdvancedParamsFormFields,
  type AdvancedParamsFormFields,
} from "../../../Configuration/AdvancedParameters/utils";

function Hydro() {
  const { study } = useOutletContext<{ study: StudyMetadata }>();
  const areaId = useAppSelector(getCurrentAreaId);
  const studyVersion = parseInt(study.version, 10);

  // State to store whether to show reservoir levels ts tab(s) or not
  const [showResLevelsTs, setShowResLevelsTs] = useState<boolean>(true);
  // State to store whether to show Pmax ts tab(s) or not
  const [showPmaxTs, setShowPmaxTs] = useState<boolean>(true);

  // Fetch advanced parameters and set both flags accordingly
  useEffect(() => {
    getAdvancedParamsFormFields(study.id).then((advancedParams: AdvancedParamsFormFields) => {
      setShowResLevelsTs(advancedParams.hydroRuleCurves !== "single");
      setShowPmaxTs(advancedParams.hydroPmax !== "daily");
    });
  }, [study.id]);

  const tabList = useMemo(() => {
    const basePath = `/studies/${study?.id}/explore/modelization/area/${encodeURI(areaId)}/hydro`;

    return [
      { label: "Management options", path: `${basePath}/management` },
      { label: "Inflow structure", path: `${basePath}/inflow-structure` },
      { label: "Allocation", path: `${basePath}/allocation` },
      { label: "Correlation", path: `${basePath}/correlation` },
      {
        label: "Daily Power & Energy Credits",
        path: `${basePath}/dailypower&energy`,
      },
      { label: "Reservoir levels", path: `${basePath}/reservoirlevels` },
      { label: "Water values", path: `${basePath}/watervalues` },
      { label: "Hydro Storage", path: `${basePath}/hydrostorage` },
      { label: "Run of river", path: `${basePath}/ror` },
      studyVersion >= 860 && { label: "Min Gen", path: `${basePath}/mingen` },
      ...(studyVersion >= 920 && showResLevelsTs
        ? [
            {
              label: "Min Res Level",
              path: `${basePath}/minDailyReservoirLevels`,
            },
            {
              label: "Avg Res Level",
              path: `${basePath}/avgDailyReservoirLevels`,
            },
            {
              label: "Max Res Level",
              path: `${basePath}/maxDailyReservoirLevels`,
            },
          ]
        : []),
      ...(studyVersion >= 920 && showPmaxTs
        ? [
            {
              label: "Max Gen",
              path: `${basePath}/maxHourlyGenPower`,
            },
            {
              label: "Max Pump",
              path: `${basePath}/maxHourlyPumpPower`,
            },
          ]
        : []),
    ].filter(Boolean);
  }, [areaId, study?.id, studyVersion, showPmaxTs, showResLevelsTs]);

  ////////////////////////////////////////////////////////////////
  // JSX
  ////////////////////////////////////////////////////////////////

  return <TabWrapper study={study} tabList={tabList} tabStyle="withoutBorder" />;
}

export default Hydro;
