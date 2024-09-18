import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { DataType, Timestep } from "./utils";
import BooleanFE from "../../../../../common/fieldEditors/BooleanFE";
import SelectFE from "../../../../../common/fieldEditors/SelectFE";
import NumberFE from "../../../../../common/fieldEditors/NumberFE";
import DownloadMatrixButton from "../../../../../common/DownloadMatrixButton";

interface Props {
  year: number;
  setYear: (year: number) => void;
  dataType: DataType;
  setDataType: (dataType: DataType) => void;
  timestep: Timestep;
  setTimestep: (timestep: Timestep) => void;
  maxYear: number;
  studyId: string;
  path: string;
}

function ResultFilters({
  year,
  setYear,
  dataType,
  setDataType,
  timestep,
  setTimestep,
  maxYear,
  studyId,
  path,
}: Props) {
  const { t } = useTranslation();

  const controls = [
    {
      label: `${t("study.results.mc")}:`,
      control: (
        <>
          <BooleanFE
            value={year <= 0}
            trueText="Synthesis"
            falseText="Year by year"
            size="small"
            variant="outlined"
            onChange={(event) => {
              setYear(event?.target.value ? -1 : 1);
            }}
          />
          {year > 0 && (
            <NumberFE
              size="small"
              variant="outlined"
              value={year}
              sx={{ m: 0, ml: 1, width: 80 }}
              inputProps={{
                min: 1,
                max: maxYear,
              }}
              onChange={(event) => {
                setYear(Number(event.target.value));
              }}
            />
          )}
        </>
      ),
    },
    {
      label: `${t("study.results.display")}:`,
      control: (
        <SelectFE
          value={dataType}
          options={[
            { value: DataType.General, label: "General values" },
            { value: DataType.Thermal, label: "Thermal plants" },
            { value: DataType.Renewable, label: "Ren. clusters" },
            { value: DataType.Record, label: "RecordYears" },
            { value: DataType.STStorage, label: "ST Storages" },
          ]}
          size="small"
          variant="outlined"
          onChange={(event) => {
            setDataType(event?.target.value as DataType);
          }}
        />
      ),
    },
    {
      label: `${t("study.results.temporality")}:`,
      control: (
        <SelectFE
          value={timestep}
          options={[
            { value: Timestep.Hourly, label: "Hourly" },
            { value: Timestep.Daily, label: "Daily" },
            { value: Timestep.Weekly, label: "Weekly" },
            { value: Timestep.Monthly, label: "Monthly" },
            { value: Timestep.Annual, label: "Annual" },
          ]}
          size="small"
          variant="outlined"
          onChange={(event) => {
            setTimestep(event?.target.value as Timestep);
          }}
        />
      ),
    },
  ];

  ////////////////////////////////////////////////////////////////
  // JSX
  ////////////////////////////////////////////////////////////////

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 2,
        flexWrap: "wrap",
        py: 1,
      }}
    >
      {controls.map(({ label, control }) => (
        <Box
          key={label}
          sx={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <Box component="span" sx={{ opacity: 0.7, mr: 1 }}>
            {label}
          </Box>
          {control}
        </Box>
      ))}
      <DownloadMatrixButton studyId={studyId} path={path} />
    </Box>
  );
}

export default ResultFilters;
