import { Box, Stack, Typography } from "@mui/material";

import { UI_STRINGS } from "../constants";
import type { Readout } from "../types";

interface ElevationReadoutProps {
  readout: Readout;
}

function ElevationReadout({ readout }: ElevationReadoutProps) {
  const elevation =
    readout.kind === "value" ? formatReadoutValue(readout.elevation) : "-";
  const depth =
    readout.kind === "value" ? formatReadoutValue(readout.depth) : "-";

  return (
    <Box
      aria-label={`${UI_STRINGS.readoutElevationLabel} ${elevation}, ${UI_STRINGS.readoutDepthLabel} ${depth}`}
      aria-live="polite"
      sx={{
        px: { xs: 1.5, sm: 2 },
        py: 1,
        bgcolor: "primary.main",
        color: "primary.contrastText",
      }}
    >
      <Stack
        direction="row"
        divider={
          <Box
            sx={{
              width: "1px",
              alignSelf: "stretch",
              bgcolor: "currentColor",
              opacity: 0.24,
            }}
          />
        }
        spacing={2}
      >
        <ReadoutColumn
          label={UI_STRINGS.readoutElevationLabel}
          value={elevation}
        />
        <ReadoutColumn label={UI_STRINGS.readoutDepthLabel} value={depth} />
      </Stack>
    </Box>
  );
}

function ReadoutColumn({ label, value }: { label: string; value: string }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ flex: 1, minWidth: 0, alignItems: "baseline" }}
    >
      <Typography sx={{ opacity: 0.8 }} variant="body2">
        {label}
      </Typography>
      <Typography sx={{ fontVariantNumeric: "tabular-nums" }} variant="body2">
        {value}
      </Typography>
    </Stack>
  );
}

function formatReadoutValue(value: number): string {
  return `${value.toFixed(2)} m`;
}

export default ElevationReadout;
