import { useMemo, useState } from "react";
import {
  Box,
  Button,
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
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import { useTranslation } from "react-i18next";
import type { ToolZone } from "../../../api/maps";
import type { AddableTool } from "../map-tools-board-model";

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
  onSelect: (toolId: number) => void;
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
  const [openWarnings, setOpenWarnings] = useState<Set<number>>(
    () => new Set(),
  );

  const toggleWarning = (toolId: number) => {
    setOpenWarnings((current) => {
      const next = new Set(current);
      if (next.has(toolId)) next.delete(toolId);
      else next.add(toolId);
      return next;
    });
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
            if (event.key === "Enter" && filtered.length === 1) {
              event.preventDefault();
              onSelect(filtered[0].toolId);
            }
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
              const hasTitle = tool.title.trim() !== "" && tool.title !== tool.type;
              return (
                <Box
                  key={tool.toolId}
                  sx={{
                    mb: 0.75,
                    px: 1.5,
                    py: 1,
                    border: "1px solid",
                    borderColor: placed ? "warning.main" : "divider",
                    borderRadius: 1.5,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
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
                          sx={{ mt: 0.5, lineHeight: 1.4, color: "warning.main" }}
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
                    aria-label={t("common.add")}
                    onClick={() => onSelect(tool.toolId)}
                    sx={{ flexShrink: 0 }}
                  >
                    <AddIcon fontSize="small" />
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
      </DialogActions>
    </Dialog>
  );
}

export default MapToolsAddDialog;
