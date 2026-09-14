import type { ToolOnMap } from "../../../api/maps/types";
import type { Tool } from "../../../api/tools/types";
import type {
  GroupLayerTreeNode,
  LayerSwitcherDraft,
} from "../types";

export type { LayerSwitcherDraft as KartlagerDraft, LayerSwitcherDraft };

export interface AddDialogTarget {
  parentId: GroupLayerTreeNode["parent"];
  parentName: string;
  excludeGroupSourceId?: string;
  allowLayers: boolean;
}

export interface GroupLayerTreeProps {
  /** Map tools for the current map (includes layerswitcher Tool.options). */
  mapTools?: ToolOnMap[];
  /** Catalog tools — used when a layerswitcher is activated but not yet on the map. */
  catalogTools?: Tool[];
  /** Draft/server set of active tool ids — used to pick the active layerswitcher. */
  activeToolIds?: Set<number>;
  /** Map name — used for themes dialog save/load. */
  mapName?: string;
  /** DB map-layers + background state (catalog layer ids). */
  layerSwitcherState?: LayerSwitcherDraft | null;
  /**
   * Layers activated on the Lager tab. Map-layers list shows active FOREGROUND
   * layers; background list shows active BACKGROUND layers.
   */
  layerActivationRows?: {
    layerId: string;
    active: boolean;
    isBackground: boolean;
    /** Search/editing are activated on Lager but never appear in Lagerordning. */
    layerKind?: "display" | "search" | "editing";
  }[];
  /** Unsaved map-layers / background draft held by the map settings page. */
  pendingDraft?: LayerSwitcherDraft | null;
  /** Raised when map-layers / background differs from the loaded DB state. */
  onKartlagerDraftChange?: (draft: LayerSwitcherDraft | null) => void;
  /** Bumped when Lager checkboxes are reverted to the last committed state. */
  layerActivationResetKey?: number;
  /** Lager tab rows have been synced from the server — required for dirty checks. */
  menuSynced?: boolean;
  /** DOM host in FormActionPanel sidebar for the move-zone portal. */
  moveZoneHostEl?: HTMLElement | null;
}
