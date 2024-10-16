import { Checkbox, FormControlLabel } from "@mui/material";
import { RendererProps } from "../types/renderer-props";
import { FieldValues } from "react-hook-form";
import { ReactElement } from "react";

const renderCheckbox = <TFieldValues extends FieldValues>({
  field,
  inputProps,
  title,
}: RendererProps<TFieldValues>): ReactElement | null => {
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
