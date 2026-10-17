import { Box, Tooltip, Typography } from "@mui/material";
import type { ReactElement } from "react";

import type { LayerTreeItemDetails } from "./use-item-details";

interface LayerTreeItemTooltipProps {
  name: string;
  details: LayerTreeItemDetails;
  children: ReactElement;
}

/** Shows where a group or layer belongs when pointing at it. */
export default function LayerTreeItemTooltip({
  name,
  details,
  children,
}: LayerTreeItemTooltipProps) {
  return (
    <Tooltip
      enterDelay={400}
      enterNextDelay={200}
      placement="bottom-start"
      disableInteractive
      title={
        <Box>
          <Typography variant="subtitle2">{name}</Typography>
          {details.lines.map((line) => (
            <Typography key={line} variant="body2">
              {line}
            </Typography>
          ))}
        </Box>
      }
    >
      {children}
    </Tooltip>
  );
}
