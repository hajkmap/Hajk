import { RadioGroup, FormControlLabel, Radio } from "@mui/material";
import { RendererFunction } from "../types/renderer-props";
import { FieldValues } from "react-hook-form";

const renderRadioGroup: RendererFunction<FieldValues> = ({
  field,
  inputProps,
  optionList,
}) => {
  return (
    <RadioGroup
      {...field}
      {...inputProps}
      value={(field?.value as string) ?? ""}
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
