import { useCallback, useEffect, useRef, useState } from "react";

import type FloodSimulatorModel from "../FloodSimulatorModel";
import { ANIMATION_DURATION_MIN_S } from "../constants";
import { clampNumber } from "../utils/format";

interface UseFloodLevelAnimationOptions {
  model: FloodSimulatorModel;
  minLevel: number;
  maxLevel: number;
  defaultLevel: number;
  levelDecimals: number;
  animationDurationMs: number;
  durationMaxSec: number;
}

export default function useFloodLevelAnimation({
  model,
  minLevel,
  maxLevel,
  defaultLevel,
  levelDecimals,
  animationDurationMs,
  durationMaxSec,
}: UseFloodLevelAnimationOptions) {
  const [level, setLevel] = useState(defaultLevel);
  const [animating, setAnimating] = useState(false);
  const [durationSec, setDurationSec] = useState(() =>
    clampNumber(
      animationDurationMs / 1000,
      ANIMATION_DURATION_MIN_S,
      durationMaxSec,
      0
    )
  );

  const animationRef = useRef<number | null>(null);
  const animationStartedAtRef = useRef(0);
  const animatingRef = useRef(false);
  const durationMsRef = useRef(durationSec * 1000);
  const levelRef = useRef(defaultLevel);

  const applyLevel = useCallback(
    (next: number) => {
      const rounded = clampNumber(next, minLevel, maxLevel, levelDecimals);
      levelRef.current = rounded;
      setLevel(rounded);
      model.setLevel(rounded);
    },
    [levelDecimals, maxLevel, minLevel, model]
  );

  const stopAnimation = useCallback(() => {
    animatingRef.current = false;
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setAnimating(false);
  }, []);

  const startAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    const range = maxLevel - minLevel;
    let progress = range === 0 ? 1 : (levelRef.current - minLevel) / range;
    if (progress >= 1) {
      progress = 0;
      applyLevel(minLevel);
    }
    animatingRef.current = true;
    setAnimating(true);
    animationStartedAtRef.current =
      performance.now() - progress * durationMsRef.current;
    const tick = (now: number) => {
      if (!animatingRef.current) {
        return;
      }
      const t = Math.min(
        1,
        (now - animationStartedAtRef.current) / durationMsRef.current
      );
      applyLevel(minLevel + range * t);
      if (t < 1) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        animatingRef.current = false;
        animationRef.current = null;
        setAnimating(false);
      }
    };
    animationRef.current = requestAnimationFrame(tick);
  }, [applyLevel, maxLevel, minLevel]);

  const setDurationSeconds = useCallback(
    (seconds: number) => {
      const next = clampNumber(
        seconds,
        ANIMATION_DURATION_MIN_S,
        durationMaxSec,
        0
      );
      const nextMs = next * 1000;
      if (animationRef.current !== null) {
        const now = performance.now();
        const progress = Math.min(
          1,
          (now - animationStartedAtRef.current) / durationMsRef.current
        );
        animationStartedAtRef.current = now - progress * nextMs;
      }
      durationMsRef.current = nextMs;
      setDurationSec(next);
    },
    [durationMaxSec]
  );

  useEffect(() => {
    return () => {
      animatingRef.current = false;
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  return {
    level,
    animating,
    durationSec,
    applyLevel,
    setDurationSeconds,
    startAnimation,
    stopAnimation,
  };
}
