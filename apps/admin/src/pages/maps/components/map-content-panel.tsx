import { useEffect, useState, type RefObject } from "react";
import { Box } from "@mui/material";
import LayersIcon from "@mui/icons-material/Layers";
import TouchAppIcon from "@mui/icons-material/TouchApp";

import { SettingsPageTabs } from "../../../components/settings-page-tabs";
import type { ToolOnMap } from "../../../api/maps";
import type { Tool } from "../../../api/tools";
import type { LayerSwitcherDraft } from "../../groups-development/types";
import GroupLayerTree from "../../groups-development/components/group-layer-tree";
import { findActiveLayerswitcher } from "../../groups-development/utils/active-layerswitcher";
import MapLayersPanel from "./map-layers-panel";
import type { MapLayerActivationRow } from "../map-layer-activation";

const CONTENT_SUB_TABS = [
  {
    key: "layers" as const,
    labelKey: "maps.contentTab.layers",
    icon: <LayersIcon />,
  },
  {
    key: "groupsDevelopment" as const,
    labelKey: "maps.contentTab.placement",
    icon: <TouchAppIcon />,
  },
];

interface MapContentPanelProps {
  mapName?: string;
  layerActivationRows: MapLayerActivationRow[];
  onLayerActivationRowsChange: (rows: MapLayerActivationRow[]) => void;
  mapTools?: ToolOnMap[];
  catalogTools?: Tool[];
  activeToolIds?: Set<number>;
  layerSwitcherDraft?: LayerSwitcherDraft | null;
  onLayerSwitcherDraftChange?: (draft: LayerSwitcherDraft | null) => void;
  /** Bumped when Layers checkboxes are reverted to the last committed state. */
  layerActivationResetKey?: number;
  /** Layers tab rows synced from server — required before map-layers dirty checks. */
  menuSynced?: boolean;
  /** Called when the groups-development sub-tab is active. */
  onGroupsDevelopmentActiveChange?: (active: boolean) => void;
  /** Host element for the map-layers move zone (FormActionPanel sidebar). */
  moveZoneHostRef?: RefObject<HTMLDivElement | null>;
}

export default function MapContentPanel({
  mapName,
  layerActivationRows,
  onLayerActivationRowsChange,
  mapTools,
  catalogTools,
  activeToolIds,
  layerSwitcherDraft = null,
  onLayerSwitcherDraftChange,
  layerActivationResetKey = 0,
  menuSynced = false,
  onGroupsDevelopmentActiveChange,
  moveZoneHostRef,
}: MapContentPanelProps) {
  const [contentSubTab, setContentSubTab] = useState<
    "layers" | "groupsDevelopment"
  >("layers");
  const [moveZoneHostEl, setMoveZoneHostEl] = useState<HTMLElement | null>(
    null,
  );

  const isGroupsDevelopment = contentSubTab === "groupsDevelopment";
  const hasActiveLayerswitcher =
    findActiveLayerswitcher(mapTools, activeToolIds, catalogTools) != null;
  const showMapLayersEditor = isGroupsDevelopment && hasActiveLayerswitcher;

  useEffect(() => {
    onGroupsDevelopmentActiveChange?.(showMapLayersEditor);
    return () => {
      onGroupsDevelopmentActiveChange?.(false);
    };
  }, [showMapLayersEditor, onGroupsDevelopmentActiveChange]);

  useEffect(() => {
    if (!showMapLayersEditor || !moveZoneHostRef) {
      setMoveZoneHostEl(null);
      return;
    }

    const syncHost = () => {
      setMoveZoneHostEl(moveZoneHostRef.current);
    };

    syncHost();
    const frame = window.requestAnimationFrame(syncHost);
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [showMapLayersEditor, moveZoneHostRef]);

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

      {/* Keep mounted (hidden) so move-zone / map-layers draft state survives sub-tab switches. */}
      <Box sx={{ display: isGroupsDevelopment ? "block" : "none" }}>
        <GroupLayerTree
          mapName={mapName}
          mapTools={mapTools}
          catalogTools={catalogTools}
          activeToolIds={activeToolIds}
          layerActivationRows={layerActivationRows}
          pendingDraft={layerSwitcherDraft}
          onLayerSwitcherDraftChange={onLayerSwitcherDraftChange}
          layerActivationResetKey={layerActivationResetKey}
          menuSynced={menuSynced}
          moveZoneHostEl={showMapLayersEditor ? moveZoneHostEl : null}
        />
      </Box>
    </Box>
  );
}
