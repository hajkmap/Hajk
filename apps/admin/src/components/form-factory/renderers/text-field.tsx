import { TextField } from "@mui/material";
import { RendererFunction } from "../types/renderer-props";
import { FieldValues } from "react-hook-form";

const renderTextField: RendererFunction<FieldValues> = ({
  field,
  inputProps,
  errorMessage,
  title,
}) => {
  return (
    <TextField
      {...field}
      {...inputProps}
      fullWidth
      label={title}
      inputRef={field?.ref}
      error={!!errorMessage}
      helperText={errorMessage}
      value={(field?.value as string) ?? ""}
    />
  );
};

export default renderTextField;
