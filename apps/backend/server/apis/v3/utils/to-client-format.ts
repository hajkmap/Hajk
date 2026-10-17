/**
 * Pure mapping helpers that convert admin/Prisma values to the format the
 * Hajk client (`apps/client`) expects to receive in the public map config.
 *
 * Background and full traceability:
 *   - `apps/admin/docs/layer-vs-service-settings.md`
 *   - `apps/admin/docs/configuration-defaults.md`
 *
 * Why a translation step is needed:
 *
 *   The new admin/Prisma model uses uppercase enum values (`GEOSERVER`,
 *   `QGIS_SERVER`, `WMS`, `WFS`, …) because Prisma idiomatic and Zod schemas
 *   align with that. The Hajk client (and the legacy `App_Data/layers.json`
 *   format that is its public contract) uses **lowercase, dash-separated**
 *   tokens (`geoserver`, `qgis`, `mapserver`, `arcgis`, `geowebcache-standalone`).
 *
 *   Mismatched casing breaks branches in the client such as
 *     - `apps/client/src/utils/ConfigMapper.js`         (`args.serverType === "geoserver"`)
 *     - `apps/client/src/models/layers/WMSLayer.jsx`    (`this.get("serverType") === "arcgis"`)
 *     - `apps/client/src/models/{Click,MapClickModel}.js`(`serverType_ === "qgis"`)
 *     - `apps/client/src/models/SearchModel.js`         (`searchSource.serverType === "qgis"`)
 *
 *   These helpers are used when building `layersConfig` in
 *   `apps/backend/server/apis/v3/utils/build-legacy-layers-config.ts`
 *   (the layerswitcher's groups come from the map's layer tree, see
 *   `build-client-layer-tree.ts`), consumed from
 *   `public.service.ts#getClientConfigForMap`.
 */

/**
 * Hajk client server-type tokens. Mirrors the constants defined in the legacy
 * admin (`apps/legacy/admin/src/views/layerforms/wmslayerform.jsx`) which the
 * client still consumes as ground truth.
 */
export type ClientServerType =
  | "geoserver"
  | "qgis"
  | "mapserver"
  | "arcgis"
  | "geowebcache-standalone";

/**
 * Lowercased "type bucket" keys used in the client's flat layers config
 * (`wmslayers`, `wmtslayers`, `wfslayers`, `wfstlayers`, `vectorlayers`,
 * `arcgislayers`). Each Prisma `ServiceType` maps to exactly one bucket.
 */
export type ClientLayerBucket =
  | "wmslayers"
  | "wmtslayers"
  | "wfslayers"
  | "wfstlayers"
  | "vectorlayers"
  | "arcgislayers";

/**
 * Convert the admin/Prisma `ServerType` enum value to the lowercase token
 * the client expects.
 *
 * Admin-supported values:
 *   - `"GEOSERVER"`   → `"geoserver"`
 *   - `"QGIS_SERVER"` → `"qgis"`
 *
 * The function is tolerant of legacy-admin-style values (already lowercased)
 * being passed in – they pass through unchanged so that a future migration
 * that ingests legacy data does not need a separate code path.
 */
export function toClientServerType(
  adminServerType: string | null | undefined,
): ClientServerType | null {
  if (!adminServerType) {
    return null;
  }

  switch (adminServerType) {
    case "GEOSERVER":
    case "geoserver":
      return "geoserver";

    case "QGIS_SERVER":
    case "qgis":
      return "qgis";

    case "mapserver":
      return "mapserver";

    case "arcgis":
      return "arcgis";

    case "geowebcache-standalone":
      return "geowebcache-standalone";

    default:
      return null;
  }
}

/**
 * Map the admin/Prisma `ServiceType` enum value to the client's layer bucket
 * key. The bucket determines which array the layer is placed into in the
 * client's flat layers config (see `apps/backend/App_Data/layers.json` for
 * the canonical shape).
 *
 * Mapping:
 *   - `"WMS"`    → `"wmslayers"`
 *   - `"WMTS"`   → `"wmtslayers"`
 *   - `"WFS"`    → `"wfslayers"`
 *   - `"WFST"`   → `"wfstlayers"`
 *   - `"VECTOR"` → `"vectorlayers"`
 *   - `"ARCGIS"` → `"arcgislayers"`
 */
export function toClientLayerBucket(
  adminServiceType: string | null | undefined,
): ClientLayerBucket | null {
  switch (adminServiceType) {
    case "WMS":
      return "wmslayers";
    case "WMTS":
      return "wmtslayers";
    case "WFS":
      return "wfslayers";
    case "WFST":
      return "wfstlayers";
    case "VECTOR":
      return "vectorlayers";
    case "ARCGIS":
      return "arcgislayers";
    default:
      return null;
  }
}

/**
 * Subset of fields that conceptually live on the `Service` row but must be
 * inlined onto every flat layer entry the client receives.
 *
 * Use this type as the input to `toClientServiceFields` to enforce that all
 * service-derived fields are forwarded with the correct shape.
 */
export interface AdminServiceForClient {
  url: string;
  type: string;
  serverType: string | null | undefined;
  version: string | null | undefined;
  imageFormat: string | null | undefined;
  projection?: { code: string } | null;
  workspace?: string | null;
  getMapUrl?: string | null;
}

/**
 * Result of flattening service-level fields into the client layer shape.
 * Mirrors the field names found in `apps/backend/App_Data/layers.json` and
 * consumed by `apps/client/src/utils/ConfigMapper.js`.
 */
export interface ClientServiceFields {
  url: string;
  serverType: ClientServerType | null;
  version: string | null;
  imageFormat: string | null;
  projection: string | null;
  workspace: string | null;
  customGetMapUrl: string | null;
}

/**
 * Flatten the service row into the field names the client expects.
 *
 * Notes:
 *  - The client uses a flat string for `projection` (the EPSG code), not the
 *    nested `{ code }` object that admin/Prisma exposes.
 *  - `customGetMapUrl` is the client-side name for `Service.getMapUrl`
 *    (compare `apps/client/src/utils/ConfigMapper.js` line 150).
 *  - Returns `null` for missing values so callers can decide whether to drop
 *    the key or fall back to a default.
 */
export function toClientServiceFields(
  service: AdminServiceForClient,
): ClientServiceFields {
  return {
    url: service.url,
    serverType: toClientServerType(service.serverType),
    version: service.version ?? null,
    imageFormat: service.imageFormat ?? null,
    projection: service.projection?.code ?? null,
    workspace: service.workspace ?? null,
    customGetMapUrl: service.getMapUrl ?? null,
  };
}
