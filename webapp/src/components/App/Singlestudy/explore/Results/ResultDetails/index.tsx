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

import {
  Box,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupProps,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useOutletContext, useParams } from "react-router";
import GridOffIcon from "@mui/icons-material/GridOff";
import {
  Area,
  LinkElement,
  StudyMetadata,
} from "../../../../../../common/types";
import usePromise from "../../../../../../hooks/usePromise";
import useAppSelector from "../../../../../../redux/hooks/useAppSelector";
import {
  getAreas,
  getLinks,
  getStudyOutput,
} from "../../../../../../redux/selectors";
import { getStudyData } from "../../../../../../services/api/study";
import { isSearchMatching } from "../../../../../../utils/stringUtils";
import PropertiesView from "../../../../../common/PropertiesView";
import ListElement from "../../common/ListElement";
import {
  createPath,
  DataType,
  MAX_YEAR,
  OutputItemType,
  SYNTHESIS_ITEMS,
  Timestep,
} from "./utils";
import UsePromiseCond, {
  mergeResponses,
} from "../../../../../common/utils/UsePromiseCond";
import useStudySynthesis from "../../../../../../redux/hooks/useStudySynthesis";
import ButtonBack from "../../../../../common/ButtonBack";
import MatrixGrid from "../../../../../common/Matrix/components/MatrixGrid/index.tsx";
import {
  generateCustomColumns,
  generateDateTime,
  generateResultColumns,
  groupResultColumns,
} from "../../../../../common/Matrix/shared/utils.ts";
import { Column } from "@/components/common/Matrix/shared/constants.ts";
import SplitView from "../../../../../common/SplitView/index.tsx";
import ResultFilters from "./ResultFilters.tsx";
import { toError } from "../../../../../../utils/fnUtils.ts";
import EmptyView from "../../../../../common/page/SimpleContent.tsx";
import { getStudyMatrixIndex } from "../../../../../../services/api/matrix.ts";
import { MatrixGridSynthesis } from "@/components/common/Matrix/components/MatrixGridSynthesis";
import { ResultMatrixDTO } from "@/components/common/Matrix/shared/types.ts";

function ResultDetails() {
  const { study } = useOutletContext<{ study: StudyMetadata }>();
  const { outputId } = useParams();

  const outputRes = useStudySynthesis({
    studyId: study.id,
    selector: (state, id) => getStudyOutput(state, id, outputId as string),
  });

  const { data: output } = outputRes;
  const [dataType, setDataType] = useState(DataType.General);
  const [timestep, setTimestep] = useState(Timestep.Hourly);
  const [year, setYear] = useState(-1);
  const [itemType, setItemType] = useState(OutputItemType.Areas);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [resultColHeaders, setResultColHeaders] = useState<string[][]>([]);
  const isSynthesis = itemType === OutputItemType.Synthesis;
  const { t } = useTranslation();
  const navigate = useNavigate();

  const items = useAppSelector((state) =>
    itemType === OutputItemType.Areas
      ? getAreas(state, study.id)
      : getLinks(state, study.id),
  ) as Array<{ id: string; name: string; label?: string }>;

  const filteredItems = useMemo(() => {
    return isSynthesis
      ? SYNTHESIS_ITEMS
      : items.filter((item) =>
          isSearchMatching(searchValue, item.label || item.name),
        );
  }, [isSynthesis, items, searchValue]);

  const selectedItem = filteredItems.find(
    (item) => item.id === selectedItemId,
  ) as (Area & { id: string }) | LinkElement | undefined;

  const maxYear = output?.nbyears ?? MAX_YEAR;

  useEffect(
    () => {
      const isValidSelectedItem =
        !!selectedItemId &&
        filteredItems.find((item) => item.id === selectedItemId);

      if (!isValidSelectedItem) {
        setSelectedItemId(filteredItems.length > 0 ? filteredItems[0].id : "");
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filteredItems],
  );

  const path = useMemo(() => {
    if (output && selectedItem && !isSynthesis) {
      return createPath({
        output,
        item: selectedItem,
        dataType,
        timestep,
        year,
      });
    }
    return "";
  }, [output, selectedItem, isSynthesis, dataType, timestep, year]);

  const matrixRes = usePromise<ResultMatrixDTO | undefined>(
    async () => {
      if (!path) {
        return undefined;
      }

      const res = await getStudyData(study.id, path);
      // TODO add backend parse
      if (typeof res === "string") {
        const fixed = res
          .replace(/NaN/g, '"NaN"')
          .replace(/Infinity/g, '"Infinity"');

        return JSON.parse(fixed);
      }

      return res;
    },
    {
      resetDataOnReload: true,
      resetErrorOnReload: true,
      deps: [study.id, path],
    },
  );

  const synthesisRes = usePromise(
    () => {
      if (outputId && selectedItem && isSynthesis) {
        const path = `output/${outputId}/economy/mc-all/grid/${selectedItem.id}`;
        return getStudyData(study.id, path);
      }

      return Promise.resolve(null);
    },
    {
      deps: [study.id, outputId, selectedItem],
    },
  );

  const { data: dateTimeMetadata } = usePromise(
    () => getStudyMatrixIndex(study.id, path),
    {
      deps: [study.id, path],
    },
  );

  const dateTime = dateTimeMetadata && generateDateTime(dateTimeMetadata);

  const resultColumns = useMemo(() => {
    if (!matrixRes.data) {
      return [];
    }

    return groupResultColumns([
      {
        id: "date",
        title: "Date",
        type: Column.DateTime,
        editable: false,
      },
      ...generateResultColumns(resultColHeaders),
    ]);
  }, [matrixRes.data, resultColHeaders]);

  ////////////////////////////////////////////////////////////////
  // Event Handlers
  ////////////////////////////////////////////////////////////////

  const handleItemTypeChange: ToggleButtonGroupProps["onChange"] = (
    _,
    newValue: OutputItemType,
  ) => {
    if (newValue && newValue !== itemType) {
      setItemType(newValue);
    }
  };

  ////////////////////////////////////////////////////////////////
  // JSX
  ////////////////////////////////////////////////////////////////

  return (
    <SplitView id="results" sizes={[15, 85]}>
      {/* Left */}
      <Box>
        <PropertiesView
          topContent={
            <Box sx={{ width: 1, px: 1 }}>
              <ButtonBack onClick={() => navigate("..")} />
            </Box>
          }
          mainContent={
            <>
              <ToggleButtonGroup
                sx={{ p: 1 }}
                value={itemType}
                exclusive
                size="small"
                orientation="vertical"
                fullWidth
                onChange={handleItemTypeChange}
              >
                <ToggleButton value={OutputItemType.Areas}>
                  {t("study.areas")}
                </ToggleButton>
                <ToggleButton value={OutputItemType.Links}>
                  {t("study.links")}
                </ToggleButton>
                <ToggleButton value={OutputItemType.Synthesis}>
                  {t("study.synthesis")}
                </ToggleButton>
              </ToggleButtonGroup>
              <ListElement
                list={filteredItems}
                currentElement={selectedItemId}
                currentElementKeyToTest="id"
                setSelectedItem={(item) => setSelectedItemId(item.id)}
              />
            </>
          }
          onSearchFilterChange={setSearchValue}
        />
      </Box>
      {/* Right */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          p: 1,
        }}
      >
        {isSynthesis ? (
          <UsePromiseCond
            response={synthesisRes}
            ifPending={() => <Skeleton sx={{ height: 1, transform: "none" }} />}
            ifFulfilled={(matrix) =>
              matrix && (
                <MatrixGridSynthesis
                  data={matrix.data}
                  columns={generateCustomColumns({
                    titles: matrix.columns,
                  })}
                />
              )
            }
          />
        ) : (
          <>
            <ResultFilters
              year={year}
              setYear={setYear}
              dataType={dataType}
              setDataType={setDataType}
              timestep={timestep}
              setTimestep={setTimestep}
              maxYear={maxYear}
              studyId={study.id}
              path={path}
              colHeaders={matrixRes.data?.columns || []}
              onColHeadersChange={setResultColHeaders}
            />
            <UsePromiseCond
              response={mergeResponses(outputRes, matrixRes)}
              ifPending={() => (
                <Skeleton sx={{ height: 1, transform: "none" }} />
              )}
              ifFulfilled={([, matrix]) =>
                matrix && (
                  <>
                    {resultColHeaders.length === 0 ? (
                      <EmptyView
                        title={t("study.results.noData")}
                        icon={GridOffIcon}
                      />
                    ) : (
                      <MatrixGrid
                        key={`grid-${resultColHeaders.length}`}
                        data={matrix.data}
                        rows={matrix.data.length}
                        columns={resultColumns}
                        dateTime={dateTime}
                        readOnly
                      />
                    )}
                  </>
                )
              }
              ifRejected={(err) => (
                <EmptyView
                  title={
                    toError(err).message.includes("404")
                      ? t("study.results.noData")
                      : t("data.error.matrix")
                  }
                  icon={GridOffIcon}
                />
              )}
            />
          </>
        )}
      </Box>
    </SplitView>
  );
}

export default ResultDetails;
