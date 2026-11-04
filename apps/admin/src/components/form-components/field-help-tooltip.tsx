import type { ReactNode } from "react";
import { Box } from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import HajkTooltip from "../hajk-tooltip";

export function FieldHelpTooltip({ title }: { title: string }) {
  return (
    <HajkTooltip title={title}>
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          verticalAlign: "middle",
          height: "1lh",
          flexShrink: 0,
          ml: 0.5,
          color: "text.secondary",
          cursor: "help",
        }}
        aria-label={title}
        onMouseDown={(e) => e.preventDefault()}
      >
        <InfoOutlinedIcon sx={{ fontSize: 16 }} />
      </Box>
    </HajkTooltip>
  );
}

/** Label with an info tooltip (checkbox labels, table headers). */
export function FieldLabelWithHelp({
  label,
  help,
}: {
  label: ReactNode;
  help: string;
}) {
  return (
    <Box
      component="span"
      sx={{ display: "inline-flex", alignItems: "flex-start", gap: 0.25 }}
    >
      {label}
      <FieldHelpTooltip title={help} />
    </Box>
  );
}
