import { Box, FormControlLabel, Stack, Switch } from "@mui/material";

import { UI_STRINGS } from "../constants";
import type { DepthColorStop } from "../types";
import ColorField from "./ColorField";
import DepthColorLegend from "./DepthColorLegend";

interface DepthShadingSectionProps {
  depthShading: boolean;
  onDepthShadingChange: (enabled: boolean) => void;
  waterColor: string;
  onWaterColorChange: (hex: string) => void;
  deepWaterColor: string;
  onDeepWaterColorChange: (hex: string) => void;
  depthColors: DepthColorStop[];
}

function DepthShadingSection({
  depthShading,
  onDepthShadingChange,
  waterColor,
  onWaterColorChange,
  deepWaterColor,
  onDeepWaterColorChange,
  depthColors,
}: DepthShadingSectionProps) {
  return (
    <Stack>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", justifyContent: "space-between" }}
      >
        <FormControlLabel
          control={
            <Switch
              checked={depthShading}
              onChange={(_, checked) => {
                onDepthShadingChange(checked);
              }}
            />
          }
          label={UI_STRINGS.depthShadingLabel}
          sx={{ mr: 0 }}
        />
        <ColorField
          color={waterColor}
          label={UI_STRINGS.waterColorLabel}
          onChange={onWaterColorChange}
        />
      </Stack>
      {depthShading && (
        <Box
          sx={{
            mt: 1,
            pt: 1.5,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          {depthColors.length === 0 && (
            <ColorField
              color={deepWaterColor}
              label={UI_STRINGS.deepWaterColorLabel}
              onChange={onDeepWaterColorChange}
            />
          )}
          {depthColors.length > 0 && <DepthColorLegend stops={depthColors} />}
        </Box>
      )}
    </Stack>
  );
}

export default DepthShadingSection;
