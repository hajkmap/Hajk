import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { Box } from "@mui/material";

import LayerTreeEditor, {
  previewOptionsFor,
  type LayerTreeDraft,
} from "../../../components/layer-tree-editor";
import type { ToolOnMap } from "../../../api/maps";
import type { Tool } from "../../../api/tools";

// The map's layer tree (MapTreeItem and the map's exceptions and settings),
// its background and its draw order, apart from the layerswitcher tool.

interface MapContentPanelProps {
  mapName?: string;
  /** The map's tools, to show the tree as its active layerswitcher. */
  mapTools?: ToolOnMap[];
  catalogTools?: Tool[];
  /** The tools turned on in the tools tab, saved or not. */
  activeToolIds?: Set<number>;
  /** Called when the tree opens or closes. */
  onLayerTreeOpenChange?: (open: boolean) => void;
  /** Host element for the map-layers move zone (FormActionPanel sidebar). */
  moveZoneHostRef?: RefObject<HTMLDivElement | null>;
  /** Unsaved edits of the map's layer tree. */
  layerTreeDraft?: LayerTreeDraft | null;
  onLayerTreeDraftChange?: (draft: LayerTreeDraft | null) => void;
  /** A warning about the tree, under the text of its heading. */
  notice?: ReactNode;
}

export default function MapContentPanel({
  mapName,
  mapTools,
  catalogTools,
  activeToolIds,
  onLayerTreeOpenChange,
  moveZoneHostRef,
  layerTreeDraft = null,
  onLayerTreeDraftChange,
  notice,
}: MapContentPanelProps) {
  const preview = useMemo(
    () => previewOptionsFor(mapTools, activeToolIds, catalogTools),
    [mapTools, activeToolIds, catalogTools],
  );

  // While the tree is open the page shows a place for the move zone by its
  // save button; it is there once the page has drawn it.
  const [moveZoneHost, setMoveZoneHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    onLayerTreeOpenChange?.(true);
    return () => onLayerTreeOpenChange?.(false);
  }, [onLayerTreeOpenChange]);
  useEffect(() => {
    if (!moveZoneHostRef) return;
    let frame = 0;
    let tries = 0;
    const find = () => {
      const host = moveZoneHostRef.current;
      if (host) setMoveZoneHost(host);
      else if (tries++ < 30) frame = window.requestAnimationFrame(find);
    };
    frame = window.requestAnimationFrame(find);
    return () => window.cancelAnimationFrame(frame);
  }, [moveZoneHostRef]);

  if (!mapName || !onLayerTreeDraftChange) return null;
  return (
    <Box sx={{ mt: 2 }}>
      <LayerTreeEditor
        mode="map"
        ownerId={mapName}
        draft={layerTreeDraft}
        onDraftChange={onLayerTreeDraftChange}
        preview={preview}
        moveZoneHost={moveZoneHost?.isConnected ? moveZoneHost : null}
        notice={notice}
      />
    </Box>
  );
}
