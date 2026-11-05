/** Outlined tooltip for data grid cells that show full text or status details. */
export const cellTooltipSx = {
  bgcolor: "background.paper",
  color: "text.primary",
  border: "1px solid",
  borderColor: "divider",
  borderRadius: 0,
  boxShadow: "none",
  typography: "body2",
} as const;

export const cellTooltipSlotProps = {
  tooltip: { sx: { "&&": cellTooltipSx } },
} as const;
