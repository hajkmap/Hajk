import { Paper } from "@mui/material";
import { useMemo } from "react";

import DrawOrderPanel from "../../pages/groups-development/components/draw-order-panel";
import { completeDrawOrder } from "./layer-tree-model";

/** What a move zone item is to the panel: its key and what it is. */
interface MoveZoneDropItem {
  key: string;
  kind: string;
  sourceId: string;
}

interface LayerTreeDrawOrderProps {
  /** The layers the map shows, each once. */
  layers: { id: string; name: string }[];
  /** Layer ids, top first; may lack new layers and hold removed ones. */
  order: string[];
  onChange: (order: string[]) => void;
  /** The move zone, whose layers can be dropped back in the list. */
  moveZone?: {
    canAcceptMoveZoneItem: (item: MoveZoneDropItem) => boolean;
    onMoveZoneDrop: (item: MoveZoneDropItem, insertIndex?: number) => void;
    flaggedIds: ReadonlySet<string>;
  };
}

/**
 * The map's draw order, set apart from its tree, with the same panel as in
 * Lagerordning. Layers not in the order yet go on top.
 */
export default function LayerTreeDrawOrder({
  layers,
  order,
  onChange,
  moveZone,
}: LayerTreeDrawOrderProps) {
  const orderedIds = useMemo(
    () => completeDrawOrder(layers, order),
    [layers, order],
  );

  return (
    <Paper
      variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "column",
        // Fills the editor's window and scrolls inside it, as the tree does.
        flex: { lg: "1 1 0" },
        minHeight: { xs: 320, lg: 0 },
        overflowY: { lg: "auto" },
        overscrollBehavior: "contain",
      }}
    >
      <DrawOrderPanel
        layers={layers}
        orderedIds={orderedIds}
        onOrderedIdsChange={onChange}
        onMoveZoneDrop={moveZone?.onMoveZoneDrop}
        canAcceptMoveZoneItem={moveZone?.canAcceptMoveZoneItem}
        flaggedIds={moveZone?.flaggedIds}
      />
    </Paper>
  );
}
