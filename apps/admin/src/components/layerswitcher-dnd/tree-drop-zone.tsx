import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Box, Chip, Typography } from "@mui/material";

import useAppStateStore from "../../store/use-app-state-store";

interface TreeDropZoneProps {
  children: React.ReactNode;
  id: string;
  title?: string;
  titleIcon?: React.ReactNode;
  helpText?: string;
  clientBucketLabel?: string;
  minHeight?: number;
}

export const TreeDropZone: React.FC<TreeDropZoneProps> = ({
  children,
  id,
  title,
  titleIcon,
  helpText,
  clientBucketLabel,
  minHeight = 280,
}) => {
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");

  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <Box
      ref={setNodeRef}
      sx={{
        minHeight,
        p: 1,
        borderRadius: 2,
        border: isOver ? "2px dashed" : "1px solid",
        borderColor: isOver ? "primary.main" : "#ddd",
        backgroundColor: isOver
          ? isDarkMode
            ? "#1e293b"
            : "#e3f2fd"
          : isDarkMode
          ? "#121212"
          : "#fafafa",
        transition: "all 0.2s ease",
      }}
    >
      {title ? (
        <Box sx={{ mb: 1.5, flexShrink: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            {titleIcon ? (
              <Box component="span" sx={{ display: "inline-flex" }}>
                {titleIcon}
              </Box>
            ) : null}
            <Typography variant="subtitle1" fontWeight={600}>
              {title}
            </Typography>
            {clientBucketLabel ? (
              <Chip
                size="small"
                variant="outlined"
                label={clientBucketLabel}
                sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}
              />
            ) : null}
          </Box>
          {helpText ? (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              {helpText}
            </Typography>
          ) : null}
        </Box>
      ) : null}
      <Box sx={{ minWidth: 0, width: "100%", overflow: "hidden" }}>{children}</Box>
    </Box>
  );
};
