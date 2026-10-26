import prisma from "../../../common/prisma.ts";
import { HajkError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../common/hajk-status-codes.ts";

/**
 * Which admin tabs are on which map or group page, and which parts of it they
 * have unsaved changes in, so that others can be warned before they start.
 * The tabs report it themselves, at once when it changes and otherwise as a
 * heartbeat. A tab not heard from within the TTL is gone; it is longer than a
 * minute since a hidden tab's timers may only run once a minute. Kept in
 * memory, so it assumes a single backend instance. Only a warning: the layer
 * trees' version check is what refuses a stale save.
 */

const PRESENCE_TTL_MS = 150_000;

const RESOURCE_TYPES = ["map", "group"] as const;
const PARTS = ["tree", "settings", "tools", "details"] as const;

export type PresenceResourceType = (typeof RESOURCE_TYPES)[number];
export type PresencePart = (typeof PARTS)[number];

/** A tab and the map or group page it is on. */
export interface PresenceTab {
  clientId: string;
  type: PresenceResourceType;
  /** The map's name or the group's id. */
  id: string;
}

export interface PresenceReport extends PresenceTab {
  /** The parts of the page with unsaved changes, none if it is only open. */
  dirty: PresencePart[];
}

interface PresenceEntry extends PresenceReport {
  userName: string | null;
  /** When the tab went from no unsaved changes on the page to some. */
  dirtySince: number | null;
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
    const { dirty } = (body ?? {}) as Record<string, unknown>;
    if (!Array.isArray(dirty) || !dirty.every((part) => isOneOf(PARTS, part))) {
      throw badRequest(`dirty must be a list of ${PARTS.join(", ")}.`);
    }
    // In one order, each once, so that the answers don't change with it.
    return { ...tab, dirty: PARTS.filter((part) => dirty.includes(part)) };
  }

  report(report: PresenceReport, userName: string | null) {
    this.#prune();
    const now = Date.now();
    const previous = this.#entries.get(report.clientId);
    const stillDirty =
      previous?.type === report.type &&
      previous.id === report.id &&
      previous.dirtySince !== null;
    this.#entries.set(report.clientId, {
      ...report,
      userName,
      dirtySince:
        report.dirty.length === 0
          ? null
          : stillDirty
            ? previous.dirtySince
            : now,
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

  /** The other tabs on the map's or group's page, and its tree's version now. */
  async getPresence({ clientId, type, id }: PresenceTab) {
    this.#prune();
    const others = [...this.#entries.values()]
      .filter(
        (entry) =>
          entry.type === type && entry.id === id && entry.clientId !== clientId
      )
      .map(({ dirty, userName, dirtySince }) => ({
        dirty,
        userName,
        dirtySince:
          dirtySince === null ? null : new Date(dirtySince).toISOString(),
      }));
    return { others, version: await this.#treeVersion(type, id) };
  }

  /** Null when the map or group doesn't exist or is deleted. */
  async #treeVersion(
    type: PresenceResourceType,
    id: string
  ): Promise<number | null> {
    const owner =
      type === "map"
        ? await prisma.map.findFirst({
            where: { name: id, deletedAt: null },
            select: { treeVersion: true },
          })
        : await prisma.group.findFirst({
            where: { id, deletedAt: null },
            select: { treeVersion: true },
          });
    return owner?.treeVersion ?? null;
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
