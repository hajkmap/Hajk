import { memo } from "react";
import {
  Box,
  ButtonBase,
  Collapse,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WebAssetOutlinedIcon from "@mui/icons-material/WebAssetOutlined";
import { useTranslation } from "react-i18next";
import type { ToolWindowPosition } from "../../../api/maps";
import type { ToolWindowSize } from "../map-tools-utils";
import type { BoardTool } from "../map-tools-board-model";
import WindowSizeField from "./map-tool-window-fields";

interface MapToolWindowSettingsProps {
  tool: BoardTool;
  expanded: boolean;
  onToggle: () => void;
  /** Shown before the window summary, e.g. the tool type. */
  summaryLead?: string | null;
  /** A click-and-drop is in progress, so the settings must stay as they are. */
  placementActive?: boolean;
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

function MapToolWindowSettings({
  tool,
  expanded,
  onToggle,
  summaryLead = null,
  placementActive = false,
  onWindowPositionChange,
  onWindowSizeChange,
  onPendingSizeChange,
}: MapToolWindowSettingsProps) {
  const { t } = useTranslation();
  const showSize = tool.showWindowWidth || tool.showWindowHeight;
  const auto = t("maps.toolsSizeAuto");
  const width = tool.windowWidth ?? tool.defaultWidth;
  const height = tool.windowHeight ?? tool.defaultHeight;
  const summary = [
    summaryLead,
    tool.showWindowPosition
      ? t(`maps.windowPlacement.${tool.windowPosition}`)
      : null,
    showSize
      ? `${tool.showWindowWidth ? (width ?? auto) : "–"} × ${
          tool.showWindowHeight ? (height ?? auto) : "–"
        }`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <ButtonBase
        type="button"
        aria-expanded={expanded}
        aria-disabled={placementActive}
        aria-label={t("maps.toolsWindowSettings")}
        onClick={(event) => {
          event.stopPropagation();
          if (placementActive) return;
          onToggle();
        }}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          px: 1.25,
          py: 0.6,
          borderTop: "1px solid",
          borderColor: "divider",
          color: "text.secondary",
          textAlign: "left",
          cursor: placementActive ? "default" : undefined,
          "&:hover": placementActive
            ? undefined
            : { bgcolor: "action.hover", color: "text.primary" },
        }}
      >
        <WebAssetOutlinedIcon sx={{ fontSize: 16, flexShrink: 0 }} />
        <Typography
          variant="caption"
          noWrap
          sx={{ flex: 1, minWidth: 0, fontVariantNumeric: "tabular-nums" }}
        >
          {summary}
        </Typography>
        <ExpandMoreIcon
          sx={{
            fontSize: 18,
            flexShrink: 0,
            transform: expanded ? "rotate(180deg)" : "none",
            transition: "transform 150ms ease",
          }}
        />
      </ButtonBase>
      <Collapse in={expanded} unmountOnExit>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 1.25,
            px: 1.25,
            pt: 0.5,
            pb: 1.25,
          }}
        >
          {tool.showWindowPosition ? (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mb: 0.5 }}
              >
                {t("maps.toolsWindowPlacement")}
              </Typography>
              <ToggleButtonGroup
                exclusive
                fullWidth
                size="small"
                value={tool.windowPosition}
                onChange={(_, next) => {
                  const position: ToolWindowPosition | null =
                    next === "left" ? "left" : next === "right" ? "right" : null;
                  if (position != null) {
                    onWindowPositionChange(tool.toolId, position);
                  }
                }}
                sx={{
                  "& .MuiToggleButton-root": {
                    py: 0.4,
                    textTransform: "none",
                  },
                }}
              >
                <ToggleButton value="left">
                  {t("maps.windowPlacement.left")}
                </ToggleButton>
                <ToggleButton value="right">
                  {t("maps.windowPlacement.right")}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          ) : null}
          {showSize ? (
            <Box sx={{ display: "flex", gap: 1 }}>
              {tool.showWindowWidth ? (
                <WindowSizeField
                  label={t("tools.width")}
                  value={tool.windowWidth}
                  placeholder={
                    tool.defaultWidth != null ? String(tool.defaultWidth) : auto
                  }
                  onCommit={(next) =>
                    onWindowSizeChange(tool.toolId, { width: next })
                  }
                  onPendingChange={(next, committed) =>
                    onPendingSizeChange(tool.toolId, "width", next, committed)
                  }
                />
              ) : null}
              {tool.showWindowHeight ? (
                <WindowSizeField
                  label={t("tools.height")}
                  value={tool.windowHeight}
                  placeholder={
                    tool.defaultHeight != null
                      ? String(tool.defaultHeight)
                      : auto
                  }
                  onCommit={(next) =>
                    onWindowSizeChange(tool.toolId, { height: next })
                  }
                  onPendingChange={(next, committed) =>
                    onPendingSizeChange(tool.toolId, "height", next, committed)
                  }
                />
              ) : null}
            </Box>
          ) : null}
        </Box>
      </Collapse>
    </>
  );
}

export default memo(MapToolWindowSettings);
