import React from "react";
import Select from "ol/interaction/Select";
import Translate from "ol/interaction/Translate";
import Modify from "ol/interaction/Modify";
import { Stroke, Fill, Style, Circle, Text } from "ol/style";
import { altKeyOnly } from "ol/events/condition";
import { fromCircle } from "ol/geom/Polygon";
import MultiPoint from "ol/geom/MultiPoint";
import LineString from "ol/geom/LineString";
import { editBus } from "../../../buses/editBus";

// Layer name for AttributeEditor features
const LAYER_NAME = "attributeeditor";

// Check if a feature matches a given logical ID
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

// Extract coordinates from feature for node highlighting
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
    case "MultiPolygon":
      let coords = [];
      geometry.getCoordinates()[0].forEach((a) => {
        a.forEach((b) => {
          coords.push(b);
        });
      });
      return coords;
    default:
      // Polygon
      return geometry.getCoordinates()[0];
  }
}

// Get polygon perimeter by creating a LineString from the outer ring
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
  props,
  drawModel,
  localObserver,
  activityId,
  modifyEnabled,
  translateEnabled,
  pluginShown,
  attributeEditorActiveRef,
  measurementSettings,
}) => {
  // Track selected feature IDs to restore selection after effect re-runs
  const selectedIdsRef = React.useRef([]);

  React.useEffect(() => {
    if (!map) return;
    const lastPublishRef = { id: null, chan: null };

    // Helper: Canonicalize feature ID
    const toCanonicalId = (idLike) => {
      const rows = props?.model?.getSnapshot?.().features || [];
      const s = String(idLike);

      // 1) exact match of id
      let hit = rows.find((r) => String(r.id) === s);
      if (hit) return hit.id;

      // 2) exact match against @_fid (e.g. fid)
      hit = rows.find((r) => String(r["@_fid"] ?? r.fid ?? "") === s);
      if (hit) return hit.id;

      // 3) suffix match: "...<dot><id>"  -> extract the suffix
      const m = s.match(/\.([^.]+)$/);
      if (m) {
        const tail = m[1];
        hit = rows.find((r) => String(r.id) === String(tail));
        if (hit) return hit.id;
      }

      // fallback (canonical negative draft-id)
      return idLike;
    };

    // Helper: Create node highlight style
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

    // Helper: Calculate measurements for a feature (area, length, perimeter)
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

    // Helper: Format measurement value to readable string
    const formatMeasurement = (measurement) => {
      const measurementSettings = drawModel?.getMeasurementSettings?.() || {};
      const { type, value, prefix } = measurement;

      // Check if this measurement type should be shown
      const showMeasurement =
        (type === "LENGTH" && measurementSettings.showLength) ||
        (type === "AREA" && measurementSettings.showArea) ||
        (type === "PERIMETER" && measurementSettings.showPerimeter);

      if (!showMeasurement) return "";

      const precision = measurementSettings.precision ?? 0;
      const lengthUnit = measurementSettings.lengthUnit || "AUTO";
      const areaUnit = measurementSettings.areaUnit || "AUTO";

      // Determine which unit format to use
      const isLength = type === "LENGTH" || type === "PERIMETER";
      const unitFormat = isLength ? lengthUnit : areaUnit;

      // Format based on unit type
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

    // Helper: Get measurement label text for a feature
    const getMeasurementLabelText = (feature) => {
      const measurementSettings = drawModel?.getMeasurementSettings?.() || {};
      if (!measurementSettings.showText) return "";

      const measurements = getFeatureMeasurements(feature);
      return measurements
        .map((m) => formatMeasurement(m))
        .filter((s) => s.length > 0)
        .join("");
    };

    // Helper: Create Text style for measurement display
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

    // Helper: Publish feature to Sketch/EditView without affecting AE selection
    const publishToEditView = (feature) => {
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

        // Set EDIT_ACTIVE when in EDIT mode (to show nodes)
        // modifyEnabled only controls whether nodes can be MODIFIED, not visibility
        feature.set("EDIT_ACTIVE", activityId === "EDIT", true);
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

    // Helper: Update OL selection based on logical IDs
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

        // Then set EDIT_ACTIVE on the newly selected features
        wanted.forEach((wid) => {
          const f =
            src.getFeatureById?.(wid) ||
            srcFeatures.find((x) => matchesLogicalId(x, wid));
          if (f) {
            // Mark feature for AttributeEditor (ensures layer style function is used)
            markFeatureForAttributeEditor(f);
            // Set EDIT_ACTIVE to show nodes (always in EDIT mode)
            // modifyEnabled controls whether nodes can be MODIFIED (via Modify interaction)
            f.set("EDIT_ACTIVE", activityId === "EDIT", true);
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
            inMove && translate.__allowTranslate && translateEnabled
          );
        } catch {}
        try {
          modify.setActive(inEditWithNodes && modify.__allowModify);
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

      for (const { select } of reg.values()) {
        select?.getFeatures?.().forEach((f) => {
          const id = f.getId?.() ?? f.get?.("@_fid") ?? f.get?.("id");
          const key = String(id);

          if (!seen.has(key)) {
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
        return f || null;
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

      const beforeGeomRef = new Map();

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

          let hit = null;
          map.forEachFeatureAtPixel(
            evt.pixel,
            (f, lyr) => {
              if (lyr === layer && !f.get("KINK_MARKER")) {
                hit = f;
                return true;
              }
              return false;
            },
            { hitTolerance: 6, layerFilter: (lyr) => lyr === layer }
          );
          if (!hit) return false;

          markFeatureForAttributeEditor(hit);

          const raw = hit.get?.("id") ?? hit.get?.("@_fid") ?? hit.getId?.();
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
            // EDIT_ACTIVE controls node VISIBILITY (always show in EDIT mode)
            // modifyEnabled controls whether nodes can be MODIFIED (via Modify interaction)
            hit.set("EDIT_ACTIVE", activityId === "EDIT", true);
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
              // EDIT_ACTIVE controls node VISIBILITY (always show in EDIT mode)
              hit.set("EDIT_ACTIVE", activityId === "EDIT", true);
              fc.push(hit);
            }

            const ids = (fc.getArray ? fc.getArray() : []).map((f) => {
              const id = f.get?.("id") ?? f.get?.("@_fid") ?? f.getId?.();
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
      const onSelect = () => {
        const arr = fc.getArray ? fc.getArray() : [];
        arr.forEach((f) => {
          // Always materialize/refresh style, even if feature already has one
          // This ensures the style reflects the current selection state
          if (f) markFeatureForAttributeEditor(f);
        });
        publishToEditView(arr[0] ?? null);

        const ids = arr.map((f) => {
          const raw = f.get?.("id") ?? f.get?.("@_fid") ?? f.getId?.();
          return toCanonicalId(raw);
        });
        editBus.emit("attrib:select-ids", {
          ids,
          source: "map",
          mode: "replace",
        });
      };

      const onTranslateStart = (e) => {
        const f = e?.features?.item?.(0);
        if (!f) return;
        const raw = f.get?.("id") ?? f.get?.("@_fid") ?? f.getId?.();
        const canon = toCanonicalId(raw);
        const g = f.getGeometry?.();
        beforeGeomRef.set(canon, g && g.clone ? g.clone() : null);
      };

      const onModifyStart = (e) => {
        const f = e?.features?.item?.(0);
        if (!f) return;
        const raw = f.get?.("id") ?? f.get?.("@_fid") ?? f.getId?.();
        const canon = toCanonicalId(raw);
        const g = f.getGeometry?.();
        beforeGeomRef.set(canon, g && g.clone ? g.clone() : null);
      };

      const onTranslateEnd = (e) => {
        const f = e?.features?.item?.(0) ?? null;
        publishToEditView(f);
        if (!f) return;

        const raw = f.get?.("id") ?? f.get?.("@_fid") ?? f.getId?.();
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

        const raw = f.get?.("id") ?? f.get?.("@_fid") ?? f.getId?.();
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
      // (Note: your Select uses condition: () => false, so 'select' won't fire; keep or remove.)
      // sel.on("select", onSelect);

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
          sel.un("select", onSelect);
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
        beforeGeomRef.clear();
      };

      reg.set(layer, { select: sel, translate: tr, modify: mod, cleanup });
      applyEnablement();
    };

    // ============================================================
    // SECTION: Cross-plugin bus subscriptions (AE ↔ Sketch)
    // ============================================================
    const offAttribSelectIds = editBus.on("attrib:select-ids", (ev) => {
      // Sync OL selection with logical ids from UI
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
        const raw = f.get?.("id") ?? f.get?.("@_fid") ?? f.getId?.();
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
        const raw = f.get?.("id") ?? f.get?.("@_fid") ?? f.getId?.();
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
      const { degrees = 0, clockwise = true } = ev.detail || {};
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
        const raw = f.get?.("id") ?? f.get?.("@_fid") ?? f.getId?.();
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

      // AFTER ⇒ geometry-edited (DE-DUPLICERA)
      const when = Date.now();
      const emittedIds = new Set();

      feats.forEach((f) => {
        const raw = f.get?.("id") ?? f.get?.("@_fid") ?? f.getId?.();
        const id = toCanonicalId(raw);

        if (emittedIds.has(id)) return;
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

      const raw = hit.get?.("id") ?? hit.get?.("@_fid") ?? hit.getId?.();
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
        layers.un?.("add", onLayerAdd);
      } catch {}
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
    props,
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
