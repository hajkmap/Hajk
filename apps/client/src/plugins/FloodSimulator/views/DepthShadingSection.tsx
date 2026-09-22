import {
  Box,
  FormControlLabel,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";

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
  useDepthColors: boolean;
  onUseDepthColorsChange: (enabled: boolean) => void;
}

function DepthShadingSection({
  depthShading,
  onDepthShadingChange,
  waterColor,
  onWaterColorChange,
  deepWaterColor,
  onDeepWaterColorChange,
  depthColors,
  useDepthColors,
  onUseDepthColorsChange,
}: DepthShadingSectionProps) {
  const showClasses = depthColors.length > 0 && useDepthColors;
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
          <Stack spacing={1.5}>
            {depthColors.length > 0 && (
              <ToggleButtonGroup
                aria-label={UI_STRINGS.depthColorModeLabel}
                exclusive
                fullWidth
                onChange={(_, value) => {
                  if (value !== null) {
                    onUseDepthColorsChange(value === "classes");
                  }
                }}
                size="small"
                value={useDepthColors ? "classes" : "ramp"}
              >
                <ToggleButton value="classes">
                  {UI_STRINGS.depthColorModeClasses}
                </ToggleButton>
                <ToggleButton value="ramp">
                  {UI_STRINGS.depthColorModeRamp}
                </ToggleButton>
              </ToggleButtonGroup>
            )}
            {showClasses ? (
              <DepthColorLegend stops={depthColors} />
            ) : (
              <ColorField
                color={deepWaterColor}
                label={UI_STRINGS.deepWaterColorLabel}
                onChange={onDeepWaterColorChange}
              />
            )}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

export default DepthShadingSection;
