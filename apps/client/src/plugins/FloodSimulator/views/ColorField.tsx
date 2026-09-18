import { type ChangeEvent } from "react";

import { Box, FormControlLabel } from "@mui/material";

interface ColorFieldProps {
  color: string;
  label: string;
  onChange: (hex: string) => void;
}

function ColorField({ color, label, onChange }: ColorFieldProps) {
  return (
    <FormControlLabel
      control={
        <Box
          sx={{
            position: "relative",
            width: 24,
            height: 24,
            ml: 1,
            mr: 1,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 0.5,
            bgcolor: color,
            cursor: "pointer",
            flexShrink: 0,
            "&:focus-within": {
              outline: "2px solid",
              outlineColor: "primary.main",
              outlineOffset: 1,
            },
          }}
        >
          <Box
            aria-label={label}
            component="input"
            onChange={(event: ChangeEvent<HTMLInputElement>) => {
              onChange(event.target.value);
            }}
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              p: 0,
              border: "none",
              opacity: 0,
              cursor: "pointer",
            }}
            type="color"
            value={color}
          />
        </Box>
      }
      label={label}
      labelPlacement="end"
      sx={{ mr: 0 }}
    />
  );
}

export default ColorField;
