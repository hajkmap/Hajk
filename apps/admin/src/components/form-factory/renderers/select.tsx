import { Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { RendererProps } from "../types/renderer-props";
import { FieldValues } from "react-hook-form";
import { ReactElement } from "react";

const renderSelect = <TFieldValues extends FieldValues>({
  field,
  inputProps,
  errorMessage,
  optionList,
  title,
  name,
}: RendererProps<TFieldValues>): ReactElement | null => {
  return (
    <FormControl fullWidth error={!!errorMessage}>
      {title && <InputLabel id={name}>{title}</InputLabel>}
      <Select
        labelId={name}
        {...field}
        {...inputProps}
        label={title}
        inputRef={field?.ref}
        displayEmpty
        value={field?.value ?? ""}
      >
        {optionList?.map((option, index) => (
          <MenuItem key={index} value={String(option.value)}>
            {option.title}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default renderSelect;
