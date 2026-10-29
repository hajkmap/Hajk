import { HajkError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../common/hajk-status-codes.ts";

/**
 * Which admin tabs are editing which map's or group's layer tree, so that
 * others can be warned before they start. The tabs report it themselves, at
 * once when it changes and otherwise as a heartbeat. A tab not heard from
 * within the TTL is gone; it is longer than a minute since a hidden tab's
 * timers may only run once a minute. Kept in memory, so it assumes a single
 * backend instance. Only a warning: the last save wins.
 */

const PRESENCE_TTL_MS = 150_000;

const RESOURCE_TYPES = ["map", "group"] as const;

export type PresenceResourceType = (typeof RESOURCE_TYPES)[number];

/** A tab and the map or group page it is on. */
export interface PresenceTab {
  clientId: string;
  type: PresenceResourceType;
  /** The map's name or the group's id. */
  id: string;
}

/** A tab's draft of the tree, passed on as it came for the others to show. */
type PresenceShadow = Record<string, unknown>;

export interface PresenceReport extends PresenceTab {
  /** Whether the tab has unsaved changes in the page's tree. */
  editing: boolean;
  /** Null when the tab isn't editing or its draft was too big to send. */
  shadow: PresenceShadow | null;
}

interface PresenceEntry extends PresenceTab {
  userName: string | null;
  /** When the tab began to have unsaved changes in the tree; null if none. */
  editingSince: number | null;
  shadow: PresenceShadow | null;
  seenAt: number;
}

function badRequest(message: string): HajkError {
  return new HajkError(
    HttpStatusCodes.BAD_REQUEST,
    message,
    HajkStatusCodes.INVALID_REQUEST_BODY
  );
}

const isText = (value: unknown, maxLength: number): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= maxLength;

const isOneOf = <T extends string>(
  values: readonly T[],
  value: unknown
): value is T => values.includes(value as T);

class PresenceService {
  // By tab: a tab is on one page at a time.
  #entries = new Map<string, PresenceEntry>();

  /** Reads which tab and page a request is about (a query or a body). */
  parseTab(value: unknown): PresenceTab {
    const raw = (value ?? {}) as Record<string, unknown>;
    if (!isText(raw.clientId, 100)) {
      throw badRequest("clientId must be a string of 1–100 characters.");
    }
    if (!isOneOf(RESOURCE_TYPES, raw.type)) {
      throw badRequest('type must be "map" or "group".');
    }
    if (!isText(raw.id, 255)) {
      throw badRequest("id must be a string of 1–255 characters.");
    }
    return { clientId: raw.clientId, type: raw.type, id: raw.id };
  }

  parseReport(body: unknown): PresenceReport {
    const tab = this.parseTab(body);
    const { editing, shadow = null } = (body ?? {}) as Record<string, unknown>;
    if (typeof editing !== "boolean") {
      throw badRequest("editing must be true or false.");
    }
    if (
      shadow !== null &&
      (typeof shadow !== "object" || Array.isArray(shadow))
    ) {
      throw badRequest("shadow must be an object or null.");
    }
    return { ...tab, editing, shadow: shadow as PresenceShadow | null };
  }

  report({ editing, shadow, ...tab }: PresenceReport, userName: string | null) {
    this.#prune();
    const now = Date.now();
    const previous = this.#entries.get(tab.clientId);
    const since =
      previous?.type === tab.type && previous.id === tab.id
        ? previous.editingSince
        : null;
    this.#entries.set(tab.clientId, {
      ...tab,
      userName,
      editingSince: editing ? (since ?? now) : null,
      shadow: editing ? shadow : null,
      seenAt: now,
    });
  }

  /** Removes the tab, unless it has already moved on to another page. */
  leave({ clientId, type, id }: PresenceTab) {
    const entry = this.#entries.get(clientId);
    if (entry?.type === type && entry.id === id) {
      this.#entries.delete(clientId);
    }
  }

  /** The other tabs editing the map's or group's tree, with their drafts. */
  getEditors({ clientId, type, id }: PresenceTab) {
    this.#prune();
    const editors: {
      userName: string | null;
      since: string;
      shadow: PresenceShadow | null;
    }[] = [];
    for (const entry of this.#entries.values()) {
      if (
        entry.type === type &&
        entry.id === id &&
        entry.clientId !== clientId &&
        entry.editingSince !== null
      ) {
        editors.push({
          userName: entry.userName,
          since: new Date(entry.editingSince).toISOString(),
          shadow: entry.shadow,
        });
      }
    }
    return { editors };
  }

  #prune() {
    const oldest = Date.now() - PRESENCE_TTL_MS;
    for (const [clientId, entry] of this.#entries) {
      if (entry.seenAt < oldest) {
        this.#entries.delete(clientId);
      }
    }
  }
}

export default new PresenceService();
