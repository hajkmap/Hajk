import { useEffect, useState, type RefObject } from "react";
import { Box } from "@mui/material";
import LayersIcon from "@mui/icons-material/Layers";
import TouchAppIcon from "@mui/icons-material/TouchApp";

import { SettingsPageTabs } from "../../../components/settings-page-tabs";
import type { ToolOnMap } from "../../../api/maps";
import type { Tool } from "../../../api/tools";
import type { KartlagerDraft } from "../../groups-development/types";
import GroupLayerTree from "../../groups-development/components/group-layer-tree";
import { findActiveLayerswitcher } from "../../groups-development/utils/active-layerswitcher";
import MapLayersPanel, {
  type MapLayerActivationRow,
} from "./map-layers-panel";

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
  /** DB Kartlager + Bakgrund state (catalog layer ids). */
  layerSwitcherState?: KartlagerDraft | null;
  kartlagerDraft?: KartlagerDraft | null;
  onKartlagerDraftChange?: (draft: KartlagerDraft | null) => void;
  /** Bumped when Lager checkboxes are reverted to the last committed state. */
  layerActivationResetKey?: number;
  /** Lager tab rows synced from server — required before Lagerordning dirty checks. */
  menuSynced?: boolean;
  /** Called when the Grupper (under utveckling) sub-tab is active. */
  onGroupsDevelopmentActiveChange?: (active: boolean) => void;
  /** Host element for Kartlager Flyttzon (FormActionPanel sidebar). */
  moveZoneHostRef?: RefObject<HTMLDivElement | null>;
}

export default function MapContentPanel({
  mapName,
  layerActivationRows,
  onLayerActivationRowsChange,
  mapTools,
  catalogTools,
  activeToolIds,
  layerSwitcherState,
  kartlagerDraft = null,
  onKartlagerDraftChange,
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
  const showKartlagerEditor = isGroupsDevelopment && hasActiveLayerswitcher;

  useEffect(() => {
    onGroupsDevelopmentActiveChange?.(showKartlagerEditor);
    return () => {
      onGroupsDevelopmentActiveChange?.(false);
    };
  }, [showKartlagerEditor, onGroupsDevelopmentActiveChange]);

  useEffect(() => {
    if (!showKartlagerEditor || !moveZoneHostRef) {
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
  }, [showKartlagerEditor, moveZoneHostRef]);

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

      {/* Keep mounted (hidden) so Flyttzon / Kartlager draft state survives sub-tab switches. */}
      <Box sx={{ display: isGroupsDevelopment ? "block" : "none" }}>
        <GroupLayerTree
          mapName={mapName}
          mapTools={mapTools}
          catalogTools={catalogTools}
          activeToolIds={activeToolIds}
          layerSwitcherState={layerSwitcherState}
          layerActivationRows={layerActivationRows}
          pendingDraft={kartlagerDraft}
          onKartlagerDraftChange={onKartlagerDraftChange}
          layerActivationResetKey={layerActivationResetKey}
          menuSynced={menuSynced}
          moveZoneHostEl={showKartlagerEditor ? moveZoneHostEl : null}
        />
      </Box>
    </Box>
  );
}
