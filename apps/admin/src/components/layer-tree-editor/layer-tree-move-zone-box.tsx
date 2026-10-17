import AdsClickIcon from "@mui/icons-material/AdsClick";
import CloseIcon from "@mui/icons-material/Close";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import FolderIcon from "@mui/icons-material/Folder";
import LayersIcon from "@mui/icons-material/Layers";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import { useDrag, useDrop } from "react-dnd";
import { useTranslation } from "react-i18next";

import { CATALOG_DRAG_TYPE } from "./lists/types";
import { LAYER_TREE_CATALOG_DRAG_TYPE } from "./layer-tree-model";
import {
  MOVE_ZONE_DRAG_TYPE,
  TREE_ITEM_TYPE,
  type LayerTreeMoveZoneItem,
} from "./layer-tree-move-zone";
import type { LayerTreeMapTab } from "./layer-tree-preview-frame";

const ACCEPTS = [
  TREE_ITEM_TYPE,
  LAYER_TREE_CATALOG_DRAG_TYPE,
  CATALOG_DRAG_TYPE,
];

const EMPTY_TEXT: Record<LayerTreeMapTab, string> = {
  layers: "layerTree.moveZone.emptyLayers",
  background: "layerTree.moveZone.emptyBackground",
  drawOrder: "layerTree.moveZone.emptyDrawOrder",
};

interface LayerTreeMoveZoneBoxProps {
  tab: LayerTreeMapTab;
  items: LayerTreeMoveZoneItem[];
  canAccept: (item: unknown, type: string | symbol | null) => boolean;
  onAccept: (item: unknown, type: string | symbol | null) => void;
  onRemove: (key: string) => void;
  /** Click and place, on the Kartlager tab. */
  clickPlace?: {
    on: boolean;
    onToggle: () => void;
    pickedKeys: ReadonlySet<string>;
    onPick: (key: string, additive: boolean) => void;
    /** Something is held from elsewhere: a click on the zone puts it here. */
    onHoldHere?: () => void;
  };
}

function MoveZoneRow({
  item,
  onRemove,
  onPick,
  picked,
}: {
  item: LayerTreeMoveZoneItem;
  onRemove: () => void;
  /** Click and place: a click picks the item instead of dragging it. */
  onPick?: (additive: boolean) => void;
  picked: boolean;
}) {
  const { t } = useTranslation();
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: MOVE_ZONE_DRAG_TYPE,
      item,
      canDrag: !onPick,
      collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    }),
    [item, onPick],
  );
  const placed = item.nodeId !== undefined || item.inList === true;

  return (
    <Box
      ref={(node) => {
        dragRef(node as HTMLDivElement | null);
      }}
      onClick={
        onPick
          ? (event) => {
              event.stopPropagation();
              if ((event.target as HTMLElement).closest("button")) return;
              onPick(event.ctrlKey || event.metaKey);
            }
          : undefined
      }
      aria-selected={onPick ? picked : undefined}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        px: 0.75,
        py: 0.5,
        border: 1,
        borderColor: picked ? "primary.main" : "warning.light",
        borderRadius: 1.5,
        bgcolor: picked ? "action.selected" : "action.hover",
        outline: picked ? 2 : 0,
        outlineColor: "primary.main",
        opacity: isDragging ? 0.4 : 1,
        cursor: onPick ? "pointer" : "grab",
        minWidth: 0,
      }}
    >
      <DragIndicatorIcon fontSize="small" sx={{ color: "text.secondary" }} />
      {item.kind === "group" ? (
        <FolderIcon fontSize="small" color="primary" />
      ) : (
        <LayersIcon fontSize="small" color="action" />
      )}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Tooltip title={item.name} enterDelay={400}>
          <Typography
            variant="caption"
            component="div"
            noWrap
            sx={{ fontWeight: 600 }}
          >
            {item.name}
          </Typography>
        </Tooltip>
        {placed ? null : (
          <Typography variant="caption" component="div" color="text.secondary">
            {t("layerTree.moveZone.notPlaced")}
          </Typography>
        )}
      </Box>
      <Tooltip title={t("layerTree.moveZone.remove")}>
        <IconButton
          size="small"
          aria-label={t("layerTree.moveZone.remove")}
          onMouseDown={(event) => event.stopPropagation()}
          onClick={onRemove}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

/**
 * Lagerordning's move zone, beside the page's save button. What is dropped
 * here stays where it lies, flagged, until it is dragged from here to its
 * new place.
 */
export default function LayerTreeMoveZoneBox({
  tab,
  items,
  canAccept,
  onAccept,
  onRemove,
  clickPlace,
}: LayerTreeMoveZoneBoxProps) {
  const { t } = useTranslation();
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      accept: ACCEPTS,
      canDrop: (item: unknown, monitor) =>
        canAccept(item, monitor.getItemType()),
      drop: (item: unknown, monitor) => {
        if (monitor.didDrop()) return undefined;
        onAccept(item, monitor.getItemType());
        return { movedToMoveZone: true };
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
        canDrop: monitor.canDrop(),
      }),
    }),
    [canAccept, onAccept],
  );
  const holdHere = clickPlace?.on ? clickPlace.onHoldHere : undefined;
  const highlight = (isOver && canDrop) || holdHere !== undefined;
  const modeLabel = t(
    clickPlace?.on
      ? "layerTree.clickPlace.useDrag"
      : "layerTree.clickPlace.useClick",
  );

  return (
    <Box
      ref={(node) => {
        dropRef(node as HTMLDivElement | null);
      }}
      onClick={holdHere}
      aria-label={t("layerTree.moveZone.title")}
      // Part of the editor, for its Ctrl+Z (see useDraftHistory).
      data-layer-tree-editor=""
      sx={{
        cursor: holdHere ? "pointer" : undefined,
        width: "100%",
        minHeight: 160,
        maxHeight: 380,
        display: "flex",
        flexDirection: "column",
        gap: 0.75,
        p: 1,
        border: 2,
        borderStyle: "dashed",
        borderColor: highlight ? "primary.main" : "divider",
        borderRadius: 2,
        bgcolor: highlight ? "action.selected" : "background.default",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0.5,
          minHeight: 32,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {t("layerTree.moveZone.title")}
        </Typography>
        {clickPlace ? (
          <Tooltip title={modeLabel}>
            <IconButton
              size="small"
              aria-label={t("layerTree.clickPlace.mode")}
              aria-pressed={clickPlace.on}
              onMouseDown={(event) => event.stopPropagation()}
              onClick={(event) => {
                event.stopPropagation();
                clickPlace.onToggle();
              }}
            >
              {/* Shows what a click switches to. */}
              {clickPlace.on ? (
                <DragIndicatorIcon fontSize="small" />
              ) : (
                <AdsClickIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        ) : null}
      </Box>
      {items.length === 0 ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ textAlign: "center", px: 0.5, my: "auto" }}
        >
          {t(EMPTY_TEXT[tab])}
        </Typography>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 0.75,
            overflowY: "auto",
            overscrollBehavior: "contain",
            minHeight: 0,
          }}
        >
          {items.map((item) => (
            <MoveZoneRow
              key={item.key}
              item={item}
              onRemove={() => onRemove(item.key)}
              onPick={
                clickPlace?.on
                  ? (additive) => clickPlace.onPick(item.key, additive)
                  : undefined
              }
              picked={clickPlace?.pickedKeys.has(item.key) ?? false}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
