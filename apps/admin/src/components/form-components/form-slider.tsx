import { Box, FormLabel, Slider } from "@mui/material";
import { SliderProps } from "@mui/material/Slider";

type FormSliderProps = {
  name?: string;
  label?: string;
  value: number;
  onChange: (value: number) => void;
} & Omit<SliderProps, "value" | "onChange">;

export default function FormSlider({
  name,
  label,
  value,
  onChange,
  ...sliderProps
}: FormSliderProps) {
  const labelId = name ? `${name}-label` : undefined;

  return (
    <>
      {label && <FormLabel id={labelId}>{label}</FormLabel>}
      <Box sx={{ position: "relative", pl: 1, pr: 1 }}>
        <Box
          sx={{
            position: "absolute",
            right: 0,
            top: "-50%",
            pl: 1,
            pr: 1,
            borderRadius: "4px",
          }}
        >
          {value}
        </Box>
        <Slider
          valueLabelDisplay="auto"
          value={value}
          onChange={(_, v) => onChange(Array.isArray(v) ? v[0] : v)}
          aria-labelledby={labelId}
          {...sliderProps}
        />
      </Box>
    </>
  );
}
