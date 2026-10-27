import prisma from "../../../common/prisma.ts";
import { HajkError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../common/hajk-status-codes.ts";
import { toClientWfstLayer } from "../utils/build-legacy-layers-config.ts";

// The WFS-T layers the client's attribute editor lists and edits, as the
// client config's `wfstlayers` have them. The client reads and writes the
// features itself, straight from each layer's url.

/** Hosts an absolute layer url may point at, lower-cased; null allows any. */
const allowedHosts = process.env.WFS_ALLOWED_HOSTS
  ? process.env.WFS_ALLOWED_HOSTS.split(",")
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean)
  : null;

/**
 * A relative url goes through this backend's proxy. An absolute one must be
 * http(s) and, with WFS_ALLOWED_HOSTS set, on an allowed host ("*.domain"
 * allows its subdomains).
 */
function isAllowedUrl(url: unknown): boolean {
  if (typeof url !== "string" || url === "") return false;
  if (url.startsWith("/")) return true;
  try {
    const { protocol, hostname } = new URL(url);
    if (protocol !== "http:" && protocol !== "https:") return false;
    return (
      allowedHosts === null ||
      allowedHosts.some((allowed) =>
        allowed.startsWith("*.")
          ? hostname === allowed.slice(2) || hostname.endsWith(allowed.slice(1))
          : hostname === allowed
      )
    );
  } catch {
    return false;
  }
}

/** Only the fields asked for, e.g. "id,caption"; all of them without any. */
function pickFields(
  layer: Record<string, unknown>,
  fields?: string
): Record<string, unknown> {
  const wanted = (fields ?? "")
    .split(",")
    .map((field) => field.trim())
    .filter(Boolean);
  if (wanted.length === 0) return layer;
  return Object.fromEntries(
    Object.entries(layer).filter(([key]) => wanted.includes(key))
  );
}

const editingLayerInclude = {
  service: { include: { projection: true } },
} as const;

class OgcService {
  /** The editing layers, leaving out those whose url isn't allowed. */
  async listWfstLayers(fields?: string) {
    const layers = await prisma.editingLayer.findMany({
      where: { deletedAt: null, service: { deletedAt: null } },
      include: editingLayerInclude,
      orderBy: { name: "asc" },
    });
    return layers
      .map((layer) => toClientWfstLayer(layer))
      .filter((layer) => isAllowedUrl(layer.url))
      .map((layer) => pickFields(layer, fields));
  }

  async getWfstLayer(id: string, fields?: string) {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      throw new HajkError(
        HttpStatusCodes.BAD_REQUEST,
        `Invalid layer id: ${id}`,
        HajkStatusCodes.INVALID_REQUEST_BODY
      );
    }
    const layer = await prisma.editingLayer.findFirst({
      where: { id, deletedAt: null, service: { deletedAt: null } },
      include: editingLayerInclude,
    });
    if (layer === null) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No editing layer with id: ${id} could be found.`,
        HajkStatusCodes.UNKNOWN_LAYER_ID
      );
    }
    const wfstLayer = toClientWfstLayer(layer);
    if (!isAllowedUrl(wfstLayer.url)) {
      throw new HajkError(
        HttpStatusCodes.INTERNAL_SERVER_ERROR,
        `The url of editing layer ${id} is not an allowed http(s) url (see WFS_ALLOWED_HOSTS).`,
        HajkStatusCodes.LAYER_URL_NOT_ALLOWED
      );
    }
    return pickFields(wfstLayer, fields);
  }
}

export default new OgcService();
