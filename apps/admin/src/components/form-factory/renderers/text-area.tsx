import { FieldValues } from "react-hook-form";
import { RenderFunction } from "../types/renderer-props";
import { TextField } from "@mui/material";

const renderTextArea: RenderFunction<FieldValues> = ({
  field,
  inputProps,
  errorMessage,
  title,
}) => {
  const { rows = 4, ...restInputProps } = inputProps ?? {};

  return (
    <TextField
      {...field}
      {...restInputProps}
      fullWidth
      label={title}
      multiline
      rows={rows as number}
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

export default renderTextArea;
