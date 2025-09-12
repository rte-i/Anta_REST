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

import { useMemo, useState,useEffect } from "react";
import { useOutletContext } from "react-router";
import useAppSelector from "../../../../../../../redux/hooks/useAppSelector";
import { getCurrentAreaId } from "../../../../../../../redux/selectors";
import type { StudyMetadata } from "../../../../../../../types/types";
import TabWrapper from "../../../TabWrapper";
import { getAdvancedParamsFormFields } from "../../../Configuration/AdvancedParameters/utils";

function Hydro() {
  const { study } = useOutletContext<{ study: StudyMetadata }>();
  const areaId = useAppSelector(getCurrentAreaId);
  const studyVersion = Number(study.version);
  const [hydroRuleCurves, setHydroRuleCurves] = useState<string>("");


  useEffect(() => {
    getAdvancedParamsFormFields(study.id).then((data) => {
      setHydroRuleCurves(data.hydroRuleCurves || "");
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
      ...(studyVersion >= 930 && hydroRuleCurves === "scenarized"
        ? [
          { label: "Max Reservoir Levels", path: `${basePath}/maxDailyReservoirLevels` },
          { label: "Min Reservoir Levels", path: `${basePath}/minDailyReservoirLevels` },
          { label: "Avg Reservoir Levels", path: `${basePath}/avgDailyReservoirLevels` },
        ]
        : []),
    ].filter(Boolean);
  }, [areaId, study?.id, studyVersion,hydroRuleCurves]);

  ////////////////////////////////////////////////////////////////
  // JSX
  ////////////////////////////////////////////////////////////////

  return <TabWrapper study={study} tabList={tabList} />;
}

export default Hydro;
