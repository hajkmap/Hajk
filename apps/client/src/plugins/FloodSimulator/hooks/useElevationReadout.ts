import { useCallback, useEffect, useRef, useState } from "react";

import type MapBrowserEvent from "ol/MapBrowserEvent";
import type OlMap from "ol/Map";

import type FloodSimulatorModel from "../FloodSimulatorModel";
import type { ElevationSample, Readout } from "../types";

interface UseElevationReadoutOptions {
  map: OlMap;
  model: FloodSimulatorModel;
  enabled: boolean;
  level: number;
  decimals: number;
  minElevation: number;
  maxElevation: number;
}

export default function useElevationReadout({
  map,
  model,
  enabled,
  level,
  decimals,
  minElevation,
  maxElevation,
}: UseElevationReadoutOptions) {
  const [readout, setReadout] = useState<Readout>({ kind: "idle" });
  const pointerFrameRef = useRef<number | null>(null);
  const pendingPixelRef = useRef<number[] | null>(null);
  const lastReadoutKeyRef = useRef("");
  const levelRef = useRef(level);

  useEffect(() => {
    levelRef.current = level;
  }, [level]);

  const resetReadout = useCallback(() => {
    setReadout({ kind: "idle" });
    lastReadoutKeyRef.current = "";
  }, []);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const flushReadout = (pixel: number[]) => {
      const sample = model.getElevationAtPixel(pixel);
      const next = toReadout(
        sample,
        levelRef.current,
        minElevation,
        maxElevation
      );
      const key = readoutKey(next, decimals);
      if (key === lastReadoutKeyRef.current) {
        return;
      }
      lastReadoutKeyRef.current = key;
      setReadout(next);
    };

    const handlePointerMove = (event: MapBrowserEvent) => {
      if (event.dragging) {
        return;
      }
      pendingPixelRef.current = event.pixel.slice();
      if (pointerFrameRef.current !== null) {
        return;
      }
      pointerFrameRef.current = requestAnimationFrame(() => {
        pointerFrameRef.current = null;
        const pixel = pendingPixelRef.current;
        if (pixel) {
          flushReadout(pixel);
        }
      });
    };

    map.on("pointermove", handlePointerMove);
    return () => {
      map.un("pointermove", handlePointerMove);
      if (pointerFrameRef.current !== null) {
        cancelAnimationFrame(pointerFrameRef.current);
        pointerFrameRef.current = null;
      }
    };
  }, [decimals, enabled, map, maxElevation, minElevation, model]);

  return { readout, resetReadout };
}

function toReadout(
  sample: ElevationSample,
  currentLevel: number,
  minElevation: number,
  maxElevation: number
): Readout {
  if (sample.kind !== "value") {
    return { kind: sample.kind };
  }
  if (sample.elevation <= minElevation || sample.elevation >= maxElevation) {
    return { kind: "nodata" };
  }
  const depth = Math.max(0, currentLevel - sample.elevation);
  return { kind: "value", elevation: sample.elevation, depth };
}

function readoutKey(readout: Readout, decimals: number): string {
  if (readout.kind !== "value") {
    return readout.kind;
  }
  return `value:${readout.elevation.toFixed(decimals)}:${readout.depth.toFixed(decimals)}`;
}
