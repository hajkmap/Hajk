import { Checkbox, FormControlLabel } from "@mui/material";
import { RendererFunction } from "../types/renderer-props";
import { FieldValues } from "react-hook-form";

const renderCheckbox: RendererFunction<FieldValues> = ({
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
