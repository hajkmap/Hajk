import { Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { RenderFunction } from "../types/render";
import { FieldValues } from "react-hook-form";
const renderSelect: RenderFunction<FieldValues> = ({
  field,
  inputProps,
  errorMessage,
  optionList,
  title,
  name,
  slotProps,
}) => {
  const inputSlotProps = slotProps?.input ?? {};
  return (
    <FormControl fullWidth error={!!errorMessage}>
      {title && <InputLabel id={name}>{title}</InputLabel>}
      <Select
        labelId={name}
        {...field}
        {...inputProps}
        {...inputSlotProps}
        label={title}
        inputRef={field?.ref}
        value={(field?.value as string) ?? ""}
      >
        {optionList?.map((option, index) => (
          <MenuItem key={index} value={String(option.value)}>
            {option.title}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default renderSelect;
