import React from "react";
import { Box, Chip, Tooltip, Typography } from "@mui/material";
import LayersIcon from "@mui/icons-material/Layers";
import FolderIcon from "@mui/icons-material/Folder";
import TitleIcon from "@mui/icons-material/Title";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import { useTranslation } from "react-i18next";

import type { GroupCatalogMeta } from "../pages/groups/utils/group-composition-stats";

interface GroupCompositionSummaryProps {
  meta?: GroupCatalogMeta;
  /** Compact layout for narrow DnD source cards. */
  compact?: boolean;
}

export default function GroupCompositionSummary({
  meta,
  compact = false,
}: GroupCompositionSummaryProps) {
  const { t } = useTranslation();

  if (!meta) {
    return null;
  }

  const {
    layerCount = 0,
    nestedGroupCount = 0,
    toggleAllEnabled,
  } = meta;

  const chips = (
    <>
      <Tooltip title={t("groups.composition.layerCount", { count: layerCount })}>
        <Chip
          size="small"
          variant="outlined"
          icon={<LayersIcon />}
          label={layerCount}
          sx={{ height: compact ? 22 : 24 }}
        />
      </Tooltip>
      <Tooltip
        title={t("groups.composition.nestedGroupCount", {
          count: nestedGroupCount,
        })}
      >
        <Chip
          size="small"
          variant="outlined"
          icon={<FolderIcon />}
          label={nestedGroupCount}
          sx={{ height: compact ? 22 : 24 }}
        />
      </Tooltip>
      {toggleAllEnabled !== undefined ? (
        <Tooltip
          title={
            toggleAllEnabled
              ? t("groups.composition.activatableHelp")
              : t("groups.composition.headerGroupHelp")
          }
        >
          <Chip
            size="small"
            color={toggleAllEnabled ? "primary" : "default"}
            variant={toggleAllEnabled ? "filled" : "outlined"}
            icon={toggleAllEnabled ? <ToggleOnIcon /> : <TitleIcon />}
            label={
              toggleAllEnabled
                ? t("groups.composition.activatable")
                : t("groups.composition.headerGroup")
            }
            sx={{ height: compact ? 22 : 24 }}
          />
        </Tooltip>
      ) : null}
    </>
  );

  if (compact) {
    return (
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 0.5,
          mt: 0.5,
        }}
      >
        {chips}
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75 }}>
      {chips}
    </Box>
  );
}

export function GroupCompositionIconsCell({
  layerCount = 0,
  nestedGroupCount = 0,
}: {
  layerCount?: number;
  nestedGroupCount?: number;
}) {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
      <Tooltip title={t("groups.composition.layerCount", { count: layerCount })}>
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
          <LayersIcon fontSize="small" color="action" />
          <Typography variant="body2">{layerCount}</Typography>
        </Box>
      </Tooltip>
      <Tooltip
        title={t("groups.composition.nestedGroupCount", {
          count: nestedGroupCount,
        })}
      >
        <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
          <FolderIcon fontSize="small" color="action" />
          <Typography variant="body2">{nestedGroupCount}</Typography>
        </Box>
      </Tooltip>
    </Box>
  );
}
