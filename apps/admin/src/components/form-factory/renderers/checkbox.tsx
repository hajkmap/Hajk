import { Checkbox, FormControlLabel } from "@mui/material";
import { RenderFunction } from "../types/render";
import { FieldValues } from "react-hook-form";

const renderCheckbox: RenderFunction<FieldValues> = ({
  field,
  inputProps,
  title,
}) => {
  return (
    <FormControlLabel
      control={
        <Checkbox
          {...inputProps}
          checked={!!field?.value}
          onChange={(e) => field?.onChange(e.target.checked)}
        />
      }
      label={title ?? ""}
    />
  );
};

export default renderCheckbox;
