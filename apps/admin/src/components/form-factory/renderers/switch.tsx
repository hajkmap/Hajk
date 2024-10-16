import { Switch, FormControlLabel } from "@mui/material";
import { RendererProps } from "../types/renderer-props";
import { ReactElement } from "react";
import { FieldValues } from "react-hook-form";

const renderSwitch = <TFieldValues extends FieldValues>({
  field,
  inputProps,
  title,
}: RendererProps<TFieldValues>): ReactElement | null => {
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
