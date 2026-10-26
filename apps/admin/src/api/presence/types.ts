export type PresenceResourceType = "map" | "group";

/** The parts of a map's or group's page that can have unsaved changes. */
export type PresencePart = "tree" | "settings" | "tools" | "details";

/** A map (by name) or a group (by id) whose page a tab is on. */
export interface PresenceResource {
  type: PresenceResourceType;
  id: string;
}

export interface PresenceOther {
  /** None when the other tab only has the page open. */
  dirty: PresencePart[];
  /** From the login, if there is one. */
  userName: string | null;
  /** When it began to have unsaved changes on the page, by the server's clock. */
  dirtySince: string | null;
}

export interface Presence {
  /** The other tabs on the page, this tab's own left out. */
  others: PresenceOther[];
  /** The tree's version now; null if the map or group is gone. */
  version: number | null;
}
