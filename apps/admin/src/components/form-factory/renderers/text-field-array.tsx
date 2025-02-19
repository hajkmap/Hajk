import { TextField } from "@mui/material";
import { RenderFunction } from "../types/render";
import { FieldValues } from "react-hook-form";

const renderTextFieldArray: RenderFunction<FieldValues> = ({
  field,
  inputProps,
  errorMessage,
  title,
  slotProps,
  disabled,
}) => {
  const { endAdornment, style } = slotProps?.input ?? {};
  const { style: labelStyle } = slotProps?.inputLabel ?? {};

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;
    field?.onChange(inputValue);
  };

  const handleBlur = () => {
    if (typeof field?.value === "string") {
      const parsedArray = field.value
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item !== "");

      field.onChange(parsedArray);
    }
  };

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
        value={
          typeof field?.value === "string"
            ? field?.value
            : Array.isArray(field?.value)
            ? field?.value.join(", ")
            : ""
        }
        onChange={handleChange}
        onBlur={handleBlur}
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

export default renderTextFieldArray;
