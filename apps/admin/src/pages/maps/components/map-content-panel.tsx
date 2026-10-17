import { useEffect, useMemo, useState, type RefObject } from "react";
import { Box } from "@mui/material";
import LayersIcon from "@mui/icons-material/Layers";
import TouchAppIcon from "@mui/icons-material/TouchApp";

import { SettingsPageTabs } from "../../../components/settings-page-tabs";
import LayerTreeEditor, {
  previewOptionsFor,
  type LayerTreeDraft,
} from "../../../components/layer-tree-editor";
import type { ToolOnMap } from "../../../api/maps";
import type { Tool } from "../../../api/tools";
import type { LayerSwitcherDraft } from "../../groups-development/types";
import MapLayersPanel from "./map-layers-panel";
import type { MapLayerActivationRow } from "../map-layer-activation";

// Lagerordning is the map's layer tree (MapTreeItem and the map's exceptions
// and settings), apart from the layerswitcher tool. The old editor in
// groups-development is no longer shown.
const CONTENT_SUB_TABS = [
  {
    key: "layers" as const,
    labelKey: "maps.contentTab.layers",
    icon: <LayersIcon />,
  },
  {
    key: "layerTree" as const,
    labelKey: "maps.contentTab.placement",
    icon: <TouchAppIcon />,
  },
];

interface MapContentPanelProps {
  mapName?: string;
  layerActivationRows: MapLayerActivationRow[];
  onLayerActivationRowsChange: (rows: MapLayerActivationRow[]) => void;
  /** The map's tools, to show Lagerordning as its active layerswitcher. */
  mapTools?: ToolOnMap[];
  catalogTools?: Tool[];
  /** The tools turned on in the tools tab, saved or not. */
  activeToolIds?: Set<number>;
  /** @deprecated Used by the old Lagerordning editor, no longer shown. */
  layerSwitcherDraft?: LayerSwitcherDraft | null;
  /** @deprecated Used by the old Lagerordning editor, no longer shown. */
  onLayerSwitcherDraftChange?: (draft: LayerSwitcherDraft | null) => void;
  /** @deprecated Used by the old Lagerordning editor, no longer shown. */
  layerActivationResetKey?: number;
  /** @deprecated Used by the old Lagerordning editor, no longer shown. */
  menuSynced?: boolean;
  /** Called when the Lagerordning sub-tab is active. */
  onGroupsDevelopmentActiveChange?: (active: boolean) => void;
  /** Host element for the map-layers move zone (FormActionPanel sidebar). */
  moveZoneHostRef?: RefObject<HTMLDivElement | null>;
  /** Unsaved edits of the map's layer tree. */
  layerTreeDraft?: LayerTreeDraft | null;
  onLayerTreeDraftChange?: (draft: LayerTreeDraft | null) => void;
}

export default function MapContentPanel({
  mapName,
  layerActivationRows,
  onLayerActivationRowsChange,
  mapTools,
  catalogTools,
  activeToolIds,
  onGroupsDevelopmentActiveChange,
  moveZoneHostRef,
  layerTreeDraft = null,
  onLayerTreeDraftChange,
}: MapContentPanelProps) {
  const [contentSubTab, setContentSubTab] = useState<"layers" | "layerTree">(
    "layers",
  );
  const preview = useMemo(
    () => previewOptionsFor(mapTools, activeToolIds, catalogTools),
    [mapTools, activeToolIds, catalogTools],
  );

  // With Lagerordning open the page shows a place for the move zone by its
  // save button; it is there once the page has drawn it.
  const treeOpen = contentSubTab === "layerTree";
  const [moveZoneHost, setMoveZoneHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    onGroupsDevelopmentActiveChange?.(treeOpen);
    return () => onGroupsDevelopmentActiveChange?.(false);
  }, [treeOpen, onGroupsDevelopmentActiveChange]);
  useEffect(() => {
    if (!treeOpen || !moveZoneHostRef) return;
    let frame = 0;
    let tries = 0;
    const find = () => {
      const host = moveZoneHostRef.current;
      if (host) setMoveZoneHost(host);
      else if (tries++ < 30) frame = window.requestAnimationFrame(find);
    };
    frame = window.requestAnimationFrame(find);
    return () => window.cancelAnimationFrame(frame);
  }, [treeOpen, moveZoneHostRef]);

  return (
    <Box>
      <SettingsPageTabs
        value={contentSubTab}
        onChange={setContentSubTab}
        variant="section"
        tabs={[...CONTENT_SUB_TABS]}
      />

      {contentSubTab === "layers" ? (
        <MapLayersPanel
          rows={layerActivationRows}
          onRowsChange={onLayerActivationRowsChange}
        />
      ) : null}

      {contentSubTab === "layerTree" && mapName && onLayerTreeDraftChange ? (
        <Box sx={{ mt: 2 }}>
          <LayerTreeEditor
            mode="map"
            ownerId={mapName}
            draft={layerTreeDraft}
            onDraftChange={onLayerTreeDraftChange}
            preview={preview}
            moveZoneHost={treeOpen && moveZoneHost?.isConnected ? moveZoneHost : null}
          />
        </Box>
      ) : null}
    </Box>
  );
}
