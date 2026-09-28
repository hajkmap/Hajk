import type { ReactNode } from "react";

import { Box, Stack, Typography } from "@mui/material";

import { UI_STRINGS } from "../constants";
import type { DepthColorStop } from "../types";

interface DepthColorLegendProps {
  stops: DepthColorStop[];
  headerAction?: ReactNode;
}

function DepthColorLegend({ stops, headerAction }: DepthColorLegendProps) {
  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 0.75,
        }}
      >
        <Typography>{UI_STRINGS.depthColorsLegend}</Typography>
        {headerAction}
      </Box>
      <Stack spacing={0.5}>
        {depthColorLegendItems(stops).map((item) => (
          <Stack
            key={`${item.color}:${item.label}`}
            direction="row"
            spacing={1}
            sx={{ alignItems: "center" }}
          >
            <Box
              sx={{
                width: 16,
                height: 16,
                flexShrink: 0,
                borderRadius: 0.5,
                bgcolor: item.color,
                border: "1px solid",
                borderColor: "divider",
              }}
            />
            <Typography variant="body2">{item.label}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function formatDepth(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function depthColorLegendItems(
  stops: DepthColorStop[]
): { color: string; label: string }[] {
  return stops.map((stop, index) => {
    const previous = index === 0 ? 0 : stops[index - 1].maxDepth;
    const isLast = index === stops.length - 1;
    const label =
      isLast && stops.length > 1
        ? UI_STRINGS.depthClassFrom(formatDepth(previous))
        : UI_STRINGS.depthClassRange(
            formatDepth(previous),
            formatDepth(stop.maxDepth)
          );
    return { color: stop.color, label };
  });
}

export default DepthColorLegend;
