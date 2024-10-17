import { Switch, FormControlLabel } from "@mui/material";
import { RenderFunction } from "../types/render";
import { FieldValues } from "react-hook-form";

const renderSwitch: RenderFunction<FieldValues> = ({
  field,
  inputProps,
  title,
}) => {
  return (
    <FormControlLabel
      control={
        <Switch
          {...inputProps}
          checked={!!field?.value}
          onChange={(e) => field?.onChange(e.target.checked)}
          inputRef={field?.ref}
        />
      }
      label={title ?? ""}
    />
  );
};

export default renderSwitch;
