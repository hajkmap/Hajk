import { useEffect, useState, type RefObject } from "react";
import { Box } from "@mui/material";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import SortIcon from "@mui/icons-material/Sort";
import CollectionsIcon from "@mui/icons-material/Collections";
import type { TreeItems } from "dnd-kit-sortable-tree";

import { SettingsPageTabs } from "../../../components/settings-page-tabs";
import { TreeItemData } from "../../../components/layerswitcher-dnd";
import type { ToolOnMap } from "../../../api/maps";
import type { KartlagerDraft } from "../../groups-development/types";
import GroupLayerTree from "../../groups-development/components/group-layer-tree";
import MapGroupPlacementPanel from "./map-group-placement-panel";
import MapDrawOrderPanel from "./map-draw-order-panel";

const CONTENT_SUB_TABS = [
  {
    key: "placement" as const,
    labelKey: "maps.contentTab.placement",
    icon: <TouchAppIcon />,
  },
  {
    key: "drawOrder" as const,
    labelKey: "maps.contentTab.drawOrder",
    icon: <SortIcon />,
  },
  {
    key: "groupsDevelopment" as const,
    labelKey: "common.groupsDevelopment",
    icon: <CollectionsIcon />,
  },
];

interface MapCatalogLayer {
  id: string;
  name: string;
}

interface MapCatalogGroup {
  id: string;
  name: string;
  layerCount?: number;
  nestedGroupCount?: number;
}

interface MapContentPanelProps {
  catalogLayers: MapCatalogLayer[];
  catalogGroups: MapCatalogGroup[];
  placementItems: TreeItems<TreeItemData>;
  onPlacementItemsChange: (items: TreeItems<TreeItemData>) => void;
  drawOrderItems: TreeItems<TreeItemData>;
  onDrawOrderItemsChange: (items: TreeItems<TreeItemData>) => void;
  onInsertLayerToDrawOrder: (
    layer: MapCatalogLayer,
    insertIndex: number,
  ) => void;
  onRemoveLayerFromDrawOrder: (layerId: string) => void;
  mapTools?: ToolOnMap[];
  activeToolIds?: Set<number>;
  kartlagerDraft?: KartlagerDraft | null;
  onKartlagerDraftChange?: (draft: KartlagerDraft | null) => void;
  /** Called when the Grupper (under utveckling) sub-tab is active. */
  onGroupsDevelopmentActiveChange?: (active: boolean) => void;
  /** Host element for Kartlager Flyttzon (FormActionPanel sidebar). */
  moveZoneHostRef?: RefObject<HTMLDivElement | null>;
}

export default function MapContentPanel({
  catalogLayers,
  catalogGroups,
  placementItems,
  onPlacementItemsChange,
  drawOrderItems,
  onDrawOrderItemsChange,
  onInsertLayerToDrawOrder,
  onRemoveLayerFromDrawOrder,
  mapTools,
  activeToolIds,
  kartlagerDraft = null,
  onKartlagerDraftChange,
  onGroupsDevelopmentActiveChange,
  moveZoneHostRef,
}: MapContentPanelProps) {
  const [contentSubTab, setContentSubTab] = useState<
    "placement" | "drawOrder" | "groupsDevelopment"
  >("placement");
  const [moveZoneHostEl, setMoveZoneHostEl] = useState<HTMLElement | null>(
    null,
  );

  const isGroupsDevelopment = contentSubTab === "groupsDevelopment";

  useEffect(() => {
    onGroupsDevelopmentActiveChange?.(isGroupsDevelopment);
    return () => {
      onGroupsDevelopmentActiveChange?.(false);
    };
  }, [isGroupsDevelopment, onGroupsDevelopmentActiveChange]);

  useEffect(() => {
    if (!isGroupsDevelopment || !moveZoneHostRef) {
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
  }, [isGroupsDevelopment, moveZoneHostRef]);

  return (
    <Box>
      <SettingsPageTabs
        value={contentSubTab}
        onChange={setContentSubTab}
        variant="section"
        tabs={[...CONTENT_SUB_TABS]}
      />

      {contentSubTab === "placement" ? (
        <MapGroupPlacementPanel
          catalogGroups={catalogGroups}
          items={placementItems}
          onItemsChange={onPlacementItemsChange}
        />
      ) : null}

      {contentSubTab === "drawOrder" ? (
        <MapDrawOrderPanel
          catalogLayers={catalogLayers}
          items={drawOrderItems}
          onItemsChange={onDrawOrderItemsChange}
          onInsertLayer={onInsertLayerToDrawOrder}
          onRemoveLayer={onRemoveLayerFromDrawOrder}
        />
      ) : null}

      {/* Keep mounted (hidden) so Flyttzon / Kartlager draft state survives sub-tab switches. */}
      <Box sx={{ display: isGroupsDevelopment ? "block" : "none" }}>
        <GroupLayerTree
          mapTools={mapTools}
          activeToolIds={activeToolIds}
          pendingDraft={kartlagerDraft}
          onKartlagerDraftChange={onKartlagerDraftChange}
          moveZoneHostEl={isGroupsDevelopment ? moveZoneHostEl : null}
        />
      </Box>
    </Box>
  );
}
