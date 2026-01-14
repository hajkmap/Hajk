import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Box, Paper, Typography, alpha } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ClearIcon from "@mui/icons-material/Clear";
import LockIcon from "@mui/icons-material/Lock";
import useAppStateStore from "../../store/use-app-state-store";
import { useTranslation } from "react-i18next";

export type ToolPlacement =
  | "drawer"
  | "widgetLeft"
  | "widgetRight"
  | "controlButton";

interface PlacementDropZoneProps {
  id: ToolPlacement;
  label: string;
  children?: React.ReactNode;
  disabled?: boolean;
  hideBackground?: boolean;
  isEmpty?: boolean;
}

const PlacementDropZone: React.FC<PlacementDropZoneProps> = ({
  id,
  label,
  children,
  disabled = false,
  hideBackground = false,
  isEmpty = false,
}) => {
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");
  // Don't pass disabled to useDroppable - we want items inside to still be droppable
  const { setNodeRef, isOver } = useDroppable({ id });
  const isOverDisabled = isOver && disabled;

  return (
    <Box
      ref={setNodeRef}
      sx={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        p: 1,
        borderRadius: 1,
        border: !isEmpty && hideBackground ? "none" : "2px dashed",
        borderColor:
          !isEmpty && hideBackground
            ? "transparent"
            : isOverDisabled
            ? "error.main"
            : isOver
            ? "primary.main"
            : alpha(isDarkMode ? "#fff" : "#000", 0.3),
        backgroundColor:
          !isEmpty && hideBackground
            ? "transparent"
            : isOverDisabled
            ? alpha(isDarkMode ? "#f44336" : "#f44336", 0.2)
            : isOver
            ? alpha(isDarkMode ? "#1e88e5" : "#2196f3", 0.2)
            : alpha(isDarkMode ? "#fff" : "#000", 0.05),
        opacity: isOverDisabled ? 0.6 : 1,
        transition: "all 0.2s ease",
        overflowY: "auto",
        scrollbarWidth: "none",
        overflowX: "hidden",
      }}
    >
      {children}
      <Typography
        variant="caption"
        sx={{
          fontWeight: 800,
          mb: 0.5,
          color: isOverDisabled
            ? "error.main"
            : isOver
            ? "primary.main"
            : "text.secondary",
          textAlign: "center",
          display: hideBackground ? "none" : undefined,
        }}
      >
        {label}
        {isOverDisabled ? " (Full)" : ""}
      </Typography>
    </Box>
  );
};

interface ToolPlacementWindowProps {
  /** Background image URL to represent the map */
  backgroundImage?: string;
  /** Optional content for each placement zone */
  drawerContent?: React.ReactNode;
  widgetLeftContent?: React.ReactNode;
  widgetRightContent?: React.ReactNode;
  controlButtonContent?: React.ReactNode;
  /** Height of the preview window */
  height?: number | string;
  /** Whether the widget zones are full */
  isWidgetLeftFull?: boolean;
  isWidgetRightFull?: boolean;
  isWidgetLeftEmpty?: boolean;
  isWidgetRightEmpty?: boolean;
  isControlButtonEmpty?: boolean;
  hideBackground?: boolean;
}

export const ToolPlacementWindow: React.FC<ToolPlacementWindowProps> = ({
  backgroundImage,
  drawerContent,
  widgetLeftContent,
  widgetRightContent,
  controlButtonContent,
  height = 600,
  isWidgetLeftFull = false,
  isWidgetRightFull = false,
  isWidgetLeftEmpty = false,
  isWidgetRightEmpty = false,
  isControlButtonEmpty = false,
  hideBackground = false,
}) => {
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");
  const { t } = useTranslation();
  // const [currentTab, setCurrentTab] = React.useState(0);

  // Default map-like background gradient if no image provided
  const defaultBackground = isDarkMode
    ? "linear-gradient(135deg, #1a237e 0%, #0d47a1 25%, #01579b 50%, #006064 75%, #004d40 100%)"
    : "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 25%, #a5d6a7 50%, #81c784 75%, #66bb6a 100%)";

  return (
    <Paper
      elevation={3}
      sx={{
        height,
        width: "100%",
        position: "relative",
        borderRadius: 2,
        display: "flex",
        background: backgroundImage
          ? `url(${backgroundImage}) center/cover no-repeat`
          : defaultBackground,
        overflow: "auto",
      }}
    >
      {backgroundImage && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundColor: alpha(isDarkMode ? "#000" : "#fff", 0.25),
            zIndex: 0,
            pointerEvents: "none",
          }}
        />
      )}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(${alpha(
              isDarkMode ? "#fff" : "#000",
              0.05
            )} 1px, transparent 1px),
            linear-gradient(90deg, ${alpha(
              isDarkMode ? "#fff" : "#000",
              0.05
            )} 1px, transparent 1px)
          `,
          backgroundSize: "0px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Drawer */}
      <Box
        sx={{
          width: 220,
          height: "100%",
          flexShrink: 0,
          p: 0.5,
          backgroundColor: alpha(isDarkMode ? "#121212" : "#fff", 0.9),
          borderRight: `1px solid ${alpha(isDarkMode ? "#fff" : "#000", 0.1)}`,
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box sx={{ opacity: 0.6 }}>
          <Typography
            variant="h5"
            sx={{
              textAlign: "center",
              mb: 1,
              mt: 1,
            }}
          >
            Varbergs kommun
          </Typography>
        </Box>
        <Box
          sx={{
            opacity: 0.6,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            mb: 1,
            pl: 1,
            pr: 1,
            borderBottom: `1px solid ${alpha(
              isDarkMode ? "#fff" : "#000",
              0.1
            )}`,
            borderTop: `1px solid ${alpha(isDarkMode ? "#fff" : "#000", 0.1)}`,
            pt: 0.5,
            pb: 0.5,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              textAlign: "center",
              fontWeight: 600,
            }}
          >
            {t("layerSwitcherDnd.tools").toUpperCase()}
          </Typography>
          <LockIcon
            sx={{
              fontSize: 16,
            }}
          />
        </Box>
        <PlacementDropZone
          id="drawer"
          label="Drawer"
          hideBackground={hideBackground}
        >
          {drawerContent}
        </PlacementDropZone>
      </Box>

      {/* Main area with widget placements */}
      <Box
        sx={{
          flex: 1,
          height: "100%",
          display: "flex",
          position: "relative",
          pr: 1.5,
          pl: 1.5,
        }}
      >
        {/* Widget Left */}
        <Box
          sx={{
            width: 160,
            height: 280,
            flexShrink: 0,
            mt: 6,
            mr: 1,
            backgroundColor: hideBackground
              ? "transparent"
              : alpha(isDarkMode ? "#121212" : "#fff", 0.9),
            borderRadius: 1,
            boxShadow: hideBackground ? 0 : 2,
            p: 0.5,
          }}
        >
          <PlacementDropZone
            id="widgetLeft"
            label="Widget Left"
            disabled={isWidgetLeftFull}
            hideBackground={hideBackground}
            isEmpty={isWidgetLeftEmpty}
          >
            {widgetLeftContent}
          </PlacementDropZone>
        </Box>

        {/* Spacer */}
        <Box sx={{ flex: 1 }} />

        {/* Widget Right */}
        <Box
          sx={{
            width: 160,
            height: 280,
            flexShrink: 0,
            mt: 6,
            backgroundColor: hideBackground
              ? "transparent"
              : alpha(isDarkMode ? "#121212" : "#fff", 0.9),
            borderRadius: 1,
            boxShadow: hideBackground ? 0 : 2,
            p: 0.5,
          }}
        >
          <PlacementDropZone
            id="widgetRight"
            label="Widget Right"
            disabled={isWidgetRightFull}
            hideBackground={hideBackground}
            isEmpty={isWidgetRightEmpty}
          >
            {widgetRightContent}
          </PlacementDropZone>
        </Box>
      </Box>

      {/* Control Buttons*/}
      <Box
        sx={{
          width: 80,
          height: 500,
          flexShrink: 0,
          p: 0.5,
          mt: 6,
          mr: 1,
          backgroundColor: hideBackground
            ? "transparent"
            : alpha(isDarkMode ? "#121212" : "#fff", 0.9),
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          boxShadow: hideBackground ? 0 : 2,
          zIndex: 1,
        }}
      >
        <PlacementDropZone
          id="controlButton"
          label="Controls"
          hideBackground={hideBackground}
          isEmpty={isControlButtonEmpty}
        >
          {controlButtonContent}
        </PlacementDropZone>
      </Box>

      {/* Scale indicator */}
      <Box
        sx={{
          opacity: 0.6,
          position: "absolute",
          bottom: 8,
          right: 8,
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          backgroundColor: alpha(isDarkMode ? "#121212" : "#fff", 0.8),
          borderRadius: 1,
          px: 1,
          py: 0.5,
          pointerEvents: "none",
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Scale: 1:50000
        </Typography>
      </Box>

      {/* Search input */}
      <Box
        sx={{
          opacity: 0.6,
          position: "absolute",
          top: 8,
          right: 10,
          width: 300,
          height: 30,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: alpha(isDarkMode ? "#121212" : "#fff", 0.8),
          pointerEvents: "none",
        }}
      >
        <Typography variant="caption" sx={{ fontSize: 14, ml: 1 }}>
          {t("layerSwitcherDnd.search")}...
        </Typography>
        <Box>
          <SearchIcon />
          <MoreVertIcon />
        </Box>
      </Box>

      {/* Map tools */}
      <Box
        sx={{
          opacity: 0.6,
          position: "absolute",
          top: 8,
          left: 235,
          width: 130,
          height: 30,
          p: 0.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: alpha(isDarkMode ? "#121212" : "#fff", 0.8),
          pointerEvents: "none",
        }}
      >
        <ClearIcon sx={{ fontSize: 18 }} />
        <Typography
          variant="caption"
          sx={{
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {t("layerSwitcherDnd.tools").toUpperCase()}
        </Typography>
      </Box>
    </Paper>
  );
};

export default ToolPlacementWindow;
