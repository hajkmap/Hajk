import React from "react";
import Select from "ol/interaction/Select";
import Translate from "ol/interaction/Translate";
import Modify from "ol/interaction/Modify";
import { Stroke, Fill, Style, Circle, Text } from "ol/style";
import { altKeyOnly } from "ol/events/condition";
import { fromCircle } from "ol/geom/Polygon";
import MultiPoint from "ol/geom/MultiPoint";
import LineString from "ol/geom/LineString";
import Feature from "ol/Feature";
import { editBus } from "../../../buses/editBus";
import HajkTransformer from "../../../utils/HajkTransformer";
import Draw from "ol/interaction/Draw";

const LAYER_NAME = "attributeeditor";

function matchesLogicalId(feat, want) {
  const a = feat?.getId?.();
  const b = feat?.get?.("@_fid");
  const c = feat?.get?.("id");
  const wantStr = String(want);
  const A = a != null ? String(a) : null;
  const B = b != null ? String(b) : null;
  const C = c != null ? String(c) : null;

  if (A === wantStr || B === wantStr || C === wantStr) return true;
  if (A && A.endsWith("." + wantStr)) return true;
  if (B && B.endsWith("." + wantStr)) return true;
  return false;
}

/**
 * If features are already Multi-type (e.g. MultiPolygon from PostGIS),
 * extract each individual geometry part as a separate Feature so that
 * drawModel.mergeFeatures() (which only handles simple types) can combine them
 * into a new Multi-geometry. Properties from the original feature are preserved.
 */
function flattenToSimpleFeatures(features) {
  const simpleTypes = ["Point", "LineString", "Polygon"];
  const firstType = features[0]?.getGeometry?.()?.getType?.() ?? "";
  if (simpleTypes.includes(firstType)) return features; // already simple, no-op

  return features.flatMap((f) => {
    const geom = f.getGeometry();
    const parts =
      typeof geom.getPolygons === "function"
        ? geom.getPolygons()
        : typeof geom.getLineStrings === "function"
          ? geom.getLineStrings()
          : typeof geom.getPoints === "function"
            ? geom.getPoints()
            : [];
    const props = { ...f.getProperties() };
    delete props.geometry;
    return parts.map((partGeom) => {
      const partFeature = new Feature({ geometry: partGeom, ...props });
      return partFeature;
    });
  });
}

function getFeatureCoordinates(feature) {
  const geometry = feature.getGeometry();
  if (!geometry) return [];

  const geometryType = geometry.getType();
  switch (geometryType) {
    case "Circle":
      return fromCircle(geometry, 8).getCoordinates()[0];
    case "LineString":
      return geometry.getCoordinates();
    case "Point":
      return [geometry.getCoordinates()];
    case "MultiPoint":
      return geometry.getCoordinates();
    case "MultiLineString":
      return geometry.getCoordinates().flat();
    case "MultiPolygon":
      let coords = [];
      geometry.getCoordinates().forEach((polygon) => {
        polygon.forEach((ring) => {
          ring.forEach((coord) => {
            coords.push(coord);
          });
        });
      });
      return coords;
    default:
      // Polygon
      return geometry.getCoordinates()[0];
  }
}

function getPolygonPerimeter(geometry) {
  try {
    const linearRingCoords =
      geometry?.getLinearRing?.(0)?.getCoordinates?.() || null;
    if (!linearRingCoords) return 0;
    return new LineString(linearRingCoords)?.getLength?.() || 0;
  } catch {
    return 0;
  }
}

/**
 * Custom hook for Sketch ↔ AttributeEditor integration
 *
 * Orchestrates integration for AttributeEditor layers:
 * - Finds/attaches OpenLayers interactions (Select/Translate/Modify) for the
 *   "attributeeditor" layer and keeps them enabled/disabled based on UI state
 *   (current activity, translate/modify toggles).
 * - Mirrors selection between map and panels: publishes the current AE
 *   selection to Sketch (EditView needs a single feature; MoveView needs a list).
 * - Listens to cross-plugin bus events:
 *     • sketch:ae-translate / sketch:ae-rotate → apply DrawModel move/rotate
 *     • attrib:focus-id → focus a specific AE feature and push it to EditView
 *     • sketch.attachExternalLayer → attach interactions to newly added AE layer
 * - In DELETE mode: handles map clicks to select the hit AE feature and toggles
 *   its delete state in the AttributeEditor.
 * - Ensures AE features have a materialized style before passing them to Sketch,
 *   so edit tools render/behave consistently.
 * - Cleans up all listeners/interactions on unmount or dependency changes.
 */
const useAttributeEditorIntegration = ({
  map,
  drawModel,
  localObserver,
  activityId,
  modifyEnabled,
  translateEnabled,
  pluginShown,
  attributeEditorActiveRef,
  measurementSettings,
}) => {
  const selectedIdsRef = React.useRef([]);

  const splitContextRef = React.useRef(null);
  const splitDrawInteractionRef = React.useRef(null);
  // Cleanup for an in-progress split. Held in a ref so both the effect's
  // teardown (unmount/dep change mid-split) and a re-entrant split-start
  // can end the previous split — without it, aborting before the first
  // click leaked the keydown listener and the snap helper key.
  const splitCleanupRef = React.useRef(null);

  // Persistent ref for geometry undo - survives effect re-runs
  // Key: canonical feature ID, Value: geometry before translation/modification
  const beforeGeomPersistentRef = React.useRef(new Map());

  // Ids currently marked for deletion in AttributeEditor, kept fresh via the
  // attrib:deleted-ids bus event. This hook has no direct access to the
  // AttributeEditor model (Sketch is mounted with map/app/options only), so
  // the bus is the only reliable source. The set contains raw, string and
  // numeric forms of each id.
  const aeDeletedIdsRef = React.useRef(new Set());

  // The configured id field (schema.idField) for the active AE layer,
  // mirrored from the attrib:schema-loaded bus event — same reasoning as
  // aeDeletedIdsRef: this hook has no access to the AttributeEditor model,
  // the bus is the only reliable source. Null when the layer has none.
  const aeIdFieldRef = React.useRef(null);
  React.useEffect(() => {
    const off = editBus.on("attrib:schema-loaded", (ev) => {
      aeIdFieldRef.current = ev.detail?.schema?.idField || null;
    });
    return () => off();
  }, []);

  React.useEffect(() => {
    if (!map) return;
    const lastPublishRef = { id: null, chan: null };

    // AE feature ids are read from the feature's "id"/"@_fid" properties,
    // which carry the same value as the row id in AttributeEditor — and the
    // consumers of the events we emit match ids with String()/alias logic.
    // (An earlier version tried to canonicalize against the AttributeEditor
    // model here, but that model was never available in this hook, so the
    // effective behavior has always been a passthrough.)
    const toCanonicalId = (idLike) => idLike;

    // Feature-id extraction for AE features. Honors the layer's configured
    // idField (mirrored from attrib:schema-loaded) before the generic
    // "id"/"@_fid"/getId fallbacks — with a custom id column the generic
    // chain reads the wrong id space, so every emitted id would miss the
    // AttributeEditor's rows. Without a configured idField the chain is
    // identical to the old inline pattern.
    const getAeFeatureId = (f) => {
      const fld = aeIdFieldRef.current;
      if (fld) {
        const v = f?.get?.(fld);
        if (v != null) return v;
      }
      return f?.get?.("id") ?? f?.get?.("@_fid") ?? f?.getId?.();
    };

    const getNodeHighlightStyle = (feature) => {
      return new Style({
        image: new Circle({
          radius: 5,
          fill: new Fill({
            color: "rgba(58, 130, 208, 0.6)", // Blue fill
          }),
          stroke: new Stroke({
            color: "#3A82D0", // Blue stroke
            width: 2,
          }),
        }),
        geometry: () => {
          const coordinates = getFeatureCoordinates(feature);
          return new MultiPoint(coordinates);
        },
      });
    };

    // ============================================================
    // SECTION: Measurement helpers for AttributeEditor features
    // ============================================================

    const getFeatureMeasurements = (feature) => {
      const geometry = feature?.getGeometry?.();
      if (!geometry) return [];

      const measurementSettings = drawModel?.getMeasurementSettings?.() || {};
      const showAreaPrefix =
        measurementSettings.showArea && measurementSettings.showPerimeter;

      const geoType = geometry.getType?.();

      // Point - no measurements to show
      if (geoType === "Point" || geoType === "MultiPoint") {
        return [];
      }

      // LineString - show length
      if (geoType === "LineString" || geoType === "MultiLineString") {
        const length =
          geoType === "LineString"
            ? geometry.getLength?.() || 0
            : geometry
                .getLineStrings?.()
                ?.reduce((sum, ls) => sum + (ls.getLength?.() || 0), 0) || 0;
        return [{ type: "LENGTH", value: length, prefix: "" }];
      }

      // Polygon - show area and perimeter
      if (geoType === "Polygon" || geoType === "MultiPolygon") {
        const area = geometry?.getArea?.() || 0;
        const perimeter =
          geoType === "Polygon"
            ? getPolygonPerimeter(geometry)
            : geometry
                .getPolygons?.()
                ?.reduce((sum, p) => sum + getPolygonPerimeter(p), 0) || 0;

        return [
          {
            type: "AREA",
            value: area,
            prefix: showAreaPrefix ? "Area:" : "",
          },
          {
            type: "PERIMETER",
            value: perimeter,
            prefix: "\n Omkrets:",
          },
        ];
      }

      return [];
    };

    const formatMeasurement = (measurement) => {
      const measurementSettings = drawModel?.getMeasurementSettings?.() || {};
      const { type, value, prefix } = measurement;

      const showMeasurement =
        (type === "LENGTH" && measurementSettings.showLength) ||
        (type === "AREA" && measurementSettings.showArea) ||
        (type === "PERIMETER" && measurementSettings.showPerimeter);

      if (!showMeasurement) return "";

      const precision = measurementSettings.precision ?? 0;
      const lengthUnit = measurementSettings.lengthUnit || "AUTO";
      const areaUnit = measurementSettings.areaUnit || "AUTO";

      const isLength = type === "LENGTH" || type === "PERIMETER";
      const unitFormat = isLength ? lengthUnit : areaUnit;

      let formatted = "";
      if (unitFormat === "KM" || unitFormat === "KM2") {
        // Kilometers
        if (isLength) {
          formatted = `${Number((value / 1e3).toFixed(precision)).toLocaleString()} km`;
        } else {
          formatted = `${Number((value / 1e6).toFixed(precision)).toLocaleString()} km²`;
        }
      } else if (unitFormat === "HECTARE" && !isLength) {
        // Hectare (only for area)
        formatted = `${Number((value / 1e4).toFixed(precision)).toLocaleString()} ha`;
      } else if (unitFormat === "AUTO") {
        // Auto - use km for large values
        const lengthCutOff = 1e3;
        const areaCutOff = 1e6;
        const useKm = isLength ? value > lengthCutOff : value > areaCutOff;

        if (useKm) {
          if (isLength) {
            formatted = `${Number((value / 1e3).toFixed(precision)).toLocaleString()} km`;
          } else {
            formatted = `${Number((value / 1e6).toFixed(precision)).toLocaleString()} km²`;
          }
        } else {
          if (isLength) {
            formatted = `${Number(value.toFixed(precision)).toLocaleString()} m`;
          } else {
            formatted = `${Number(value.toFixed(precision)).toLocaleString()} m²`;
          }
        }
      } else {
        // Default - meters
        if (isLength) {
          formatted = `${Number(value.toFixed(precision)).toLocaleString()} m`;
        } else {
          formatted = `${Number(value.toFixed(precision)).toLocaleString()} m²`;
        }
      }

      return `${prefix} ${formatted}`.trim();
    };

    const getMeasurementLabelText = (feature) => {
      const measurementSettings = drawModel?.getMeasurementSettings?.() || {};
      if (!measurementSettings.showText) return "";

      const measurements = getFeatureMeasurements(feature);
      return measurements
        .map((m) => formatMeasurement(m))
        .filter((s) => s.length > 0)
        .join("");
    };

    const getMeasurementTextStyle = (feature) => {
      const labelText = getMeasurementLabelText(feature);
      if (!labelText) return null;

      const geometry = feature?.getGeometry?.();
      const geoType = geometry?.getType?.();
      const featureIsPoint = geoType === "Point" || geoType === "MultiPoint";

      return new Text({
        textAlign: "center",
        textBaseline: "middle",
        font: "12pt sans-serif",
        fill: new Fill({ color: "#FFF" }),
        text: labelText,
        overflow: true,
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.7)",
          width: 3,
        }),
        offsetX: 0,
        offsetY: featureIsPoint ? -15 : 0,
      });
    };

    // Helper: Mark feature as managed by AttributeEditor
    // The layer's style function (wrapped in attachForLayer) handles all styling
    const markFeatureForAttributeEditor = (feature) => {
      if (!feature) return;

      // Mark that this feature's style is managed by AttributeEditor
      // (used by AttributeEditor for internal bookkeeping)
      feature.set?.("__ae_style_delegate", true, true);

      // Clear any feature-level style so the layer's style function is used
      // (the layer's style function handles measurements and edit highlights)
      if (feature.getStyle?.()) {
        feature.setStyle(null);
      }
    };

    const publishToEditView = (featureIn) => {
      // Delete-marked features must never be activated for edit/move: the
      // click/drag paths already refuse them, but the focus path went
      // straight through here and lit vertex nodes on red (pending delete)
      // objects. Treat them as "no feature" — clears the edit view instead.
      let feature = featureIn;
      if (feature) {
        const raw = getAeFeatureId(feature);
        if (
          aeDeletedIdsRef.current.has(raw) ||
          aeDeletedIdsRef.current.has(String(raw))
        ) {
          feature = null;
        }
      }
      const chan = activityId === "MOVE" ? "move" : "edit";
      const fid = feature
        ? (feature.getId?.() ?? feature.get?.("@_fid") ?? feature.get?.("id"))
        : null;

      // avoid identical updates
      if (lastPublishRef.id === fid && lastPublishRef.chan === chan) return;

      if (feature) {
        const gt = feature.getGeometry?.()?.getType?.() || "Polygon";
        const method =
          gt.replace(/^Multi/, "") === "LinearRing"
            ? "Polygon"
            : gt.replace(/^Multi/, "");
        feature.set("USER_DRAWN", true, true);
        // Mark feature for AttributeEditor sync only if AttributeEditor has an active layer
        if (attributeEditorActiveRef.current) {
          feature.set("SKETCH_ATTRIBUTEEDITOR", true, true);
        }
        feature.set("DRAW_METHOD", method, true);

        // Note: We no longer clear EDIT_ACTIVE from other features here.
        // syncOlSelection handles setting EDIT_ACTIVE on all selected features,
        // allowing multiple features to show nodes when multi-selected.

        // Set EDIT_ACTIVE when in EDIT mode AND plugin is shown (to show nodes)
        // modifyEnabled only controls whether nodes can be MODIFIED, not visibility
        feature.set("EDIT_ACTIVE", pluginShown && activityId === "EDIT", true);
        if (feature.get("TEXT_SETTINGS") == null) {
          feature.set(
            "TEXT_SETTINGS",
            {
              backgroundColor: "#000000",
              foregroundColor: "#FFFFFF",
              size: 14,
            },
            true
          );
        }
        if (feature.get("STYLE_BEFORE_HIDE") === undefined) {
          feature.set("STYLE_BEFORE_HIDE", null, true);
        }
      } else {
        // When clearing selection (feature is null), clear EDIT_ACTIVE from all features
        for (const [layer] of reg.entries()) {
          const src = layer.getSource?.();
          if (src) {
            const allFeatures = src.getFeatures?.() || [];
            allFeatures.forEach((f) => {
              if (f.get("EDIT_ACTIVE")) {
                f.set("EDIT_ACTIVE", false, true);
              }
            });
          }
        }
      }

      if (feature) {
        // Mark feature for AttributeEditor (clears feature-level style so layer style is used)
        markFeatureForAttributeEditor(feature);
      }

      if (activityId === "EDIT") {
        localObserver?.publish("drawModel.modify.mapClick", feature || null);
      } else if (activityId === "MOVE") {
        localObserver?.publish(
          "drawModel.move.select",
          feature ? [feature] : []
        );
      }

      lastPublishRef.id = fid;
      lastPublishRef.chan = chan;
    };

    const syncOlSelection = (logicalIds) => {
      const wanted = new Set();
      logicalIds.forEach((id) => {
        wanted.add(id);
        wanted.add(String(id));
      });

      for (const [layer, rec] of reg.entries()) {
        const select = rec?.select;
        const fc = select?.getFeatures?.();
        const src = layer?.getSource?.();
        if (!fc || !src) continue;

        fc.clear();

        const srcFeatures = src.getFeatures?.() || [];

        // First, clear EDIT_ACTIVE from ALL features in the source
        // This ensures previously selected features no longer show nodes
        srcFeatures.forEach((f) => {
          if (f.get("EDIT_ACTIVE")) {
            f.set("EDIT_ACTIVE", false, true);
          }
        });

        if (wanted.size === 0) continue;

        // Features marked for deletion in AttributeEditor are kept OUT of the
        // interaction collection: no edit nodes are shown for them, and the
        // Modify/Translate interactions (which operate on this collection)
        // cannot touch them. They can still be selected/unmarked in the UI —
        // that selection state lives in AttributeEditor, not in `fc`.
        const deletedIds = aeDeletedIdsRef.current;
        const isDeletionMarked = (f) => {
          const raw = getAeFeatureId(f);
          return deletedIds.has(raw) || deletedIds.has(String(raw));
        };

        const pushedFeatures = new Set();
        wanted.forEach((wid) => {
          const f =
            src.getFeatureById?.(wid) ||
            srcFeatures.find((x) => matchesLogicalId(x, wid));
          if (f && !pushedFeatures.has(f) && !isDeletionMarked(f)) {
            pushedFeatures.add(f);
            markFeatureForAttributeEditor(f);
            // Set EDIT_ACTIVE to show nodes (only when plugin is shown AND in EDIT mode)
            // modifyEnabled controls whether nodes can be MODIFIED (via Modify interaction)
            f.set("EDIT_ACTIVE", pluginShown && activityId === "EDIT", true);
            fc.push(f);
          }
        });

        // Trigger layer refresh to ensure vertex handles are rendered
        // This is needed when selection comes from TableMode (vs map click)
        layer?.changed?.();
      }
    };

    // ============================================================
    // SECTION: Shared refs
    // ============================================================
    const reg = new Map(); // Map<olLayer, { select, translate, modify, cleanup }>

    // ============================================================
    // SECTION: Enable/disable interactions based on UI state
    // ============================================================
    const applyEnablement = () => {
      const inMove = activityId === "MOVE";
      const inEditWithNodes = activityId === "EDIT" && modifyEnabled;

      const shouldBeActive = pluginShown;

      for (const [, { select, translate, modify }] of reg.entries()) {
        try {
          select.setActive(shouldBeActive);
        } catch {}
        try {
          translate.setActive(
            pluginShown &&
              inMove &&
              translate.__allowTranslate &&
              translateEnabled
          );
        } catch {}
        try {
          modify.setActive(
            pluginShown && inEditWithNodes && modify.__allowModify
          );
        } catch {}

        // Note: EDIT_ACTIVE is handled by syncOlSelection(), not here.
        // This keeps the logic in one place and avoids redundant layer refreshes.
      }
    };

    // ============================================================
    // SECTION: Helpers for AE layer/feature lookup
    // ============================================================
    const getAeSelected = () => {
      const arr = [];
      const seen = new Set();
      // Ids marked for deletion in AttributeEditor (via attrib:deleted-ids).
      // The set already contains raw, numeric and string forms of each id.
      const deletedIds = aeDeletedIdsRef.current;

      for (const { select } of reg.values()) {
        select?.getFeatures?.().forEach((f) => {
          const rawId = f.getId?.() ?? f.get?.("@_fid") ?? f.get?.("id");
          const key = String(rawId);

          // Skip if already seen or marked for deletion
          if (
            !seen.has(key) &&
            !deletedIds.has(rawId) &&
            !deletedIds.has(key)
          ) {
            seen.add(key);
            arr.push(f);
          }
        });
      }

      return arr;
    };

    const findAeFeatureById = (id) => {
      for (const lyr of reg.keys()) {
        const src = lyr.getSource?.();
        if (!src) continue;
        let f = src.getFeatureById?.(id);
        if (!f) {
          f = src.getFeatures?.().find((x) => matchesLogicalId(x, id));
        }
        if (f) return f;
      }
      return null;
    };

    // ============================================================
    // SECTION: Attach interactions for a single AE layer
    // ============================================================
    const attachForLayer = (
      layer,
      allow = { select: true, translate: true, modify: true }
    ) => {
      if (!layer || reg.has(layer)) return;
      if (layer.get?.("name") !== LAYER_NAME) return;

      // Wrap the layer's style function to include measurement text and edit highlights
      const originalStyleFn = layer.getStyleFunction?.();
      if (originalStyleFn && !layer.__measurementStyleWrapped) {
        layer.__measurementStyleWrapped = true;
        layer.setStyle((feature, resolution) => {
          // Skip kink markers
          if (feature.get("KINK_MARKER")) {
            return originalStyleFn(feature, resolution);
          }

          // Get original style
          let style = originalStyleFn(feature, resolution);
          if (!style) return style;

          // Handle array of styles - work with the first one
          const isArray = Array.isArray(style);
          const primaryStyle = isArray ? style[0] : style;
          if (!primaryStyle) return style;

          // Clone style to avoid mutating the original
          const clonedStyle = primaryStyle.clone
            ? primaryStyle.clone()
            : primaryStyle;

          // Add measurement text if enabled
          const measurementTextStyle = getMeasurementTextStyle(feature);
          if (measurementTextStyle) {
            clonedStyle.setText(measurementTextStyle);
          }

          // Add node highlights when in edit mode
          if (feature.get("EDIT_ACTIVE") === true) {
            if (isArray) {
              return [
                clonedStyle,
                getNodeHighlightStyle(feature),
                ...style.slice(1),
              ];
            }
            return [clonedStyle, getNodeHighlightStyle(feature)];
          }

          // Return cloned style (preserving array structure if needed)
          if (isArray) {
            return [clonedStyle, ...style.slice(1)];
          }
          return clonedStyle;
        });
      }

      // Use persistent ref for geometry undo - survives effect re-runs
      const beforeGeomRef = beforeGeomPersistentRef.current;

      const sel = new Select({
        layers: (lyr) => lyr === layer,
        style: null,
        hitTolerance: 6,
        multi: true,
        // We sync selection via attrib:select-ids; block OL's own picking.
        condition: () => false,
        // Filter out kink markers from selection
        filter: (feature) => !feature.get("KINK_MARKER"),
      });

      const fc = sel.getFeatures();

      const tr = new Translate({
        features: fc,
        condition: (evt) => {
          if (activityId !== "MOVE" || !translateEnabled) return false;

          // Ids marked for deletion in AttributeEditor (via the
          // attrib:deleted-ids event; contains raw/numeric/string forms).
          const deletedIds = aeDeletedIdsRef.current;
          const isDeleted = (f) => {
            const raw = getAeFeatureId(f);
            return deletedIds.has(raw) || deletedIds.has(String(raw));
          };

          // Collect ALL features at the pixel, excluding deleted ones
          const candidates = [];
          map.forEachFeatureAtPixel(
            evt.pixel,
            (f, lyr) => {
              if (lyr === layer && !f.get("KINK_MARKER")) {
                // Filter out features marked for deletion
                if (!isDeleted(f)) {
                  candidates.push(f);
                }
              }
              return false; // Continue iterating to collect all
            },
            { hitTolerance: 6, layerFilter: (lyr) => lyr === layer }
          );
          if (!candidates.length) return false;

          // Priority selection:
          // 1. Prefer features already in the selection (so user can grab a selected feature)
          // 2. Otherwise use the first (topmost) candidate
          const currentSelection = fc.getArray ? fc.getArray() : [];
          let hit = candidates.find((f) => currentSelection.includes(f));
          if (!hit) {
            hit = candidates[0];
          }
          if (!hit) return false;

          markFeatureForAttributeEditor(hit);

          const raw = getAeFeatureId(hit);
          const canon = toCanonicalId(raw);

          const multi =
            evt.originalEvent?.ctrlKey ||
            evt.originalEvent?.metaKey ||
            evt.originalEvent?.shiftKey;

          if (!multi) {
            try {
              fc.clear();
            } catch {}
            // Set EDIT_ACTIVE before adding to fc so the style function sees correct value
            // EDIT_ACTIVE controls node VISIBILITY (only when plugin shown AND in EDIT mode)
            // modifyEnabled controls whether nodes can be MODIFIED (via Modify interaction)
            hit.set("EDIT_ACTIVE", pluginShown && activityId === "EDIT", true);
            fc.push(hit);
            editBus.emit("attrib:select-ids", {
              ids: [canon],
              source: "map",
              mode: "replace",
            });
          } else {
            const arr = fc.getArray ? fc.getArray() : [];
            if (arr.includes(hit)) {
              fc.remove(hit);
            } else {
              // Set EDIT_ACTIVE before adding to fc so the style function sees correct value
              // EDIT_ACTIVE controls node VISIBILITY (only when plugin shown AND in EDIT mode)
              hit.set(
                "EDIT_ACTIVE",
                pluginShown && activityId === "EDIT",
                true
              );
              fc.push(hit);
            }

            const ids = (fc.getArray ? fc.getArray() : []).map((f) => {
              const id = getAeFeatureId(f);
              return toCanonicalId(id);
            });
            editBus.emit("attrib:select-ids", {
              ids,
              source: "map",
              mode: "toggle",
            });
          }
          return true;
        },
      });

      const mod = new Modify({
        features: fc,
        pixelTolerance: 6,
        deleteCondition: altKeyOnly,
      });

      tr.__allowTranslate = !!allow.translate;
      mod.__allowModify = !!allow.modify;

      // ---------- named handlers (so we can bind/unbind cleanly) ----------
      const onTranslateStart = (e) => {
        const f = e?.features?.item?.(0);
        if (!f) return;
        const raw = getAeFeatureId(f);
        const canon = toCanonicalId(raw);
        const g = f.getGeometry?.();
        beforeGeomRef.set(canon, g && g.clone ? g.clone() : null);
      };

      const onModifyStart = (e) => {
        const f = e?.features?.item?.(0);
        if (!f) return;
        const raw = getAeFeatureId(f);
        const canon = toCanonicalId(raw);
        const g = f.getGeometry?.();
        beforeGeomRef.set(canon, g && g.clone ? g.clone() : null);
      };

      const onTranslateEnd = (e) => {
        const f = e?.features?.item?.(0) ?? null;
        publishToEditView(f);
        if (!f) return;

        const raw = getAeFeatureId(f);
        const canon = toCanonicalId(raw);

        editBus.emit("attrib:select-ids", {
          ids: [canon],
          source: "map",
          mode: "replace",
        });

        const after = f.getGeometry?.();
        const before = beforeGeomRef.get(canon) || null;
        editBus.emit("sketch:geometry-edited", {
          id: canon,
          before: before && before.clone ? before.clone() : before,
          after: after && after.clone ? after.clone() : after,
          when: Date.now(),
        });
        beforeGeomRef.delete(canon);
      };

      const onModifyEnd = (e) => {
        const f = e?.features?.item?.(0) ?? null;
        publishToEditView(f);
        if (!f) return;

        const raw = getAeFeatureId(f);
        const canon = toCanonicalId(raw);

        editBus.emit("attrib:select-ids", {
          ids: [canon],
          source: "map",
          mode: "replace",
        });

        const after = f.getGeometry?.();
        const before = beforeGeomRef.get(canon) || null;
        editBus.emit("sketch:geometry-edited", {
          id: canon,
          before: before && before.clone ? before.clone() : before,
          after: after && after.clone ? after.clone() : after,
          when: Date.now(),
        });
        beforeGeomRef.delete(canon);
      };
      // --------------------------------------------------------------------

      // Bind

      tr.on("translatestart", onTranslateStart);
      tr.on("translateend", onTranslateEnd);
      mod.on("modifystart", onModifyStart);
      mod.on("modifyend", onModifyEnd);

      map.addInteraction(sel);
      map.addInteraction(tr);
      map.addInteraction(mod);

      const cleanup = () => {
        try {
          tr.un("translatestart", onTranslateStart);
        } catch {}
        try {
          tr.un("translateend", onTranslateEnd);
        } catch {}
        try {
          mod.un("modifystart", onModifyStart);
        } catch {}
        try {
          mod.un("modifyend", onModifyEnd);
        } catch {}
        try {
          map.removeInteraction(sel);
        } catch {}
        try {
          map.removeInteraction(tr);
        } catch {}
        try {
          map.removeInteraction(mod);
        } catch {}
        // Note: Do NOT clear beforeGeomRef here - it's a persistent ref
        // that needs to survive effect re-runs for undo to work correctly
      };

      reg.set(layer, { select: sel, translate: tr, modify: mod, cleanup });
      applyEnablement();
    };

    // ============================================================
    // SECTION: Cross-plugin bus subscriptions (AE ↔ Sketch)
    // ============================================================
    // Mirror AttributeEditor's deletion-marked ids into a local ref, so
    // translate/rotate/move can refuse to touch those features. Expand each
    // id to raw/string/numeric forms for cheap lookups.
    const offDeletedIds = editBus.on("attrib:deleted-ids", (ev) => {
      const ids = ev.detail?.ids || [];
      const set = new Set();
      ids.forEach((id) => {
        set.add(id);
        set.add(String(id));
        const n = Number(id);
        if (Number.isFinite(n)) set.add(n);
      });
      aeDeletedIdsRef.current = set;

      // Re-sync the OL selection against the new deletion set: features that
      // just became deletion-marked are dropped from the interaction
      // collection (their edit nodes disappear and vertex editing stops
      // working), and features that were unmarked come back.
      syncOlSelection(selectedIdsRef.current || []);

      // Also re-publish to Sketch's Edit-/MoveView (same pattern as the
      // select-ids handler): without this, a feature that just became
      // deletion-marked stayed active in those panels — nodes went out but
      // Flytta/Rotera silently no-opped against it. The dedup ref must be
      // reset first, and publishToEditView's own deletion guard turns a
      // now-deleted head feature into null (clearing the panel).
      lastPublishRef.id = null;
      lastPublishRef.chan = null;
      const currentIds = selectedIdsRef.current || [];
      if (currentIds.length) {
        const f = findAeFeatureById(currentIds[0]);
        publishToEditView(f || null);
      } else {
        publishToEditView(null);
      }
    });

    const offAttribSelectIds = editBus.on("attrib:select-ids", (ev) => {
      // Sync OL selection with logical ids from UI. detail.mode is
      // informational only — the ids list is always the complete final
      // selection and replaces the previous state wholesale.
      const { ids = [] } = ev.detail || {};

      // Store selected IDs so we can restore selection after effect re-runs
      selectedIdsRef.current = ids;

      lastPublishRef.id = null;
      lastPublishRef.chan = null;

      // Ensure Modify interaction is deactivated BEFORE adding features to fc
      // This prevents vertex handles from flashing when modifyEnabled is false
      applyEnablement();

      syncOlSelection(ids);

      if (ids.length) {
        const f = findAeFeatureById(ids[0]);
        publishToEditView(f || null);
      } else {
        publishToEditView(null);
      }
    });

    const offTranslateCmd = editBus.on("sketch:ae-translate", (ev) => {
      const { distance, angleDeg } = ev.detail || {};
      const feats = getAeSelected();
      if (!feats.length) return;

      // 1) snapshot BEFORE
      const before = new Map();
      feats.forEach((f) => {
        const raw = getAeFeatureId(f);
        const id = toCanonicalId(raw);
        before.set(id, f.getGeometry?.()?.clone?.() ?? null);
      });

      // 2) Move
      drawModel.translateSelectedFeatures(distance, angleDeg, {
        features: feats,
      });

      // 3) Emit geometry-edited - DE-DUPLICATE per canonical ID
      const when = Date.now();
      const emittedIds = new Set();

      feats.forEach((f) => {
        const raw = getAeFeatureId(f);
        const id = toCanonicalId(raw);

        // Skip if we have already emitted for this canonical ID
        if (emittedIds.has(id)) {
          return;
        }
        emittedIds.add(id);

        const g = f.getGeometry?.();
        editBus.emit("sketch:geometry-edited", {
          id,
          before: before.get(id),
          after: g && g.clone ? g.clone() : g,
          when,
        });
      });
    });

    const offRotateCmd = editBus.on("sketch:ae-rotate", (ev) => {
      const { degrees = 0, clockwise = true, continuous = false } = ev.detail || {};
      const feats = getAeSelected();
      if (!feats.length) return;

      // anchor point for rotation
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
      feats.forEach((f) => {
        const e = f.getGeometry?.()?.getExtent?.();
        if (!e) return;
        minX = Math.min(minX, e[0]);
        minY = Math.min(minY, e[1]);
        maxX = Math.max(maxX, e[2]);
        maxY = Math.max(maxY, e[3]);
      });
      const anchor = [(minX + maxX) / 2, (minY + maxY) / 2];
      const angleRad = (clockwise ? -1 : 1) * ((degrees * Math.PI) / 180);

      // Snapshot before rotation
      const before = new Map();
      feats.forEach((f) => {
        const raw = getAeFeatureId(f);
        const id = toCanonicalId(raw);
        before.set(id, f.getGeometry?.()?.clone?.() ?? null);
      });

      // rotation
      feats.forEach((f) => {
        const g = f.getGeometry?.();
        if (!g?.rotate) return;
        if (g.clone) f.setGeometry(g.clone());
        f.getGeometry().rotate(angleRad, anchor);
      });

      // AFTER => geometry-edited
      const when = Date.now();
      const emittedIds = new Set();

      feats.forEach((f) => {
        const raw = getAeFeatureId(f);
        const id = toCanonicalId(raw);

        if (emittedIds.has(id)) return;
        emittedIds.add(id);

        const g = f.getGeometry?.();
        editBus.emit("sketch:geometry-edited", {
          id,
          before: before.get(id),
          after: g && g.clone ? g.clone() : g,
          when,
          // Continuous rotation: let the undo bookkeeping merge the ticks
          coalesce: continuous,
        });
      });
    });

    const offFocus = editBus.on("attrib:focus-id", (ev) => {
      const id = ev?.detail?.id;
      // Publish to Sketch if we're in a state where it's needed
      if (!(activityId === "EDIT" || activityId === "MOVE")) return;
      if (id == null) {
        if (activityId === "EDIT") {
          localObserver?.publish("drawModel.modify.mapClick", null);
        } else if (activityId === "MOVE") {
          localObserver?.publish("drawModel.move.select", []);
        }
        return;
      }
      const f = findAeFeatureById(id);
      if (f) {
        // Mark feature for AttributeEditor (clears feature-level style so layer style is used)
        markFeatureForAttributeEditor(f);
      }
      if (activityId === "EDIT") {
        localObserver?.publish("drawModel.modify.mapClick", f || null);
      } else if (activityId === "MOVE") {
        localObserver?.publish("drawModel.move.select", f ? [f] : []);
      }
    });

    const offDisable = editBus.on("sketch:disable-ae-interactions", (ev) => {
      const { disable } = ev.detail || {};
      if (disable) {
        // Shutdown all interactions
        for (const { select, translate, modify } of reg.values()) {
          try {
            select.setActive(false);
          } catch {}
          try {
            translate.setActive(false);
          } catch {}
          try {
            modify.setActive(false);
          } catch {}
        }
      } else {
        // Reactivate all interactions according to UI state
        applyEnablement();
      }
    });

    // ============================================================
    // SECTION: Split feature mode
    // ============================================================
    const offSplitStart = editBus.on("attrib:split-start", (ev) => {
      const { featureId, geometryType } = ev.detail || {};
      if (!featureId) return;

      // Restart semantics: a split may already be in progress (double-click
      // on the button) — clean the previous one up silently first, so two
      // Draw interactions and two keydown listeners can never stack.
      splitCleanupRef.current?.(false);

      // Store context
      splitContextRef.current = { featureId, geometryType };

      // Find the target feature
      const targetFeature = findAeFeatureById(featureId);
      if (!targetFeature) {
        editBus.emit("sketch:split-error", {
          message: "Kunde inte hitta objektet att dela",
        });
        splitContextRef.current = null;
        return;
      }

      // Disable other interactions during split
      for (const { select, translate, modify } of reg.values()) {
        try {
          select.setActive(false);
        } catch {}
        try {
          translate.setActive(false);
        } catch {}
        try {
          modify.setActive(false);
        } catch {}
      }

      // Temporarily disable all map interactions to prevent interference
      // We'll use the sketch:disable-ae-interactions pattern
      editBus.emit("sketch:disable-ae-interactions", { disable: true });

      // Disable Sketch's draw interaction (AddView) so the split line
      // isn't also added as a drawn feature
      const sketchDraw = map
        .getInteractions()
        .getArray()
        .find((i) => i instanceof Draw && i.get("DRAW_METHOD"));
      if (sketchDraw) sketchDraw.setActive(false);

      // Create a draw interaction for LineString (cutting line)
      const drawInteraction = new Draw({
        type: "LineString",
        stopClick: true, // Prevent double-click zoom
        style: new Style({
          stroke: new Stroke({
            color: "#ff0000",
            width: 2,
            lineDash: [5, 5],
          }),
          image: new Circle({
            radius: 5,
            fill: new Fill({ color: "#ff0000" }),
          }),
        }),
      });

      // Cleanup function for split drawing
      const cleanupSplitDraw = (cancelled = false) => {
        splitCleanupRef.current = null;
        document.removeEventListener("keydown", handleSplitKeyDown);
        map.removeInteraction(drawInteraction);
        map.snapHelper?.delete?.("attributeEditorSplit");
        splitDrawInteractionRef.current = null;
        splitContextRef.current = null;

        // Re-enable interactions
        editBus.emit("sketch:disable-ae-interactions", { disable: false });
        applyEnablement();

        // Re-enable Sketch's draw interaction (AddView) if it was paused
        if (sketchDraw) sketchDraw.setActive(true);

        if (cancelled) {
          editBus.emit("sketch:split-cancelled", {});
        }
      };

      // Track whether the cutting line has been started: OL's abortDrawing()
      // is a no-op (no drawabort event) before the first point is placed, so
      // Escape pressed before the first click must exit split mode directly.
      let splitSketchStarted = false;
      drawInteraction.on("drawstart", () => {
        splitSketchStarted = true;
      });

      // Keyboard handler for Escape and Ctrl+Z
      const handleSplitKeyDown = (e) => {
        const { keyCode, ctrlKey, metaKey } = e;
        if (keyCode === 27) {
          // Escape - abort drawing (or exit split mode if not started)
          e.preventDefault();
          if (splitSketchStarted) {
            drawInteraction.abortDrawing();
          } else {
            cleanupSplitDraw(true);
          }
        } else if ((ctrlKey || metaKey) && keyCode === 90) {
          // Ctrl+Z / Cmd+Z - remove last point
          e.preventDefault();
          drawInteraction.removeLastPoint();
        }
      };

      // Add keyboard listener
      document.addEventListener("keydown", handleSplitKeyDown);

      // Expose the cleanup: the effect teardown and a re-entrant
      // split-start use it to end this split without leaks.
      splitCleanupRef.current = cleanupSplitDraw;

      // Handle draw abort (triggered by abortDrawing())
      drawInteraction.on("drawabort", () => {
        cleanupSplitDraw(true);
      });

      // Handle draw end
      drawInteraction.on("drawend", (e) => {
        // Remove keyboard listener first
        document.removeEventListener("keydown", handleSplitKeyDown);

        const cuttingLine = e.feature;
        const context = splitContextRef.current;

        if (!context) {
          cleanupSplitDraw(false);
          return;
        }

        // Find the target feature again
        const feature = findAeFeatureById(context.featureId);
        if (!feature) {
          editBus.emit("sketch:split-error", {
            message: "Kunde inte hitta objektet att dela",
          });
          cleanupSplitDraw(false);
          return;
        }

        try {
          // Create HajkTransformer with map projection
          const projection = map.getView().getProjection().getCode();
          const transformer = new HajkTransformer({ projection });

          // Perform the split
          const splitResults = transformer.getSplit(feature, cuttingLine);

          // Emit results - send geometries
          editBus.emit("sketch:split-complete", {
            originalFeatureId: context.featureId,
            splitFeatures: splitResults.map((f) => f.getGeometry()),
          });
        } catch (error) {
          editBus.emit("sketch:split-error", {
            message: error.message || "Kunde inte dela objektet",
          });
        }

        // Cleanup (don't emit cancelled since we completed or errored)
        cleanupSplitDraw(false);
      });

      // Add the draw interaction to the map
      map.addInteraction(drawInteraction);
      splitDrawInteractionRef.current = drawInteraction;

      // Enable snapping after draw interaction is added.
      // IMPORTANT: OpenLayers Snap must be added AFTER the Draw interaction it intercepts.
      // If snap interactions already exist (from other Sketch modes), we need to refresh
      // them so they're re-added after our Draw interaction.
      const snapHelper = map.snapHelper;
      if (snapHelper) {
        // Force refresh by re-setting the same pixel tolerance - this removes
        // and re-adds all snap interactions, placing them after our Draw
        const currentTolerance = snapHelper.pixelTolerance || 10;
        snapHelper.setPixelTolerance(currentTolerance);
        snapHelper.add("attributeEditorSplit");
      }
    });

    // ============================================================
    // SECTION: Split multi-feature into individual features
    // ============================================================
    const offSplitMulti = editBus.on("attrib:split-multi-feature", (ev) => {
      const { featureId } = ev.detail || {};
      if (!featureId) return;

      // Find the target feature
      const targetFeature = findAeFeatureById(featureId);
      if (!targetFeature) {
        editBus.emit("sketch:split-multi-error", {
          message: "Kunde inte hitta objektet att dela upp",
        });
        return;
      }

      // Check if it's actually a multi-feature
      if (!drawModel.isMultiFeature(targetFeature)) {
        editBus.emit("sketch:split-multi-error", {
          message: "Objektet är inte en multi-feature",
        });
        return;
      }

      // Split the multi-feature
      const newFeatures = drawModel.splitMultiFeature(targetFeature);
      if (newFeatures.length === 0) {
        editBus.emit("sketch:split-multi-error", {
          message: "Kunde inte dela upp objektet",
        });
        return;
      }

      // Get the Sketch source - we add to Sketch and let AE's onAdd flow handle it
      const sketchSource = drawModel.getCurrentVectorSource();
      if (!sketchSource) {
        editBus.emit("sketch:split-multi-error", {
          message: "Kunde inte hitta Sketch-lagret",
        });
        return;
      }

      // Mark original multi-feature for deletion (don't remove from source yet)
      // User can commit to save, or undo to restore
      editBus.emit("attrib:toggle-delete-ids", {
        ids: [featureId],
        source: "split-multi",
        mode: "mark",
      });

      // Add the new individual features to Sketch source
      const newIds = [];
      newFeatures.forEach((newFeature) => {
        // Clear any existing ID - each new feature needs a fresh ID from AE
        newFeature.setId(undefined);
        newFeature.unset("id", true);
        newFeature.unset("@_fid", true);
        newFeature.unset("fid", true);
        newFeature.unset("ogc_fid", true);

        // Mark for AttributeEditor processing - AE's onAdd will assign the ID
        newFeature.set("USER_DRAWN", true, true);
        newFeature.set("SKETCH_ATTRIBUTEEDITOR", true, true);

        // Add to Sketch source - AE's onAdd handler will process it
        sketchSource.addFeature(newFeature);

        // Get the ID that was assigned by AE's onAdd handler
        const newId = newFeature.getId();
        newIds.push(newId);
      });

      // Emit success event with the new feature IDs
      editBus.emit("sketch:split-multi-complete", {
        originalId: featureId,
        newIds: newIds,
        count: newFeatures.length,
      });
    });

    // ============================================================
    // SECTION: Merge features into a multi-feature
    // ============================================================
    const offMergeFeatures = editBus.on("attrib:merge-features", (ev) => {
      const { featureIds } = ev.detail || {};
      if (!featureIds || featureIds.length < 2) {
        editBus.emit("sketch:merge-error", {
          message: "Minst två objekt krävs för att slå ihop",
        });
        return;
      }

      // Find all target features
      const targetFeatures = featureIds
        .map((id) => findAeFeatureById(id))
        .filter((f) => f !== null);

      if (targetFeatures.length < 2) {
        editBus.emit("sketch:merge-error", {
          message: "Kunde inte hitta tillräckligt många objekt",
        });
        return;
      }

      // If features are Multi-type (e.g. MultiPolygon loaded from PostGIS),
      // flatten them to their simple parts before merging so drawModel works as-is.
      const featuresForMerge = flattenToSimpleFeatures(targetFeatures);

      // Merge the features
      const mergedFeature = drawModel.mergeFeatures(featuresForMerge);
      if (!mergedFeature) {
        editBus.emit("sketch:merge-error", {
          message:
            "Kunde inte slå ihop objekten. Kontrollera att alla objekt har samma geometrityp.",
        });
        return;
      }

      // Get the Sketch source - we add to Sketch and let AE's onAdd flow handle it
      const sketchSource = drawModel.getCurrentVectorSource();
      if (!sketchSource) {
        editBus.emit("sketch:merge-error", {
          message: "Kunde inte hitta Sketch-lagret",
        });
        return;
      }

      // Mark original features for deletion (don't remove from source yet)
      // User can commit to save, or undo to restore
      editBus.emit("attrib:toggle-delete-ids", {
        ids: featureIds,
        source: "merge",
        mode: "mark",
      });

      // Clear any existing ID - merged feature needs a fresh ID from AE
      mergedFeature.setId(undefined);
      mergedFeature.unset("id", true);
      mergedFeature.unset("@_fid", true);
      mergedFeature.unset("fid", true);
      mergedFeature.unset("ogc_fid", true);

      // Mark for AttributeEditor processing - AE's onAdd will assign the ID
      mergedFeature.set("USER_DRAWN", true, true);
      mergedFeature.set("SKETCH_ATTRIBUTEEDITOR", true, true);

      // Add to Sketch source - AE's onAdd handler will:
      // 1. Create a draft with negative ID
      // 2. Move feature from Sketch to AE layer
      // 3. Update featureIndexRef
      sketchSource.addFeature(mergedFeature);

      // Get the ID that was assigned by AE's onAdd handler
      const newId = mergedFeature.getId();

      // Emit success event
      editBus.emit("sketch:merge-complete", {
        originalIds: featureIds,
        newId: newId,
      });
    });

    // ============================================================
    // SECTION: Wire up existing layers
    // ============================================================
    const offAttach = editBus.on("sketch.attachExternalLayer", (ev) => {
      const { layer, allow } = ev.detail || {};
      attachForLayer(layer, allow);
    });

    const layers = map.getLayers();
    try {
      const arr = layers.getArray?.() || [];
      arr.forEach((lyr) =>
        attachForLayer(lyr, { select: true, translate: true, modify: true })
      );
    } catch {}

    const onLayerAdd = (e) => {
      const lyr = e.element || e.layer || e.target;
      attachForLayer(lyr, { select: true, translate: true, modify: true });
      // Refresh snap helper when a new layer is added so features can be snapped to
      if (lyr.get?.("name") === LAYER_NAME) {
        try {
          map.snapHelper?.delete?.("coreDrawModel");
          map.snapHelper?.add?.("coreDrawModel");
        } catch (e) {
          console.warn("Could not refresh snap helper:", e);
        }
      }
    };

    const onLayerRemove = (e) => {
      const lyr = e.element || e.layer || e.target;
      const rec = reg.get(lyr);
      if (rec) {
        try {
          rec.cleanup();
        } catch {}
        reg.delete(lyr);
      }
    };

    layers.on?.("add", onLayerAdd);
    layers.on?.("remove", onLayerRemove);

    applyEnablement();

    // ============================================================
    // SECTION: Delete-mode click handler (for AE features)
    // ============================================================
    const onDeleteClick = (evt) => {
      if (activityId !== "DELETE") return;
      if (!pluginShown) return;
      if (evt.dragging) return;
      if (evt.originalEvent?.button !== 0) return;

      const targetLayer =
        (map.getLayers().getArray?.() || []).find(
          (l) => l.get?.("name") === LAYER_NAME
        ) || null;
      if (!targetLayer) return;

      let hit = null;
      map.forEachFeatureAtPixel(
        evt.pixel,
        (f, lyr) =>
          lyr === targetLayer && !f.get("KINK_MARKER")
            ? ((hit = f), true)
            : false,
        { layerFilter: (lyr) => lyr === targetLayer, hitTolerance: 6 }
      );
      if (!hit) return;

      const raw = getAeFeatureId(hit);
      if (raw == null) return;

      const canon = toCanonicalId(raw);

      editBus.emit("attrib:select-ids", {
        ids: [canon],
        source: "map",
        mode: "replace",
      });
      editBus.emit("attrib:toggle-delete-ids", { ids: [canon], source: "map" });

      evt.preventDefault?.();
      evt.stopPropagation?.();
    };

    map.on("singleclick", onDeleteClick);

    // ============================================================
    // SECTION: Restore selection after effect re-runs
    // ============================================================
    // When modifyEnabled changes, the effect re-runs and all interactions are
    // recreated with empty feature collections. Restore the previous selection
    // so the user doesn't have to click again.
    if (selectedIdsRef.current.length > 0) {
      syncOlSelection(selectedIdsRef.current);
      const f = findAeFeatureById(selectedIdsRef.current[0]);
      if (f) {
        publishToEditView(f);
      }
    }

    // ============================================================
    // SECTION: Cleanup
    // ============================================================
    return () => {
      try {
        offDeletedIds();
      } catch {}
      try {
        offAttribSelectIds();
      } catch {}
      try {
        layers.un?.("remove", onLayerRemove);
      } catch {}
      try {
        offAttach();
      } catch {}
      try {
        offTranslateCmd();
      } catch {}
      try {
        offRotateCmd();
      } catch {}
      try {
        offFocus();
      } catch {}
      try {
        offDisable();
      } catch {}
      try {
        offSplitStart();
      } catch {}
      try {
        offSplitMulti();
      } catch {}
      try {
        offMergeFeatures();
      } catch {}
      // End an in-progress split via its own cleanup (removes the keydown
      // listener and the snap helper key too — plain removeInteraction
      // leaked both when the split had not received its first click, since
      // OL only fires drawabort for a started sketch) and tell AE.
      try {
        splitCleanupRef.current?.(true);
      } catch {}
      try {
        layers.un?.("add", onLayerAdd);
      } catch {}
      // Clear EDIT_ACTIVE from all features when cleaning up
      // This ensures nodes don't stay visible after Sketch is closed
      for (const [layer] of reg.entries()) {
        try {
          const src = layer.getSource?.();
          if (src) {
            const allFeatures = src.getFeatures?.() || [];
            allFeatures.forEach((f) => {
              if (f.get?.("EDIT_ACTIVE")) {
                f.set("EDIT_ACTIVE", false, true);
              }
            });
          }
        } catch {}
      }
      for (const { cleanup } of reg.values()) {
        try {
          cleanup();
        } catch {}
      }
      try {
        map.un("singleclick", onDeleteClick);
      } catch {}
      reg.clear();
    };
  }, [
    map,
    localObserver,
    activityId,
    modifyEnabled,
    translateEnabled,
    drawModel,
    pluginShown,
    attributeEditorActiveRef,
  ]);

  // Separate effect to trigger layer redraw when measurement settings change
  React.useEffect(() => {
    if (!map) return;

    // Find AttributeEditor layer and trigger redraw
    const layers = map.getLayers?.()?.getArray?.() || [];
    const aeLayer = layers.find((l) => l.get?.("name") === LAYER_NAME);
    if (aeLayer) {
      aeLayer.changed?.();
    }
  }, [map, measurementSettings]);
};

export default useAttributeEditorIntegration;
