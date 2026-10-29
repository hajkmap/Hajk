import type { MapTreeSettings } from "../layer-tree";

export type PresenceResourceType = "map" | "group";

/** A map (by name) or a group (by id) whose page a tab is on. */
export interface PresenceResource {
  type: PresenceResourceType;
  id: string;
}

/** A node of another tab's draft, without what only its editor needs. */
export interface LayerTreeShadowNode {
  id: string;
  parent: string;
  text: string;
  kind: "group" | "layer";
  sourceId: string;
  isNew?: boolean;
  hidden?: boolean;
}

/** What another tab's draft of the tree would save, for the shadow view. */
export interface LayerTreeShadow {
  nodes: LayerTreeShadowNode[];
  /** Map mode: only when the draft changes them. */
  settings?: MapTreeSettings;
  background: boolean;
  drawOrder: boolean;
}

/** Another tab with unsaved changes in the page's tree. */
export interface PresenceEditor {
  /** From the login or AD, if there is one. */
  userName: string | null;
  /** When it began to have unsaved changes in the tree, by the server's clock. */
  since: string;
  /** Null when the draft was too big to send. */
  shadow: LayerTreeShadow | null;
}

/** When the tree was last saved, and by whom. */
export interface PresenceSaved {
  at: string;
  /** From the login or AD, if there is one. */
  by: string | null;
}

export interface Presence {
  /** The other tabs editing the tree, this tab's own left out. */
  editors: PresenceEditor[];
  /** Null if the tree has never been saved. */
  saved: PresenceSaved | null;
}
