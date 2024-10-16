import { ReactElement } from "react";
import { FieldValues } from "react-hook-form";
import { RendererProps } from "../types/renderer-props";
import { TextField } from "@mui/material";

const renderNumberField = <TFieldValues extends FieldValues>({
  field,
  inputProps,
  errorMessage,
  title,
}: RendererProps<TFieldValues>): ReactElement | null => {
  return (
    <TextField
      {...field}
      {...inputProps}
      fullWidth
      label={title}
      type="number"
      inputRef={field?.ref}
      error={!!errorMessage}
      helperText={errorMessage}
      value={field?.value ?? ""}
      slotProps={{
        htmlInput: {
          ...inputProps,
        },
      }}
    />
  );
};

export default renderNumberField;
