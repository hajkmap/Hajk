import { useState } from "react";
import {
  Box,
  ButtonBase,
  Chip,
  Collapse,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { useTranslation } from "react-i18next";

interface MapToolsUnplacedProps {
  tools: {
    toolId: number;
    title: string;
    type: string;
    active: boolean;
  }[];
  onAdd: () => void;
  onRemove: (toolId: number) => void;
  onOpenSettings: (toolId: number) => void;
}

function whereKey(type: string): string {
  switch (type) {
    case "search":
      return "maps.toolsUnplacedWhere.search";
    case "infoclick":
      return "maps.toolsUnplacedWhere.infoclick";
    case "documenthandler":
      return "maps.toolsUnplacedWhere.documents";
    case "commandpalette":
      return "maps.toolsUnplacedWhere.commandpalette";
    case "preset":
    case "externalLinks":
      return "maps.toolsUnplacedWhere.control";
    case "information":
      return "maps.toolsUnplacedWhere.information";
    default:
      return "maps.toolsUnplacedWhere.default";
  }
}

export default function MapToolsUnplaced({
  tools,
  onAdd,
  onRemove,
  onOpenSettings,
}: MapToolsUnplacedProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const activeCount = tools.filter((tool) => tool.active).length;

  return (
    <Box
      sx={{
        mb: 2,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        overflow: "hidden",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, pr: 1 }}>
        <ButtonBase
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          sx={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 1,
            px: 1.5,
            py: 1,
            textAlign: "left",
            "&:hover": { bgcolor: "action.hover" },
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
            {t("maps.toolsUnplacedTitle")}
          </Typography>
          <Chip
            size="small"
            label={activeCount}
            color={activeCount > 0 ? "primary" : "default"}
            variant="outlined"
            sx={{ height: 20, "& .MuiChip-label": { px: 0.75 } }}
          />
          <ExpandMoreIcon
            fontSize="small"
            sx={{
              color: "text.secondary",
              transition: "transform 150ms ease",
              transform: open ? "rotate(180deg)" : "none",
            }}
          />
        </ButtonBase>
        <Tooltip
          title={t("maps.toolsAddToPlacement", {
            placement: t("maps.toolsUnplacedTitle"),
          })}
        >
          <IconButton
            size="small"
            type="button"
            aria-label={t("maps.toolsAddToPlacement", {
              placement: t("maps.toolsUnplacedTitle"),
            })}
            onClick={onAdd}
            sx={{
              width: 28,
              height: 28,
              flexShrink: 0,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            <AddIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      </Box>
      <Collapse in={open} unmountOnExit>
        <Box sx={{ px: 1.5, pb: 1.5 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1.5, maxWidth: 760,mt:2 }}
          >
            {t("maps.toolsUnplacedHelp")}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: 1,
              "@container (min-width: 720px)": {
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              },
              "@container (min-width: 1160px)": {
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
              },
            }}
          >
            {tools.map((tool) => {
              const where = t(whereKey(tool.type));
              const typeName = t(`tools.typeNames.${tool.type}`, {
                defaultValue: tool.type,
              });
              const title = tool.title.trim();
              const hasTitle =
                title !== "" && title !== tool.type && title !== typeName;
              return (
                <Box
                  key={tool.toolId}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    px: 1.25,
                    py: 0.75,
                    minWidth: 0,
                borderRadius: 1.5,
                border: "1px dashed",
                borderColor: "divider",
                bgcolor: "action.hover",
              }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                      {hasTitle ? tool.title : typeName || tool.title}
                    </Typography>
                    {hasTitle ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        component="div"
                      >
                        {typeName}
                      </Typography>
                    ) : null}
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {where}
                    </Typography>
                  </Box>
                  <Tooltip title={t("maps.toolsWindowSettings")}>
                    <IconButton
                      size="small"
                      aria-label={t("maps.toolsWindowSettings")}
                      onClick={() => onOpenSettings(tool.toolId)}
                    >
                      <SettingsOutlinedIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t("maps.toolsRemoveFromMap")}>
                    <IconButton
                      size="small"
                      type="button"
                      aria-label={t("maps.toolsRemoveFromMap")}
                      onClick={() => onRemove(tool.toolId)}
                      sx={{ p: 0.5, flexShrink: 0, "&:hover": { color: "error.main" } }}
                    >
                      <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Tooltip>
                </Box>
              );
            })}
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}
