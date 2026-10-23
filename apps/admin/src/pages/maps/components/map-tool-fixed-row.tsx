import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import CloseIcon from "@mui/icons-material/Close";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import { useTranslation } from "react-i18next";

interface MapToolFixedRowProps {
  label: string;
  /** Removes the tool from the map. The row still cannot be moved. */
  onRemove?: () => void;
  /** Opens the map setting that turns this button on. */
  onShowSetting?: () => void;
  /** Opens the tool's own settings. The row still cannot be moved. */
  onOpenToolSettings?: () => void;
}

/** A map button whose order is fixed. It is shown, and it cannot be moved. */
export default function MapToolFixedRow({
  label,
  onRemove,
  onShowSetting,
  onOpenToolSettings,
}: MapToolFixedRowProps) {
  const { t } = useTranslation();

  return (
    <Box
      data-fixed-row=""
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        px: 1,
        py: 0.25,
        borderRadius: 1.5,
        border: "1px dashed",
        borderColor: "divider",
        bgcolor: "action.hover",
        opacity: onRemove ? 0.8 : 0.55,
        minWidth: 0,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          flex: 1,
          minWidth: 0,
          py: 0.5,
          cursor: "default",
        }}
      >
        <LockOutlinedIcon
          sx={{ fontSize: 16, color: "text.disabled", flexShrink: 0 }}
        />
        <Typography
          variant="body2"
          noWrap
          sx={{
            flex: 1,
            minWidth: 0,
            fontWeight: 600,
            color: "text.secondary",
          }}
        >
          {label}
        </Typography>
      </Box>
      {onOpenToolSettings ? (
        <Tooltip title={t("common.settings")}>
          <IconButton
            size="small"
            type="button"
            aria-label={t("common.settings")}
            onClick={onOpenToolSettings}
            sx={{ p: 0.5, flexShrink: 0 }}
          >
            <SettingsOutlinedIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      ) : null}
      {onShowSetting ? (
        <Tooltip title={t("maps.toolsShowMapSetting")}>
          <IconButton
            size="small"
            type="button"
            aria-label={t("maps.toolsShowMapSetting")}
            onClick={onShowSetting}
            sx={{ p: 0.5, flexShrink: 0 }}
          >
            <ArrowOutwardIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      ) : null}
      {onRemove ? (
        <Tooltip title={t("maps.toolsRemoveFromMap")}>
          <IconButton
            size="small"
            type="button"
            aria-label={t("maps.toolsRemoveFromMap")}
            onClick={onRemove}
            sx={{ p: 0.5, flexShrink: 0, "&:hover": { color: "error.main" } }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  );
}
