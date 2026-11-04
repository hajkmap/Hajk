import { ListItemText, Tooltip } from "@mui/material";

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
          sx: {
            "&&": {
              bgcolor: "background.paper",
              color: "text.primary",
              border: "1px solid black",
              borderRadius: 0,
              boxShadow: "none",
              fontSize: "1.1rem",
              maxWidth: 300,
            },
          },
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
