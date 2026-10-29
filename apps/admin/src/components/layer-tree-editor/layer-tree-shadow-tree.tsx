import FolderIcon from "@mui/icons-material/Folder";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import LayersIcon from "@mui/icons-material/Layers";
import { Box, Chip, CircularProgress, Paper, Typography } from "@mui/material";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type {
  LayerTreeShadowRow,
  LayerTreeShadowStatus,
} from "./layer-tree-shadow";

const STATUS_COLORS: Record<
  LayerTreeShadowStatus,
  "success" | "error" | "info" | "warning" | "primary"
> = {
  new: "success",
  added: "success",
  removed: "error",
  moved: "info",
  hidden: "warning",
  shown: "info",
  changed: "primary",
};

/** Why there are no rows to show. */
export type LayerTreeShadowState = "loading" | "failed" | "tooBig";

interface LayerTreeShadowTreeProps {
  rows: LayerTreeShadowRow[];
  /** A saved tree still loading or failing to, or a draft too big to send. */
  state?: LayerTreeShadowState;
  /** The toolbar's search: the matches and the groups they are in. */
  search: string;
}

/**
 * Someone else's tree in the tree's place, unsaved or saved after one's own
 * draft began: faint grey and read only, with what differs from the saved
 * tree one has loaded marked.
 */
export default function LayerTreeShadowTree({
  rows,
  state,
  search,
}: LayerTreeShadowTreeProps) {
  const { t } = useTranslation();
  const term = search.trim().toLowerCase();
  const shown = useMemo(() => {
    if (!term) return rows;
    const keep = new Set<number>();
    // The rows above at each depth: a match keeps them.
    const path: number[] = [];
    rows.forEach((row, index) => {
      path.length = row.depth;
      if (row.text.toLowerCase().includes(term)) {
        for (const above of path) keep.add(above);
        keep.add(index);
      }
      path.push(index);
    });
    return rows.filter((_, index) => keep.has(index));
  }, [rows, term]);
  const empty =
    state === "loading" ? (
      <CircularProgress size={24} />
    ) : state === "failed" ? (
      t("layerTree.loadFailed")
    ) : state === "tooBig" ? (
      t("presence.shadow.tooBig")
    ) : rows.length === 0 ? (
      t("presence.shadow.none")
    ) : shown.length === 0 ? (
      t("layerTree.noMatches")
    ) : null;

  return (
    <Paper
      variant="outlined"
      data-presence-shadow
      sx={{
        position: "relative",
        flex: { lg: "1 1 0" },
        minHeight: 160,
        overflowY: { lg: "auto" },
        overscrollBehavior: "contain",
        bgcolor: "action.hover",
        // Faint as a shadow, all of it.
        opacity: 0.6,
      }}
    >
      {empty ? (
        <Typography
          color="text.secondary"
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            px: 2,
            textAlign: "center",
          }}
        >
          {empty}
        </Typography>
      ) : (
        shown.map((row, index) => (
          <ShadowRow
            key={row.key}
            row={row}
            open={(shown[index + 1]?.depth ?? 0) > row.depth}
          />
        ))
      )}
    </Paper>
  );
}

function ShadowRow({ row, open }: { row: LayerTreeShadowRow; open: boolean }) {
  const { t } = useTranslation();
  const accent = row.statuses[0];
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        minHeight: 38,
        pl: `${row.depth * 24}px`,
        pr: 1,
        borderBottom: 1,
        borderBottomColor: "divider",
        borderLeft: 3,
        borderLeftColor: accent
          ? `${STATUS_COLORS[accent]}.main`
          : "transparent",
      }}
    >
      {/* Where the tree has its drag handle and its arrow. */}
      <Box sx={{ width: 20, flexShrink: 0 }} />
      <Box
        sx={{
          width: 30,
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
        }}
      >
        {open ? (
          <KeyboardArrowRightIcon
            fontSize="small"
            sx={{ color: "text.disabled", transform: "rotate(90deg)" }}
          />
        ) : null}
      </Box>
      {row.kind === "group" ? (
        <FolderIcon fontSize="small" sx={{ color: "text.disabled" }} />
      ) : (
        <LayersIcon fontSize="small" sx={{ color: "text.disabled" }} />
      )}
      <Typography
        variant="body2"
        noWrap
        sx={{
          flex: 1,
          minWidth: 0,
          fontWeight: row.kind === "group" ? 500 : 400,
          color: row.removed ? "text.disabled" : "text.secondary",
          textDecoration: row.removed ? "line-through" : "none",
        }}
      >
        {row.text}
      </Typography>
      {row.statuses.map((status) => (
        <Chip
          key={status}
          size="small"
          variant="outlined"
          color={STATUS_COLORS[status]}
          label={t(`presence.shadow.status.${status}`)}
        />
      ))}
    </Box>
  );
}
