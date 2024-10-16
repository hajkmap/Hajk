import { ReactElement } from "react";
import { FieldValues } from "react-hook-form";
import { RendererProps } from "../types/renderer-props";
import { TextField } from "@mui/material";

const renderTextArea = <TFieldValues extends FieldValues>({
  field,
  inputProps,
  errorMessage,
  title,
}: RendererProps<TFieldValues>): ReactElement | null => {
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
      value={field?.value ?? ""}
      slotProps={{
        htmlInput: {
          ...inputProps,
        },
      }}
    />
  );
};

export default renderTextArea;
