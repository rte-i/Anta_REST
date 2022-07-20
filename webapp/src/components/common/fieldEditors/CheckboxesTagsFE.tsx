import {
  Autocomplete,
  AutocompleteProps,
  Checkbox,
  TextField,
} from "@mui/material";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import { mergeSxProp } from "../../../utils/muiUtils";

interface CheckboxesTagsFEProps<
  T,
  DisableClearable extends boolean | undefined = undefined,
  FreeSolo extends boolean | undefined = undefined
> extends Omit<
    AutocompleteProps<T, true, DisableClearable, FreeSolo>,
    | "multiple"
    | "disableCloseOnSelect"
    | "renderOption"
    | "renderInput"
    | "renderTags"
  > {
  label?: string;
  error?: boolean;
  helperText?: string;
  inputRef?: React.Ref<unknown>;
}

function CheckboxesTagsFE<
  T,
  DisableClearable extends boolean | undefined = undefined,
  FreeSolo extends boolean | undefined = undefined
>(props: CheckboxesTagsFEProps<T, DisableClearable, FreeSolo>) {
  const {
    label,
    sx,
    // Default value on MUI
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getOptionLabel = (option: any) => option?.label ?? option,
    error,
    helperText,
    inputRef,
    ...rest
  } = props;

  return (
    <Autocomplete
      {...rest}
      ref={inputRef}
      getOptionLabel={getOptionLabel}
      sx={mergeSxProp({ width: 1, p: "8px" }, sx)}
      multiple
      disableCloseOnSelect
      renderOption={(props, option, { selected }) => (
        <li {...props}>
          <Checkbox
            icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
            checkedIcon={<CheckBoxIcon fontSize="small" />}
            style={{ marginRight: 8 }}
            checked={selected}
          />
          {getOptionLabel(option)}
        </li>
      )}
      renderInput={(params) => (
        <TextField
          sx={{ m: 0 }}
          variant="filled"
          label={label}
          error={error}
          helperText={helperText}
          {...params}
        />
      )}
    />
  );
}

export default CheckboxesTagsFE;
