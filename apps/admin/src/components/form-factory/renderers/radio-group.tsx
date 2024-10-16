import { RadioGroup, FormControlLabel, Radio } from "@mui/material";
import { RendererProps } from "../types/renderer-props";
import { FieldValues } from "react-hook-form";
import { ReactElement } from "react";

const renderRadioGroup = <TFieldValues extends FieldValues>({
  field,
  inputProps,
  optionList,
}: RendererProps<TFieldValues>): ReactElement | null => {
  return (
    <RadioGroup
      {...field}
      {...inputProps}
      value={field?.value ?? ""}
      onChange={(_, value) => field?.onChange(value)}
    >
      {optionList?.map((option, index) => (
        <FormControlLabel
          key={index}
          value={String(option.value)}
          control={<Radio />}
          label={option.title}
        />
      ))}
    </RadioGroup>
  );
};

export default renderRadioGroup;
