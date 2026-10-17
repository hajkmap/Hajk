import AddIcon from "@mui/icons-material/Add";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import FolderIcon from "@mui/icons-material/Folder";
import LayersIcon from "@mui/icons-material/Layers";
import {
  Box,
  IconButton,
  List,
  ListItem,
  Paper,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useMemo, useState, type KeyboardEvent } from "react";
import { useDrag } from "react-dnd";
import { useTranslation } from "react-i18next";

import { GroupType, useGroups } from "../../api/groups";
import { useLayers } from "../../api/layers";
import LayerTreeItemTooltip from "./layer-tree-item-tooltip";
import {
  LAYER_TREE_CATALOG_DRAG_TYPE,
  type LayerTreeCatalogItem,
  type LayerTreeItemKind,
} from "./layer-tree-model";
import { useItemDetails, type LayerTreeItemDetails } from "./use-item-details";

interface CatalogRowProps {
  item: LayerTreeCatalogItem;
  details: LayerTreeItemDetails;
  /** Another item has the same name, so say where this one belongs. */
  showContext: boolean;
  /** Already where "+" would put it. */
  placed: boolean;
  /** Hides "+" for items that must be dragged to a place. */
  addable: boolean;
  dragType: string;
  disabled: boolean;
  onAdd: (item: LayerTreeCatalogItem) => void;
  /** Click and place: a click picks the item instead of dragging it. */
  onPick?: (item: LayerTreeCatalogItem, additive: boolean) => void;
  picked: boolean;
}

function CatalogRow({
  item,
  details,
  showContext,
  placed,
  addable,
  dragType,
  disabled,
  onAdd,
  onPick,
  picked,
}: CatalogRowProps) {
  const { t } = useTranslation();
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: dragType,
      item,
      canDrag: !disabled && !onPick,
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [item, disabled, dragType, onPick],
  );

  return (
    <ListItem disablePadding sx={{ mb: 0.5 }}>
      <Paper
        variant="outlined"
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 0.75,
          pl: 0.5,
          opacity: isDragging ? 0.5 : 1,
          bgcolor: picked ? "action.selected" : undefined,
          borderColor: picked ? "primary.main" : undefined,
        }}
      >
        <Box
          ref={(element) => {
            drag(element as HTMLDivElement | null);
          }}
          onClick={
            onPick && !disabled
              ? (event) => onPick(item, event.ctrlKey || event.metaKey)
              : undefined
          }
          aria-pressed={onPick ? picked : undefined}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            flex: 1,
            minWidth: 0,
            py: 0.75,
            cursor: disabled ? "default" : onPick ? "pointer" : "grab",
          }}
        >
          <DragIndicatorIcon
            fontSize="small"
            sx={{
              color: "action.active",
              // Click and place: picked by a click, not dragged.
              visibility: onPick ? "hidden" : "visible",
            }}
          />
          {item.kind === "group" ? (
            <FolderIcon fontSize="small" color="primary" />
          ) : (
            <LayersIcon fontSize="small" color="action" />
          )}
          <LayerTreeItemTooltip name={item.name} details={details}>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="body2"
                sx={{
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  wordBreak: "break-word",
                }}
              >
                {item.name}
              </Typography>
              {showContext ? (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  component="div"
                >
                  {details.context}
                </Typography>
              ) : null}
            </Box>
          </LayerTreeItemTooltip>
        </Box>
        {addable ? (
          <Tooltip title={t("layerTree.addToTree")}>
            <span>
              <IconButton
                size="small"
                aria-label={t("layerTree.addToTree")}
                disabled={disabled || placed}
                onClick={() => onAdd(item)}
              >
                <AddIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        ) : null}
      </Paper>
    </ListItem>
  );
}

interface LayerTreeCatalogProps {
  /** The group being edited; left out of the list. */
  excludeGroupId?: string;
  /** "kind:id" of what "+" has already put in place. */
  placedKeys: Set<string>;
  /** What to offer: both groups and layers, or one of them. */
  offer?: "all" | LayerTreeItemKind;
  /** Drag type, so other drop targets (e.g. Lagerordning panels) take rows. */
  dragType?: string;
  /** Whether "+" can place an item, or it must be dragged. */
  canAdd?: (item: LayerTreeCatalogItem) => boolean;
  disabled: boolean;
  onAdd: (item: LayerTreeCatalogItem) => void;
  /** Click and place: clicks pick items; "kind:id" of those held. */
  pick?: {
    picked: ReadonlySet<string>;
    onPick: (item: LayerTreeCatalogItem, additive: boolean) => void;
  };
}

// Enter in a text field would otherwise submit a surrounding form.
const preventSubmit = (event: KeyboardEvent) => {
  if (event.key === "Enter") event.preventDefault();
};

export default function LayerTreeCatalog({
  excludeGroupId,
  placedKeys,
  offer = "all",
  dragType = LAYER_TREE_CATALOG_DRAG_TYPE,
  canAdd = () => true,
  disabled,
  onAdd,
  pick,
}: LayerTreeCatalogProps) {
  const { t } = useTranslation();
  const { data: groups } = useGroups();
  const { data: layers } = useLayers();
  const getDetails = useItemDetails();
  const [chosenTab, setTab] = useState<"groups" | "layers">("groups");
  const tab =
    offer === "group" ? "groups" : offer === "layer" ? "layers" : chosenTab;
  const [search, setSearch] = useState("");

  const { items, sharedNames } = useMemo(() => {
    const term = search.trim().toLowerCase();
    const all: LayerTreeCatalogItem[] =
      tab === "groups"
        ? (groups ?? [])
            .filter(
              (group) =>
                group.type === GroupType.LAYER && group.id !== excludeGroupId,
            )
            .map((group) => ({ kind: "group", id: group.id, name: group.name }))
        : (layers ?? [])
            .filter((layer) => (layer.layerKind ?? "display") === "display")
            .map((layer) => ({
              kind: "layer",
              id: layer.id,
              name: layer.name,
            }));
    const seen = new Set<string>();
    const shared = new Set<string>();
    for (const item of all) {
      const name = item.name.toLowerCase();
      if (seen.has(name)) shared.add(name);
      seen.add(name);
    }
    return {
      items: all
        .filter((item) => item.name.toLowerCase().includes(term))
        .sort((a, b) => a.name.localeCompare(b.name, "sv")),
      sharedNames: shared,
    };
  }, [tab, search, groups, layers, excludeGroupId]);

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        display: "flex",
        flexDirection: "column",
        // Fills its column beside the tree (see LayerTreeCatalogColumn).
        height: { lg: "100%" },
        boxSizing: "border-box",
      }}
    >
      {offer !== "all" ? (
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          {t(
            offer === "group"
              ? "layerTree.catalogGroups"
              : "layerTree.catalogLayers",
          )}
        </Typography>
      ) : (
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value as "groups" | "layers")}
          variant="fullWidth"
          sx={{ mb: 1 }}
        >
          <Tab value="groups" label={t("layerTree.catalogGroups")} />
          <Tab value="layers" label={t("layerTree.catalogLayers")} />
        </Tabs>
      )}
      <TextField
        size="small"
        fullWidth
        placeholder={t("layerTree.search")}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={preventSubmit}
        sx={{ mb: 1 }}
      />
      <List
        dense
        disablePadding
        sx={{
          flex: { lg: 1 },
          minHeight: 0,
          maxHeight: { xs: 460, lg: "none" },
          overflowY: "auto",
          overscrollBehavior: "contain",
        }}
      >
        {items.map((item) => (
          <CatalogRow
            key={`${item.kind}:${item.id}`}
            item={item}
            details={getDetails(item.kind, item.id)}
            showContext={sharedNames.has(item.name.toLowerCase())}
            placed={placedKeys.has(`${item.kind}:${item.id}`)}
            addable={canAdd(item)}
            dragType={dragType}
            disabled={disabled}
            onAdd={onAdd}
            onPick={pick?.onPick}
            picked={pick?.picked.has(`${item.kind}:${item.id}`) ?? false}
          />
        ))}
      </List>
      {items.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
          {t("layerTree.noMatches")}
        </Typography>
      ) : null}
    </Paper>
  );
}
