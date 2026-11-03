import { memo } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { useTranslation } from "react-i18next";
import type { ToolWindowPosition } from "../../../api/maps";
import { toolLabels, type ToolWindowSize } from "../map-tools-utils";
import type { BoardTool } from "../map-tools-board-model";
import MapToolWindowSettings from "./map-tool-window-settings";

interface MapToolsUnplacedRowProps {
  tool: BoardTool;
  /** Where the map shows the tool, since it has no column. */
  where: string;
  /** Kept by the list, so a row that moves to another column stays open. */
  expanded: boolean;
  onToggleExpanded: (toolId: number) => void;
  onRemove: (toolId: number) => void;
  onOpenSettings: (toolId: number) => void;
  onWindowPositionChange: (
    toolId: number,
    position: ToolWindowPosition,
  ) => void;
  onWindowSizeChange: (toolId: number, size: Partial<ToolWindowSize>) => void;
  onPendingSizeChange: (
    toolId: number,
    dimension: "width" | "height",
    nextValue: number | undefined,
    committedValue: number | undefined,
  ) => void;
}

function MapToolsUnplacedRow({
  tool,
  where,
  expanded,
  onToggleExpanded,
  onRemove,
  onOpenSettings,
  onWindowPositionChange,
  onWindowSizeChange,
  onPendingSizeChange,
}: MapToolsUnplacedRowProps) {
  const { t } = useTranslation();
  const { typeName, hasTitle, label } = toolLabels(tool, t);

  return (
    <Box
      sx={{
        minWidth: 0,
        borderRadius: 1.5,
        border: "1px solid",
        borderColor: expanded ? "primary.main" : "divider",
        bgcolor: "action.hover",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.25,
          py: 0.75,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
            {label}
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
        <Tooltip title={t("common.settings")}>
          <IconButton
            size="small"
            aria-label={t("common.settings")}
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
      {tool.showWindowPosition ||
      tool.showWindowWidth ||
      tool.showWindowHeight ? (
        <MapToolWindowSettings
          tool={tool}
          expanded={expanded}
          onToggle={() => onToggleExpanded(tool.toolId)}
          onWindowPositionChange={onWindowPositionChange}
          onWindowSizeChange={onWindowSizeChange}
          onPendingSizeChange={onPendingSizeChange}
        />
      ) : null}
    </Box>
  );
}

export default memo(MapToolsUnplacedRow);
