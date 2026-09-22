import { useState } from "react";

import { Box, Slider, Stack, TextField, Typography } from "@mui/material";

import {
  clampNumber,
  formatNumber,
  isIntermediateNumber,
  parseDecimalInput,
} from "../utils/format";

const COMPACT_NUMBER_FIELD_SX = {
  width: 64,
  "& .MuiInputBase-root": {
    height: 28,
    fontSize: "0.8125rem",
  },
  "& .MuiInputBase-input": {
    py: 0.25,
    px: 0.75,
  },
} as const;

interface SliderNumberFieldProps {
  id: string;
  label: string;
  inputAriaLabel: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  decimals: number;
  unit?: string;
  inputMode: "decimal" | "numeric";
  /** Multiply the slider value for the text field (e.g. 0.01 so 60% shows as 0.60). */
  inputScale?: number;
  inputDecimals?: number;
  onInteractStart?: () => void;
  disableThumbTransition?: boolean;
}

function SliderNumberField({
  id,
  label,
  inputAriaLabel,
  value,
  onChange,
  min,
  max,
  step,
  decimals,
  unit,
  inputMode,
  inputScale = 1,
  inputDecimals,
  onInteractStart,
  disableThumbTransition,
}: SliderNumberFieldProps) {
  const fieldDecimals = inputDecimals ?? decimals;
  const inputMin = min * inputScale;
  const inputMax = max * inputScale;
  const inputStep =
    inputScale === 1
      ? step
      : Number((10 ** -fieldDecimals).toFixed(fieldDecimals));
  const inputValue = value * inputScale;

  const [input, setInput] = useState(() =>
    formatNumber(inputValue, fieldDecimals)
  );
  const [focused, setFocused] = useState(false);

  const applyInputNumber = (next: number) => {
    onInteractStart?.();
    const clampedInput = clampNumber(next, inputMin, inputMax, fieldDecimals);
    onChange(clampNumber(clampedInput / inputScale, min, max, decimals));
  };

  const commitFromInput = (raw: string) => {
    const next = parseDecimalInput(raw);
    if (!Number.isFinite(next)) {
      return;
    }
    applyInputNumber(next);
  };

  return (
    <Box>
      <Typography id={id}>{label}</Typography>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Box
          onKeyDown={onInteractStart}
          onPointerDown={onInteractStart}
          sx={{ flex: 1, px: 1 }}
        >
          <Slider
            aria-labelledby={id}
            max={max}
            min={min}
            onChange={(_, next) => {
              onChange(clampNumber(next as number, min, max, decimals));
            }}
            size="small"
            step={step}
            sx={
              disableThumbTransition
                ? {
                    "& .MuiSlider-thumb, & .MuiSlider-track": {
                      transition: "none",
                    },
                  }
                : undefined
            }
            value={value}
            valueLabelDisplay="auto"
            valueLabelFormat={(sliderValue) => {
              const formatted =
                decimals === 0
                  ? String(sliderValue)
                  : sliderValue.toFixed(decimals);
              return unit ? `${formatted} ${unit}` : formatted;
            }}
          />
        </Box>
        <TextField
          onBlur={() => {
            setFocused(false);
            commitFromInput(input);
          }}
          onChange={(event) => {
            const raw = event.target.value;
            setInput(raw);
            if (isIntermediateNumber(raw)) {
              return;
            }
            const next = parseDecimalInput(raw);
            if (!Number.isFinite(next)) {
              return;
            }
            applyInputNumber(next);
          }}
          onFocus={() => {
            setInput(formatNumber(inputValue, fieldDecimals));
            setFocused(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commitFromInput(input);
            }
          }}
          size="small"
          slotProps={{
            htmlInput: {
              "aria-label": inputAriaLabel,
              inputMode,
              max: inputMax,
              min: inputMin,
              step: inputStep,
            },
          }}
          sx={COMPACT_NUMBER_FIELD_SX}
          value={focused ? input : formatNumber(inputValue, fieldDecimals)}
        />
      </Stack>
    </Box>
  );
}

export default SliderNumberField;
