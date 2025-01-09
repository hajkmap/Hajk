import { TextField } from "@mui/material";
import { RenderFunction } from "../types/render";
import { FieldValues } from "react-hook-form";

const renderTextField: RenderFunction<FieldValues> = ({
  field,
  inputProps,
  errorMessage,
  title,
  slotProps,
  disabled,
}) => {
  const { endAdornment, style } = slotProps?.input ?? {};
  const { style: labelStyle } = slotProps?.inputLabel ?? {};

  return (
    <>
      <TextField
        {...field}
        {...inputProps}
        fullWidth
        label={title}
        disabled={disabled ?? false}
        inputRef={field?.ref}
        error={!!errorMessage}
        helperText={errorMessage}
        value={(field?.value as string) ?? ""}
        slotProps={{
          inputLabel: {
            style: labelStyle,
          },
          input: {
            endAdornment: endAdornment,
            style: style,
          },
        }}
      />
    </>
  );
};

export default renderTextField;
