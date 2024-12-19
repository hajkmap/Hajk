import { FieldValues } from "react-hook-form";
import { RenderFunction } from "../types/render";
import { TextField } from "@mui/material";

const renderTextArea: RenderFunction<FieldValues> = ({
  field,
  inputProps,
  errorMessage,
  title,
  slotProps,
}) => {
  const { rows = 4, ...restInputProps } = inputProps ?? {};
  const inputSlotProps = slotProps?.input ?? {};
  return (
    <TextField
      {...field}
      {...restInputProps}
      {...inputSlotProps}
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
