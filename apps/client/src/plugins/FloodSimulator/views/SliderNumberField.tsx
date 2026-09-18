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
  unit: string;
  inputMode: "decimal" | "numeric";
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
  onInteractStart,
  disableThumbTransition,
}: SliderNumberFieldProps) {
  const [input, setInput] = useState(() => formatNumber(value, decimals));
  const [focused, setFocused] = useState(false);

  const commit = (raw: string) => {
    const next = parseDecimalInput(raw);
    if (!Number.isFinite(next)) {
      return;
    }
    onInteractStart?.();
    onChange(clampNumber(next, min, max, decimals));
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
            valueLabelFormat={(sliderValue) =>
              `${decimals === 0 ? sliderValue : sliderValue.toFixed(decimals)} ${unit}`
            }
          />
        </Box>
        <TextField
          onBlur={() => {
            setFocused(false);
            commit(input);
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
            onInteractStart?.();
            onChange(clampNumber(next, min, max, decimals));
          }}
          onFocus={() => {
            setInput(formatNumber(value, decimals));
            setFocused(true);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              commit(input);
            }
          }}
          size="small"
          slotProps={{
            htmlInput: {
              "aria-label": inputAriaLabel,
              inputMode,
              max,
              min,
              step,
            },
          }}
          sx={COMPACT_NUMBER_FIELD_SX}
          value={focused ? input : formatNumber(value, decimals)}
        />
      </Stack>
    </Box>
  );
}

export default SliderNumberField;
