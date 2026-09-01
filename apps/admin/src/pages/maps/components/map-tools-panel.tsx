import { useState, type MutableRefObject } from "react";
import { Box, CircularProgress } from "@mui/material";
import ViewListIcon from "@mui/icons-material/ViewList";
import TouchAppIcon from "@mui/icons-material/TouchApp";
import { useTranslation } from "react-i18next";
import type { TreeItems } from "dnd-kit-sortable-tree";
import type { ToolOnMap, ToolWindowPosition, ToolZone } from "../../../api/maps";
import type { Tool } from "../../../api/tools";
import { useTools } from "../../../api/tools";
import {
  ToolPlacementDnD,
  TreeItemData,
} from "../../../components/layerswitcher-dnd";
import { SettingsPageTabs } from "../../../components/settings-page-tabs";
import type { ToolZones, ToolWindowSize } from "../map-tools-utils";
import { catalogToolsToSourceItems } from "../map-tools-utils";
import MapToolsList from "./map-tools-list";

const TOOLS_SUB_TABS = [
  {
    key: "list" as const,
    labelKey: "maps.toolsTab.list",
    icon: <ViewListIcon />,
  },
  {
    key: "placement" as const,
    labelKey: "maps.toolsTab.placement",
    icon: <TouchAppIcon />,
  },
];

interface MapToolsPanelProps {
  mapTools: ToolOnMap[] | undefined;
  catalogTools?: Tool[] | undefined;
  toolZones: ToolZones;
  activeToolIds: Set<number>;
  windowPositions: Record<number, ToolWindowPosition>;
  windowSizes: Record<number, ToolWindowSize>;
  indexes: Record<number, number>;
  onUpdateToolZone: (
    zone: keyof ToolZones,
    items: TreeItems<TreeItemData>,
  ) => void;
  onToggleToolActive: (toolId: number, active: boolean) => void;
  onToolTargetChange: (toolId: number, target: ToolZone | null) => void;
  onToolWindowPositionChange: (
    toolId: number,
    position: ToolWindowPosition,
  ) => void;
  onToolWindowSizeChange: (
    toolId: number,
    size: Partial<ToolWindowSize>,
  ) => void;
  onToolIndexChange: (toolId: number, index: number) => void;
  flushPendingEditsRef?: MutableRefObject<(() => void) | null>;
  onPendingWindowSizeDirtyChange?: (pending: boolean) => void;
  backgroundImage?: string;
}

export default function MapToolsPanel({
  mapTools,
  catalogTools: catalogToolsProp,
  toolZones,
  activeToolIds,
  windowPositions,
  windowSizes,
  indexes,
  onUpdateToolZone,
  onToggleToolActive,
  onToolTargetChange,
  onToolWindowPositionChange,
  onToolWindowSizeChange,
  onToolIndexChange,
  flushPendingEditsRef,
  onPendingWindowSizeDirtyChange,
  backgroundImage,
}: MapToolsPanelProps) {
  const { t } = useTranslation();
  const [toolsSubTab, setToolsSubTab] = useState<"list" | "placement">("list");
  const { data: catalogToolsQuery } = useTools();
  const catalogTools = catalogToolsProp ?? catalogToolsQuery;

  if (mapTools === undefined || catalogTools === undefined) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  const sourceTools = catalogToolsToSourceItems(catalogTools, toolZones);

  return (
    <Box>
      <SettingsPageTabs
        value={toolsSubTab}
        onChange={setToolsSubTab}
        variant="section"
        tabs={[...TOOLS_SUB_TABS]}
      />

      {toolsSubTab === "list" ? (
        <MapToolsList
          catalogTools={catalogTools}
          mapTools={mapTools}
          toolZones={toolZones}
          activeToolIds={activeToolIds}
          windowPositions={windowPositions}
          windowSizes={windowSizes}
          indexes={indexes}
          onToggleActive={onToggleToolActive}
          onTargetChange={onToolTargetChange}
          onWindowPositionChange={onToolWindowPositionChange}
          onWindowSizeChange={onToolWindowSizeChange}
          onIndexChange={onToolIndexChange}
          flushPendingEditsRef={flushPendingEditsRef}
          onPendingWindowSizeDirtyChange={onPendingWindowSizeDirtyChange}
        />
      ) : (
        <ToolPlacementDnD
          tools={sourceTools}
          activeToolIds={activeToolIds}
          sourceTitle={t("maps.toolsUnplacedSource")}
          drawerItems={toolZones.drawer}
          onDrawerItemsChange={(items) => onUpdateToolZone("drawer", items)}
          widgetLeftItems={toolZones.widgetLeft}
          onWidgetLeftItemsChange={(items) =>
            onUpdateToolZone("widgetLeft", items)
          }
          widgetRightItems={toolZones.widgetRight}
          onWidgetRightItemsChange={(items) =>
            onUpdateToolZone("widgetRight", items)
          }
          controlButtonItems={toolZones.control}
          onControlButtonItemsChange={(items) =>
            onUpdateToolZone("control", items)
          }
          backgroundImage={backgroundImage}
        />
      )}
    </Box>
  );
}
