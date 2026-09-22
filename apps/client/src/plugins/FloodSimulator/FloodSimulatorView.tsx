import { useEffect, useState } from "react";

import { Box, Stack } from "@mui/material";

import {
  ANIMATION_DURATION_MAX_S,
  ANIMATION_DURATION_MIN_S,
  UI_STRINGS,
} from "./constants";
import useElevationReadout from "./hooks/useElevationReadout";
import useFloodLevelAnimation from "./hooks/useFloodLevelAnimation";
import type { FloodSimulatorViewProps } from "./types";
import AnimationControls from "./views/AnimationControls";
import DepthShadingSection from "./views/DepthShadingSection";
import ElevationReadout from "./views/ElevationReadout";
import MoreSettings from "./views/MoreSettings";
import OpacityControl from "./views/OpacityControl";
import SliderNumberField from "./views/SliderNumberField";
import ZoomHiddenNotice from "./views/ZoomHiddenNotice";

function FloodSimulatorView({
  map,
  model,
  pluginShown,
  onHideRef,
}: FloodSimulatorViewProps) {
  const {
    minLevel,
    maxLevel,
    levelStep,
    defaultLevel,
    layerOpacity,
    enableDepthShading,
    interpolate: defaultInterpolate,
    smoothDepthColors: defaultSmoothDepthColors,
    animationDurationMs,
    showElevationReadout,
    minElevation,
    maxElevation,
    waterColor: initialWaterColor,
    deepWaterColor: initialDeepWaterColor,
    depthColors,
    maxShadingDepth: initialMaxShadingDepth,
  } = model.getOptions();

  const shadingDepthStep = levelStep > 0 ? levelStep : 0.01;
  const [sliderMaxLevel, setSliderMaxLevel] = useState(maxLevel);
  const [durationMaxSec, setDurationMaxSec] = useState(
    ANIMATION_DURATION_MAX_S
  );
  const [opacity, setOpacity] = useState(layerOpacity);
  const [interpolate, setInterpolate] = useState(defaultInterpolate);
  const [depthShading, setDepthShading] = useState(enableDepthShading);
  const [waterColor, setWaterColor] = useState(initialWaterColor);
  const [deepWaterColor, setDeepWaterColor] = useState(initialDeepWaterColor);
  const [useDepthColors, setUseDepthColors] = useState(depthColors.length > 0);
  const [smoothDepthColors, setSmoothDepthColors] = useState(
    defaultSmoothDepthColors
  );
  const [isobaths, setIsobaths] = useState(false);
  const [maxShadingDepth, setMaxShadingDepth] = useState(() => {
    const next = clampShadingDepth(
      initialMaxShadingDepth,
      maxLevel,
      shadingDepthStep
    );
    if (next !== initialMaxShadingDepth) {
      model.setMaxShadingDepth(next);
    }
    return next;
  });

  const {
    level,
    animating,
    durationSec,
    applyLevel,
    setDurationSeconds,
    startAnimation,
    stopAnimation,
  } = useFloodLevelAnimation({
    model,
    minLevel,
    maxLevel: sliderMaxLevel,
    defaultLevel,
    animationDurationMs,
    durationMaxSec,
  });

  const { readout, resetReadout } = useElevationReadout({
    map,
    model,
    enabled: pluginShown && showElevationReadout,
    level,
    minElevation,
    maxElevation,
  });

  useEffect(() => {
    onHideRef.current = () => {
      stopAnimation();
      resetReadout();
    };
    return () => {
      onHideRef.current = null;
    };
  }, [onHideRef, resetReadout, stopAnimation]);

  return (
    <Stack>
      {showElevationReadout && <ElevationReadout readout={readout} />}
      <Box sx={{ position: "relative" }}>
        <Box sx={{ position: "absolute", top: 6, right: 12, zIndex: 1 }}>
          <MoreSettings
            minLevel={minLevel}
            maxLevel={sliderMaxLevel}
            levelStep={levelStep}
            onMaxLevelChange={(next) => {
              stopAnimation();
              setSliderMaxLevel(next);
              if (level > next) {
                applyLevel(next);
              }
              const nextShadingDepth = clampShadingDepth(
                maxShadingDepth,
                next,
                shadingDepthStep
              );
              if (nextShadingDepth !== maxShadingDepth) {
                setMaxShadingDepth(nextShadingDepth);
                model.setMaxShadingDepth(nextShadingDepth);
              }
            }}
            durationMaxSec={durationMaxSec}
            onDurationMaxChange={(next) => {
              setDurationMaxSec(next);
              if (durationSec > next) {
                setDurationSeconds(next);
              }
            }}
          />
        </Box>
        <Stack spacing={{ xs: 1.25, sm: 2 }} sx={{ p: { xs: 2, sm: 2 } }}>
          <ZoomHiddenNotice map={map} model={model} enabled={pluginShown} />
          <SliderNumberField
            id="flood-simulator-level-label"
            label={UI_STRINGS.levelLabel}
            inputAriaLabel={UI_STRINGS.levelAriaLabel}
            value={level}
            onChange={applyLevel}
            min={minLevel}
            max={sliderMaxLevel}
            step={levelStep}
            decimals={2}
            unit="m"
            inputMode="decimal"
            onInteractStart={stopAnimation}
            disableThumbTransition={animating}
          />
          <AnimationControls
            animating={animating}
            onReset={() => {
              stopAnimation();
              applyLevel(defaultLevel);
            }}
            onToggle={() => {
              if (animating) {
                stopAnimation();
              } else {
                startAnimation();
              }
            }}
          />
          <SliderNumberField
            id="flood-simulator-duration-label"
            label={UI_STRINGS.animationDurationLabel}
            inputAriaLabel={UI_STRINGS.durationAriaLabel}
            value={durationSec}
            onChange={setDurationSeconds}
            min={ANIMATION_DURATION_MIN_S}
            max={durationMaxSec}
            step={1}
            decimals={0}
            unit="s"
            inputMode="numeric"
          />
          <OpacityControl
            opacity={opacity}
            onChange={(next) => {
              setOpacity(next);
              model.setOpacity(next);
            }}
          />
          <DepthShadingSection
            interpolate={interpolate}
            onInterpolateChange={(checked) => {
              setInterpolate(checked);
              model.setInterpolate(checked);
            }}
            depthShading={depthShading}
            onDepthShadingChange={(checked) => {
              setDepthShading(checked);
              model.setDepthShading(checked);
            }}
            waterColor={waterColor}
            onWaterColorChange={(hex) => {
              setWaterColor(hex);
              model.setWaterColor(hex);
            }}
            deepWaterColor={deepWaterColor}
            onDeepWaterColorChange={(hex) => {
              setDeepWaterColor(hex);
              model.setDeepWaterColor(hex);
            }}
            depthColors={depthColors}
            useDepthColors={useDepthColors}
            onUseDepthColorsChange={(enabled) => {
              setUseDepthColors(enabled);
              model.setUseDepthColors(enabled);
            }}
            smoothDepthColors={smoothDepthColors}
            onSmoothDepthColorsChange={(enabled) => {
              setSmoothDepthColors(enabled);
              model.setSmoothDepthColors(enabled);
            }}
            isobaths={isobaths}
            onIsobathsChange={(enabled) => {
              setIsobaths(enabled);
              model.setIsobaths(enabled);
            }}
            maxShadingDepth={maxShadingDepth}
            maxShadingDepthMax={sliderMaxLevel}
            onMaxShadingDepthChange={(depth) => {
              setMaxShadingDepth(depth);
              model.setMaxShadingDepth(depth);
            }}
            shadingDepthStep={shadingDepthStep}
          />
        </Stack>
      </Box>
    </Stack>
  );
}

export default FloodSimulatorView;

function clampShadingDepth(depth: number, max: number, step: number): number {
  const min = Math.min(step, max);
  return Math.min(max, Math.max(min, depth));
}
