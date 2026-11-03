import {
  Box,
  Checkbox,
  Chip,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import NetworkPingIcon from "@mui/icons-material/NetworkPing";
import { useTranslation } from "react-i18next";
import type { ProjectionRow as Row } from "./projection-rows";

interface ProjectionRowProps {
  row: Row;
  /** How many of the row's codes the map links. */
  linkedCount: number;
  isMain: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function UsageChip({
  icon,
  heading,
  lines,
}: {
  icon: React.ReactElement;
  heading: string;
  lines: string[];
}) {
  if (lines.length === 0) return null;
  return (
    <Tooltip
      enterDelay={300}
      title={
        <>
          <Typography
            variant="caption"
            sx={{ display: "block", fontWeight: 600, mb: 0.5 }}
          >
            {`${heading} (${lines.length})`}
          </Typography>
          {lines.map((line) => (
            <Typography key={line} variant="caption" sx={{ display: "block" }}>
              {line}
            </Typography>
          ))}
        </>
      }
    >
      <Chip
        icon={icon}
        label={lines.length}
        size="small"
        color="primary"
        variant="outlined"
        sx={{ fontWeight: 600 }}
      />
    </Tooltip>
  );
}

/** One projection: link checkbox, codes, units, usage and actions. */
export default function ProjectionRow({
  row,
  linkedCount,
  isMain,
  onToggle,
  onEdit,
  onDelete,
}: ProjectionRowProps) {
  const { t } = useTranslation();
  const all = linkedCount === row.codes.length;
  const some = linkedCount > 0 && !all;
  const inCatalogue = row.primary !== undefined;

  const mapLine = (m: Row["maps"][number]) =>
    `${m.name} (${t(m.usage === "main" ? "projections.main" : "projections.linked")}${
      m.deleted ? `, ${t("projections.deletedMap")}` : ""
    })`;

  // Saved usage doesn't see unsaved ticks, so a linked row is in use too.
  const inUse =
    row.maps.length > 0 || row.services.length > 0 || linkedCount > 0;
  const deleteBlocked = row.locked
    ? t("projections.locked")
    : inUse
      ? t("projections.deleteBlocked")
      : null;

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1,
        py: 0.25,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Checkbox
        size="small"
        checked={all}
        indeterminate={some}
        // The main projection can't be unlinked, but a partly linked main
        // group can still be completed.
        disabled={isMain && all}
        onChange={onToggle}
        slotProps={{ input: { "aria-label": row.label } }}
        sx={{ py: 0.5 }}
      />
      <Box sx={{ flex: 1, minWidth: 0, pt: 0.75 }}>
        <Typography
          variant="body2"
          sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
        >
          {row.label}
          {row.locked && (
            <Tooltip title={t("projections.locked")}>
              <LockOutlinedIcon fontSize="inherit" color="action" />
            </Tooltip>
          )}
          {isMain && (
            <Typography
              component="span"
              variant="caption"
              color="text.secondary"
            >
              {`· ${t("projections.main")}`}
            </Typography>
          )}
        </Typography>
        {row.codes.slice(1).map((alias) => (
          <Typography
            key={alias}
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", wordBreak: "break-all" }}
          >
            {alias}
          </Typography>
        ))}
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, pt: 0.25 }}>
        {row.units && (
          <Tooltip title={t("projections.units")}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ px: 0.5 }}
            >
              {row.units}
            </Typography>
          </Tooltip>
        )}
        <UsageChip
          icon={<MapOutlinedIcon />}
          heading={t("projections.maps")}
          lines={row.maps.map(mapLine)}
        />
        <UsageChip
          icon={<NetworkPingIcon />}
          heading={t("projections.services")}
          lines={row.services.map((s) => s.name)}
        />
        {inCatalogue && (
          <>
            <Tooltip
              title={
                row.locked ? t("projections.locked") : t("projections.edit")
              }
            >
              <span>
                <IconButton size="small" disabled={row.locked} onClick={onEdit}>
                  <EditOutlinedIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={deleteBlocked ?? t("common.delete")}>
              <span>
                <IconButton
                  size="small"
                  disabled={deleteBlocked !== null}
                  onClick={onDelete}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </>
        )}
      </Box>
    </Box>
  );
}
