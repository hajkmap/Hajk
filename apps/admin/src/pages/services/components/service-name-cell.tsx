import { ListItemText, Tooltip } from "@mui/material";
import { cellTooltipSx } from "../../../components/cell-tooltip";

interface ServiceNameCellProps {
  name: string;
  url: string;
  comment?: string | null;
}

export default function ServiceNameCell({
  name,
  url,
  comment,
}: ServiceNameCellProps) {
  return (
    <Tooltip
      title={comment ?? ""}
      disableHoverListener={!comment}
      enterDelay={800}
      enterNextDelay={800}
      slotProps={{
        tooltip: {
          sx: { "&&": { ...cellTooltipSx, maxWidth: 300 } },
        },
      }}
    >
      <ListItemText
        primary={name}
        secondary={url}
        sx={{ minWidth: 0 }}
        slotProps={{
          secondary: {
            sx: {
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            },
          },
        }}
      />
    </Tooltip>
  );
}
