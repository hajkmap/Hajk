import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CheckIcon from "@mui/icons-material/Check";
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useTranslation } from "react-i18next";
import type { ToolZone } from "../../../api/maps";
import type { AddableTool } from "../map-tools-board-model";

/** The tool instance of a given type already on the map, and where it sits. */
export interface PlacedToolOfType {
  title: string;
  zone: ToolZone | "unplaced";
}

interface MapToolsAddDialogProps {
  open: boolean;
  title: string;
  tools: AddableTool[];
  /** Tools already in a placement column, keyed by tool type. */
  placedByType: Map<string, PlacedToolOfType>;
  onClose: () => void;
  onSelect: (toolIds: number[]) => void;
}

function MapToolsAddDialog({
  open,
  title,
  tools,
  placedByType,
  onClose,
  onSelect,
}: MapToolsAddDialogProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [openWarnings, setOpenWarnings] = useState<Set<number>>(
    () => new Set(),
  );

  const toolsById = useMemo(
    () => new Map(tools.map((tool) => [tool.toolId, tool])),
    [tools],
  );

  const selectedTools = useMemo(
    () =>
      selectedIds.flatMap((toolId) => {
        const tool = toolsById.get(toolId);
        return tool ? [tool] : [];
      }),
    [selectedIds, toolsById],
  );

  const toggleWarning = (toolId: number) => {
    setOpenWarnings((current) => {
      const next = new Set(current);
      if (next.has(toolId)) next.delete(toolId);
      else next.add(toolId);
      return next;
    });
  };

  const toggleSelected = (toolId: number) => {
    setSelectedIds((current) =>
      current.includes(toolId)
        ? current.filter((id) => id !== toolId)
        : [...current, toolId],
    );
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return tools;
    return tools.filter(
      (tool) =>
        tool.title.toLowerCase().includes(query) ||
        tool.type.toLowerCase().includes(query),
    );
  }, [search, tools]);

  const confirmSelection = () => {
    if (selectedIds.length === 0) return;
    onSelect(selectedIds);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      slotProps={{
        transition: {
          onEnter: () => {
            setSearch("");
            setSelectedIds([]);
            setOpenWarnings(new Set());
          },
        },
        paper: {
          sx: {
            overflowY: "auto",
          },
        },
      }}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent
        sx={{
          "&&": {
            flex: "0 0 auto",
            overflowY: "visible",
          },
        }}
      >
        <TextField
          autoFocus
          fullWidth
          size="small"
          value={search}
          placeholder={t("tools.searchTitle")}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            if (filtered.length === 1) {
              toggleSelected(filtered[0].toolId);
              return;
            }
            if (selectedIds.length > 0) confirmSelection();
          }}
          slotProps={{
            input: {
              startAdornment: (
                <SearchIcon
                  fontSize="small"
                  sx={{ mr: 1, color: "text.secondary" }}
                />
              ),
            },
          }}
          sx={{ mt: 0.5, mb: 1.5 }}
        />
        {selectedTools.length > 0 ? (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              mb: 1.5,
            }}
          >
            {selectedTools.map((tool) => {
              const hasTitle =
                tool.title.trim() !== "" && tool.title !== tool.type;
              return (
                <Chip
                  key={tool.toolId}
                  label={hasTitle ? tool.title : tool.type}
                  color="primary"
                  variant="outlined"
                  onDelete={() => toggleSelected(tool.toolId)}
                />
              );
            })}
          </Box>
        ) : null}
        {filtered.length === 0 ? (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
            {tools.length === 0
              ? t("maps.toolsNoToolsToAdd")
              : t("maps.toolsNoSearchResults")}
          </Typography>
        ) : (
          <List disablePadding>
            {filtered.map((tool) => {
              const placed = placedByType.get(tool.type);
              const hasTitle =
                tool.title.trim() !== "" && tool.title !== tool.type;
              const selected = selectedIds.includes(tool.toolId);
              return (
                <Box
                  key={tool.toolId}
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSelected(tool.toolId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleSelected(tool.toolId);
                    }
                  }}
                  sx={{
                    mb: 0.75,
                    px: 1.5,
                    py: 1,
                    border: "1px solid",
                    borderColor: selected
                      ? "primary.main"
                      : placed
                        ? "warning.main"
                        : "divider",
                    borderRadius: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    cursor: "pointer",
                    bgcolor: selected ? "action.selected" : "transparent",
                    "&:hover": {
                      bgcolor: selected ? "action.selected" : "action.hover",
                    },
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography noWrap sx={{ fontWeight: 600, minWidth: 0 }}>
                      {hasTitle ? tool.title : tool.type}
                    </Typography>
                    {hasTitle ? (
                      <Typography
                        noWrap
                        variant="caption"
                        color="text.secondary"
                        component="div"
                      >
                        {tool.type}
                      </Typography>
                    ) : null}
                    {placed ? (
                      <Collapse in={openWarnings.has(tool.toolId)} unmountOnExit>
                        <Typography
                          variant="caption"
                          component="div"
                          sx={{
                            mt: 0.5,
                            lineHeight: 1.4,
                            color: "warning.main",
                          }}
                        >
                          {t("maps.toolsTypeAlreadyPlaced", {
                            title: placed.title,
                            placement: t(`maps.toolPlacement.${placed.zone}`),
                          })}
                        </Typography>
                      </Collapse>
                    ) : null}
                  </Box>
                  {placed ? (
                    <IconButton
                      size="small"
                      color="warning"
                      aria-label={t("maps.toolsTypeAlreadyPlacedShort")}
                      aria-expanded={openWarnings.has(tool.toolId)}
                      onMouseDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleWarning(tool.toolId);
                      }}
                      sx={{ flexShrink: 0, p: 1 }}
                    >
                      <WarningAmberIcon sx={{ fontSize: 22 }} />
                    </IconButton>
                  ) : null}
                  <IconButton
                    size="small"
                    color="primary"
                    aria-label={
                      selected ? t("maps.toolsDeselect") : t("common.add")
                    }
                    aria-pressed={selected}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleSelected(tool.toolId);
                    }}
                    sx={{
                      flexShrink: 0,
                      bgcolor: selected ? "primary.main" : "transparent",
                      color: selected ? "primary.contrastText" : "primary.main",
                      "&:hover": {
                        bgcolor: selected ? "primary.dark" : "action.hover",
                      },
                    }}
                  >
                    {selected ? (
                      <CheckIcon fontSize="small" />
                    ) : (
                      <AddIcon fontSize="small" />
                    )}
                  </IconButton>
                </Box>
              );
            })}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button type="button" onClick={onClose}>
          {t("common.dialog.closeBtn")}
        </Button>
        <Button
          type="button"
          variant="contained"
          disabled={selectedIds.length === 0}
          onClick={confirmSelection}
        >
          {t("common.dialog.okBtn")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default MapToolsAddDialog;
