import { Paper } from "@mui/material";
import { useMemo } from "react";

import type { MapBackgroundLayer } from "../../api/layer-tree";
import BackgroundLayersPanel from "./lists/background-layers-panel";
import {
  DEFAULT_LAYER_DISPLAY_SETTINGS,
  type LayerDisplaySettings,
} from "./lists/types";

/** What a move zone item is to the panel: its key and what it is. */
interface MoveZoneDropItem {
  key: string;
  kind: string;
  sourceId: string;
}

interface LayerTreeBackgroundProps {
  background: MapBackgroundLayer[];
  /** Every display layer, for the names of layers dropped in. */
  layers: { id: string; name: string }[];
  onChange: (background: MapBackgroundLayer[]) => void;
  /** The move zone, whose layers can be dropped in the list. */
  moveZone?: {
    canAcceptMoveZoneItem: (item: MoveZoneDropItem) => boolean;
    onMoveZoneDrop: (item: MoveZoneDropItem, insertIndex?: number) => void;
    flaggedIds: ReadonlySet<string>;
  };
}

/**
 * The map's background layers, with the same panel as in Lagerordning (drop
 * from the catalog, order, visible at start, infobox).
 */
export default function LayerTreeBackground({
  background,
  layers,
  onChange,
  moveZone,
}: LayerTreeBackgroundProps) {
  const names = useMemo(
    () =>
      new Map([
        ...layers.map((layer) => [layer.id, layer.name] as const),
        ...background.map((entry) => [entry.layerId, entry.name] as const),
      ]),
    [layers, background],
  );
  const rows = useMemo(
    () => [...names].map(([id, name]) => ({ id, name })),
    [names],
  );
  const settings = useMemo(
    () =>
      Object.fromEntries(
        background.map((entry): [string, LayerDisplaySettings] => [
          entry.layerId,
          {
            ...DEFAULT_LAYER_DISPLAY_SETTINGS,
            layerVisibleAtStart: entry.visibleAtStart,
            layerInfoBox: entry.infobox,
          },
        ]),
      ),
    [background],
  );

  // The panel fills its parent (as in Lagerordning); without a height its drop
  // area would be only a few pixels high. In the editor's window it scrolls
  // inside, as the tree does.
  return (
    <Paper
      variant="outlined"
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: { lg: "1 1 0" },
        minHeight: { xs: 320, lg: 0 },
        overflowY: { lg: "auto" },
        overscrollBehavior: "contain",
      }}
    >
      <BackgroundLayersPanel
        layers={rows}
        orderedIds={background.map((entry) => entry.layerId)}
        onOrderedIdsChange={(ids) =>
          onChange(
            ids.map(
              (id) =>
                background.find((entry) => entry.layerId === id) ?? {
                  layerId: id,
                  name: names.get(id) ?? id,
                  visibleAtStart: false,
                  infobox: "",
                },
            ),
          )
        }
        layerDisplaySettings={settings}
        onLayerDisplaySettingsChange={(layerId, changed) =>
          onChange(
            background.map((entry) =>
              entry.layerId === layerId
                ? {
                    ...entry,
                    visibleAtStart: changed.layerVisibleAtStart,
                    infobox: changed.layerInfoBox,
                  }
                : entry,
            ),
          )
        }
        onMoveZoneDrop={moveZone?.onMoveZoneDrop}
        canAcceptMoveZoneItem={moveZone?.canAcceptMoveZoneItem}
        flaggedIds={moveZone?.flaggedIds}
      />
    </Paper>
  );
}
