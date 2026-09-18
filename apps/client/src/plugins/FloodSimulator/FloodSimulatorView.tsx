import { useEffect, useState } from "react";

import { Stack } from "@mui/material";

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
import OpacityControl from "./views/OpacityControl";
import SliderNumberField from "./views/SliderNumberField";

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
    animationDurationMs,
    showElevationReadout,
    minElevation,
    maxElevation,
    waterColor: initialWaterColor,
    deepWaterColor: initialDeepWaterColor,
    depthColors,
  } = model.getOptions();

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
    maxLevel,
    defaultLevel,
    animationDurationMs,
  });

  const { readout, resetReadout } = useElevationReadout({
    map,
    model,
    enabled: pluginShown && showElevationReadout,
    level,
    minElevation,
    maxElevation,
  });

  const [opacity, setOpacity] = useState(layerOpacity);
  const [depthShading, setDepthShading] = useState(enableDepthShading);
  const [waterColor, setWaterColor] = useState(initialWaterColor);
  const [deepWaterColor, setDeepWaterColor] = useState(initialDeepWaterColor);

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
      <Stack spacing={{ xs: 1.25, sm: 2 }} sx={{ p: { xs: 2, sm: 2 } }}>
        <SliderNumberField
          id="flood-simulator-level-label"
          label={UI_STRINGS.levelLabel}
          inputAriaLabel={UI_STRINGS.levelAriaLabel}
          value={level}
          onChange={applyLevel}
          min={minLevel}
          max={maxLevel}
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
          max={ANIMATION_DURATION_MAX_S}
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
        />
      </Stack>
    </Stack>
  );
}

export default FloodSimulatorView;
