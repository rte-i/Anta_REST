import * as RA from "ramda-adjunct";
import { ColumnSettings } from "handsontable/settings";
import { startCase } from "lodash";
import { DefaultValues } from "react-hook-form";
import * as R from "ramda";
import type { SxProps } from "@mui/material";
import type { Theme } from "@mui/system";
import { useMemo, useState } from "react";
import type { IdType } from "../../../common/types";
import Form, { FormProps } from "../Form";
import Table, { TableProps } from "./Table";
import { getCellType } from "./utils";
import { mergeSxProp } from "../../../utils/muiUtils";

type TableFieldValuesByRow = Record<
  IdType,
  Record<string, string | boolean | number>
>;

export interface FormTableProps<
  TFieldValues extends TableFieldValuesByRow = TableFieldValuesByRow
> {
  defaultValues: DefaultValues<TFieldValues>;
  onSubmit?: FormProps<TFieldValues>["onSubmit"];
  onSubmitError?: FormProps<TFieldValues>["onSubmitError"];
  formApiRef?: FormProps<TFieldValues>["apiRef"];
  sx?: SxProps<Theme>;
  tableProps?: Omit<TableProps, "data" | "columns"> & {
    columns?:
      | Array<string | ColumnSettings>
      | ((index: number) => ColumnSettings);
  };
}

function FormTable<TFieldValues extends TableFieldValuesByRow>(
  props: FormTableProps<TFieldValues>
) {
  const {
    defaultValues,
    onSubmit,
    onSubmitError,
    sx,
    formApiRef,
    tableProps = {},
  } = props;

  const { columns, ...restTableProps } = tableProps;

  // useForm's defaultValues are cached on the first render within the custom hook.
  // So we do the same for the table data with `useState`.
  const [defaultData] = useState(() =>
    R.keys(defaultValues).map((id) => ({
      ...defaultValues[id],
      id: id as IdType,
    }))
  );

  const formattedColumns = useMemo(() => {
    if (!columns || Array.isArray(columns)) {
      const firstRow = defaultData[0];
      const cols = columns || Object.keys(R.omit(["id"], firstRow));

      return cols.map(
        (col): ColumnSettings =>
          RA.isString(col)
            ? {
                data: col,
                title: startCase(col),
                type: getCellType(firstRow?.[col]),
              }
            : col
      );
    }
    return columns;
  }, [columns, defaultData]);

  ////////////////////////////////////////////////////////////////
  // JSX
  ////////////////////////////////////////////////////////////////

  return (
    <Form
      config={{ defaultValues }}
      onSubmit={onSubmit}
      onSubmitError={onSubmitError}
      autoSubmit
      sx={mergeSxProp({ width: 1, height: 1, pt: 0 }, sx)}
      apiRef={formApiRef}
    >
      <Table
        data={defaultData}
        columns={formattedColumns}
        {...restTableProps}
      />
    </Form>
  );
}

export default FormTable;