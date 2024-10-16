import { TextField } from "@mui/material";
import { RendererProps } from "../types/renderer-props";
import { FieldValues } from "react-hook-form";
import { ReactElement } from "react";

const renderTextField = <TFieldValues extends FieldValues>({
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
      inputRef={field?.ref}
      error={!!errorMessage}
      helperText={errorMessage}
      value={field?.value ?? ""}
    />
  );
};

export default renderTextField;
