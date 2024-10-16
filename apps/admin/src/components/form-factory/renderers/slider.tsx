import { Slider, Box, FormControl, FormLabel } from "@mui/material";
import { RenderFunction } from "../types/renderer-props";
import { FieldValues } from "react-hook-form";

const renderSlider: RenderFunction<FieldValues> = ({
  field,
  inputProps,
  title,
}) => {
  return (
    <FormControl fullWidth>
      {title && <FormLabel id={`${field?.name}-label`}>{title}</FormLabel>}
      <Box
        sx={{
          position: "absolute",
          right: 1,
          pl: 1,
          pr: 1,
          borderRadius: "4px",
        }}
      >
        {field?.value}
      </Box>
      <Box sx={{ pl: 1, pr: 1 }}>
        <Slider
          {...field}
          {...inputProps}
          valueLabelDisplay="auto"
          value={Number(field?.value) || 0}
          onChange={(_, value) => field?.onChange(value)}
          aria-labelledby={`${field?.name}-label`}
        />
      </Box>
    </FormControl>
  );
};

export default renderSlider;
