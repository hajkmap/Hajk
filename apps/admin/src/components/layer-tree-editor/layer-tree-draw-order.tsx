import { Paper } from "@mui/material";
import { useMemo } from "react";

import DrawOrderPanel from "../../pages/groups-development/components/draw-order-panel";

interface LayerTreeDrawOrderProps {
  /** The layers the map shows, each once. */
  layers: { id: string; name: string }[];
  /** Layer ids, top first; may lack new layers and hold removed ones. */
  order: string[];
  onChange: (order: string[]) => void;
}

/**
 * POC (layer trees): the map's draw order, set apart from its tree, with the
 * same panel as in Lagerordning. Layers not in the order yet go on top.
 */
export default function LayerTreeDrawOrder({
  layers,
  order,
  onChange,
}: LayerTreeDrawOrderProps) {
  const orderedIds = useMemo(() => {
    const shown = new Set(layers.map((layer) => layer.id));
    const known = order.filter((id) => shown.has(id));
    const placed = new Set(known);
    return [
      ...layers.map((layer) => layer.id).filter((id) => !placed.has(id)),
      ...known,
    ];
  }, [layers, order]);

  return (
    <Paper
      variant="outlined"
      sx={{ display: "flex", flexDirection: "column", minHeight: 320 }}
    >
      <DrawOrderPanel
        layers={layers}
        orderedIds={orderedIds}
        onOrderedIdsChange={onChange}
      />
    </Paper>
  );
}
