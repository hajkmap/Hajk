import { Box, Slider, Typography } from "@mui/material";

import { UI_STRINGS } from "../constants";

interface OpacityControlProps {
  opacity: number;
  onChange: (opacity: number) => void;
}

function OpacityControl({ opacity, onChange }: OpacityControlProps) {
  return (
    <Box>
      <Typography gutterBottom id="flood-simulator-opacity-label">
        {UI_STRINGS.opacityLabel}
      </Typography>
      <Box sx={{ px: 1 }}>
        <Slider
          aria-labelledby="flood-simulator-opacity-label"
          max={100}
          min={0}
          onChange={(_, value) => {
            onChange((value as number) / 100);
          }}
          size="small"
          step={5}
          value={Math.round(opacity * 100)}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value} %`}
        />
      </Box>
    </Box>
  );
}

export default OpacityControl;
