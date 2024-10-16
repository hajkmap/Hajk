import { FieldValues } from "react-hook-form";
import { RendererFunction } from "../types/renderer-props";
import { TextField } from "@mui/material";

const renderNumberField: RendererFunction<FieldValues> = ({
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
      type="number"
      inputRef={field?.ref}
      error={!!errorMessage}
      helperText={errorMessage}
      value={(field?.value as string) ?? ""}
      slotProps={{
        htmlInput: {
          ...inputProps,
        },
      }}
    />
  );
};

export default renderNumberField;
