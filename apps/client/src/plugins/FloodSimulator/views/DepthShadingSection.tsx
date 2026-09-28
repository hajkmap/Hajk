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
import SliderNumberField from "./SliderNumberField";

interface DepthShadingSectionProps {
  interpolate: boolean;
  onInterpolateChange: (enabled: boolean) => void;
  depthShading: boolean;
  onDepthShadingChange: (enabled: boolean) => void;
  waterColor: string;
  onWaterColorChange: (hex: string) => void;
  deepWaterColor: string;
  onDeepWaterColorChange: (hex: string) => void;
  depthColors: DepthColorStop[];
  useDepthColors: boolean;
  onUseDepthColorsChange: (enabled: boolean) => void;
  smoothDepthColors: boolean;
  onSmoothDepthColorsChange: (enabled: boolean) => void;
  isobaths: boolean;
  onIsobathsChange: (enabled: boolean) => void;
  maxShadingDepth: number;
  onMaxShadingDepthChange: (depth: number) => void;
  maxShadingDepthMax: number;
  shadingDepthStep: number;
}

function DepthShadingSection({
  interpolate,
  onInterpolateChange,
  depthShading,
  onDepthShadingChange,
  waterColor,
  onWaterColorChange,
  deepWaterColor,
  onDeepWaterColorChange,
  depthColors,
  useDepthColors,
  onUseDepthColorsChange,
  smoothDepthColors,
  onSmoothDepthColorsChange,
  isobaths,
  onIsobathsChange,
  maxShadingDepth,
  onMaxShadingDepthChange,
  maxShadingDepthMax,
  shadingDepthStep,
}: DepthShadingSectionProps) {
  const showClasses = depthColors.length > 0 && useDepthColors;
  return (
    <Stack>
      <FormControlLabel
        control={
          <Switch
            checked={interpolate}
            onChange={(_, checked) => {
              onInterpolateChange(checked);
            }}
          />
        }
        label={UI_STRINGS.interpolateLabel}
        sx={{ mr: 0 }}
      />
      <FormControlLabel
        control={
          <Switch
            checked={smoothDepthColors}
            onChange={(_, checked) => {
              onSmoothDepthColorsChange(checked);
            }}
          />
        }
        label={UI_STRINGS.smoothDepthColorsLabel}
        sx={{ mr: 0 }}
      />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
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
      </Box>
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
              <DepthColorLegend
                headerAction={
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isobaths}
                        onChange={(_, checked) => {
                          onIsobathsChange(checked);
                        }}
                      />
                    }
                    label={UI_STRINGS.isobathsLabel}
                    labelPlacement="start"
                  />
                }
                stops={depthColors}
              />
            ) : (
              <Stack spacing={1.5}>
                <Box sx={{ pl: 0.5 }}>
                  <ColorField
                    color={deepWaterColor}
                    label={UI_STRINGS.deepWaterColorLabel}
                    onChange={onDeepWaterColorChange}
                  />
                </Box>
                <SliderNumberField
                  decimals={2}
                  id="flood-simulator-max-shading-depth-label"
                  inputAriaLabel={UI_STRINGS.maxShadingDepthAriaLabel}
                  inputMode="decimal"
                  label={UI_STRINGS.maxShadingDepthLabel}
                  max={maxShadingDepthMax}
                  min={Math.min(
                    shadingDepthStep > 0 ? shadingDepthStep : 0.01,
                    maxShadingDepthMax
                  )}
                  onChange={onMaxShadingDepthChange}
                  step={shadingDepthStep > 0 ? shadingDepthStep : 0.01}
                  unit="m"
                  value={maxShadingDepth}
                />
              </Stack>
            )}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}

export default DepthShadingSection;
