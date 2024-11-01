import { TextField } from "@mui/material";
import { RenderFunction } from "../types/render";
import { FieldValues } from "react-hook-form";

const renderTextField: RenderFunction<FieldValues> = ({
  field,
  inputProps,
  errorMessage,
  title,
  slotProps,
}) => {
  const inputSlotProps = slotProps?.input ?? {};

  return (
    <TextField
      {...field}
      {...inputProps}
      {...inputSlotProps}
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
