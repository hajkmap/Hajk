import CreateNewFolderOutlinedIcon from "@mui/icons-material/CreateNewFolderOutlined";
import RedoIcon from "@mui/icons-material/Redo";
import UndoIcon from "@mui/icons-material/Undo";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import { Box, Button, IconButton, TextField, Tooltip } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { LayerTreeHistoryControls } from "./use-draft-history";

interface LayerTreeToolbarProps {
  /** Shows "New group" (top level of the tree) when set. */
  onNewGroup?: () => void;
  search: string;
  onSearchChange: (search: string) => void;
  /** As the client: no search where its layerswitcher has no filter. */
  showSearch?: boolean;
  allExpanded: boolean;
  /** Some group has content to show. */
  canExpand: boolean;
  onToggleAll: () => void;
  disabled: boolean;
  /** Undo and redo (also Ctrl+Z and Ctrl+Y). */
  history?: LayerTreeHistoryControls;
}

/** Above the tree: a new group, search, and expand/collapse all as in Lagerordning. */
export default function LayerTreeToolbar({
  onNewGroup,
  search,
  onSearchChange,
  showSearch = true,
  allExpanded,
  canExpand,
  onToggleAll,
  disabled,
  history,
}: LayerTreeToolbarProps) {
  const { t } = useTranslation();
  const undoLabel = t("layerTree.undo");
  const redoLabel = t("layerTree.redo");
  const expandLabel = t(
    allExpanded
      ? "groupsDevelopment.collapseAllGroups"
      : "groupsDevelopment.expandAllGroups",
  );

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        mb: 1,
        flexShrink: 0,
      }}
    >
      {onNewGroup ? (
        <Button
          size="small"
          startIcon={<CreateNewFolderOutlinedIcon />}
          disabled={disabled}
          onClick={onNewGroup}
        >
          {t("layerTree.newGroup")}
        </Button>
      ) : null}
      {history ? (
        <>
          <Tooltip title={undoLabel}>
            <span>
              <IconButton
                size="small"
                aria-label={undoLabel}
                disabled={disabled || !history.canUndo}
                onClick={history.undo}
              >
                <UndoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title={redoLabel}>
            <span>
              <IconButton
                size="small"
                aria-label={redoLabel}
                disabled={disabled || !history.canRedo}
                onClick={history.redo}
              >
                <RedoIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </>
      ) : null}
      {showSearch ? (
        <TextField
          size="small"
          placeholder={t("layerTree.searchTree")}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          // Enter would otherwise submit a surrounding form.
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          sx={{ flex: 1, maxWidth: 320, ml: "auto" }}
        />
      ) : (
        <Box sx={{ flex: 1 }} />
      )}
      <Tooltip title={expandLabel}>
        <span>
          <IconButton
            size="small"
            aria-label={expandLabel}
            disabled={!canExpand}
            onClick={onToggleAll}
          >
            {allExpanded ? (
              <UnfoldLessIcon fontSize="small" />
            ) : (
              <UnfoldMoreIcon fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </Box>
  );
}
