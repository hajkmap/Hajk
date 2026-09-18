# Refactor FloodSimulatorView into hooks and views

## Current problems

`FloodSimulatorView.tsx` mixes four unrelated concerns in one file: 11 refs of imperative animation bookkeeping, a throttled pointer-sampling effect, ~250 lines of deeply nested JSX, and 8 module-level pure helpers. The level control (lines 291-364) and duration control (lines 402-461) are near-identical slider + `TextField` pairs, each with its own mirror string state, focus ref, commit-on-blur/Enter handler and clamping.

## Target layout

```
FloodSimulator/
  FloodSimulatorView.tsx        ~110 lines, composition + wiring only
  hooks/
    useFloodLevelAnimation.ts   level state, applyLevel, play/pause, duration retiming
    useElevationReadout.ts      pointermove sampling, Readout state, reset
  views/
    SliderNumberField.tsx       shared slider + compact numeric input (level & duration)
    AnimationControls.tsx       play/pause + reset buttons
    OpacityControl.tsx          opacity slider
    DepthShadingSection.tsx     depth switch + water color + deep color / legend
    ElevationReadout.tsx        readout banner (absorbs ReadoutColumn)
    DepthColorLegend.tsx        legend (absorbs depthColorLegendItems, formatDepth)
    ColorField.tsx              hidden-input color swatch
  utils/format.ts               parseDecimalInput, isIntermediateNumber, formatNumber, clampNumber
```

`views/` + `hooks/` follows the conventions in `../PropertyChecker/views` and `../FmeServer/hooks`. `FloodSimulator.tsx`, `FloodSimulatorModel.ts`, `constants/index.ts` and `elevationTileGrid.ts` are untouched; `types.d.ts` gains the exported `Readout` union (moved out of the view).

## Key decisions

### `views/SliderNumberField.tsx` owns the input string state

This is where the dedup lives. The component holds the raw string, the focused flag, and commit-on-blur/Enter; it re-derives the displayed string from the `value` prop whenever the field is not focused, which is exactly what `applyLevel` did manually via `levelInputFocusedRef`. That deletes `levelInput`, `durationInput`, both focus refs and `formatLevel` from the view.

```tsx
interface SliderNumberFieldProps {
  id: string; // for aria-labelledby
  label: string;
  inputAriaLabel: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  decimals: number; // 2 for level, 0 for duration
  unit: string; // "m" | "s", used in valueLabelFormat
  inputMode: "decimal" | "numeric";
  onInteractStart?: () => void; // level passes stopAnimation
  disableThumbTransition?: boolean; // level passes `animating`
}
```

`COMPACT_NUMBER_FIELD_SX` moves here (sole consumer). Clamping becomes generic: round to `decimals`, then clamp to `min`/`max` — with `decimals: 0` that reproduces `clampDurationSeconds` exactly.

### `hooks/useFloodLevelAnimation.ts`

Takes `{ model, minLevel, maxLevel, defaultLevel, animationDurationMs }`; returns `{ level, animating, durationSec, applyLevel, setDurationSeconds, startAnimation, stopAnimation }`. Animation and duration stay together because `applyDuration` retimes a running animation via `animationStartedAtRef` (lines 161-177). Keeps the rAF-cancel-on-unmount effect.

### `hooks/useElevationReadout.ts`

Takes `{ map, model, enabled, level, minElevation, maxElevation }`; returns `{ readout, resetReadout }`. Absorbs `toReadout`, `readoutKey`, `pendingPixelRef`, `pointerFrameRef` and the pointermove effect. `level` is mirrored into an internal latest-value ref so the listener is not re-registered on every frame, preserving the current deps list (`map, model, pluginShown, showElevationReadout, minElevation, maxElevation`).

### `onHideRef` wiring stays in the view

The reset spans both hooks, so the view composes it:

```tsx
useEffect(() => {
  onHideRef.current = () => {
    stopAnimation();
    resetReadout();
  };
  return () => {
    onHideRef.current = null;
  };
}, [onHideRef, stopAnimation, resetReadout]);
```

## Intentional behavior deltas

Everything else is a pure move. Three small changes are worth knowing:

- `stopAnimation` will call `setAnimating(false)` unconditionally. Today it returns early when `animationRef.current === null` (line 118), which is why the `onHide` handler re-implements the teardown inline.
- Typing `"7."` in the duration field will no longer commit early. The duration input currently only guards `raw === ""`, while the shared field applies the level field's fuller `isIntermediateNumber` guard.
- Duration input rounding now happens on the same `decimals`-based path as level, instead of `Math.round` inside `clampDurationSeconds`. Same results for all in-range input.

## Verification

`cd apps/client && npm run lint && npx tsc --noEmit`, then manual smoke test in the running client: drag/type level, play/pause, change duration mid-animation, reset, opacity, depth-shading toggle with and without `depthColors`, pointer readout over land/sea/nodata, and close/reopen the window to confirm the `onHide` reset. No CHANGELOG entry needed — FloodSimulator is unreleased and already listed under `[unreleased] / Added`.
