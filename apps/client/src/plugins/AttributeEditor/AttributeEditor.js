import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";
import AttributeEditorView from "./AttributeEditorView";
import Observer from "react-event-observer";
import BugReportIcon from "@mui/icons-material/BugReport";
import AttributeEditorModel, { Action } from "./AttributeEditorModel";
import { editBus } from "../../buses/editBus";
import { PLUGIN_COLORS } from "./constants/index";
import { createOgcApi } from "./api/ogc";
import { idAliases, getFeatureId } from "./helpers/helpers";
import FeaturePickerDialog from "./components/FeaturePickerDialog";

import GeoJSON from "ol/format/GeoJSON";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Style, Circle as CircleStyle, Fill, Stroke } from "ol/style";
import Overlay from "ol/Overlay";
import DragBox from "ol/interaction/DragBox";
import { platformModifierKeyOnly } from "ol/events/condition";

// Cache size limits to prevent memory leaks
const MAX_SCHEMA_CACHE_SIZE = 50;
const MAX_GRAVEYARD_SIZE = 1000;

/**
 * Manages Map cache with LRU-like eviction (removes oldest entries when limit reached)
 */
function limitMapSize(map, maxSize, removeCount = 10) {
  if (map.size <= maxSize) return;
  const keysToRemove = [];
  for (const key of map.keys()) {
    keysToRemove.push(key);
    if (keysToRemove.length >= removeCount) break;
  }
  keysToRemove.forEach((key) => map.delete(key));
}

const TOOLTIP_EXCLUDE_KEYS = new Set([
  "geometry",
  "USER_DRAWN",
  "DRAW_METHOD",
  "EDIT_ACTIVE",
  "__geom__",
  "__pending",
  "__idx",
  "__ae_style_delegate",
  "TEXT_SETTINGS",
  "@_fid",
  "SKETCH_ATTRIBUTEEDITOR",
]);

/**
 * Safely builds tooltip content using DOM APIs to prevent XSS attacks.
 * All text content is escaped via textContent instead of innerHTML.
 */
function buildTooltipContent(tooltipEl, displayId, displayProps, colors) {
  const { mutedColor, textColor } = colors;

  // Clear existing content safely
  while (tooltipEl.firstChild) {
    tooltipEl.removeChild(tooltipEl.firstChild);
  }

  // Create ID header
  const idDiv = document.createElement("div");
  idDiv.style.cssText =
    "font-weight: 600; color: #FFD700; margin-bottom: 6px; font-size: 14px;";
  idDiv.textContent = `ID: ${displayId}`;
  tooltipEl.appendChild(idDiv);

  if (displayProps.length === 0) {
    // No attributes message
    idDiv.style.marginBottom = "0";
    const emptyDiv = document.createElement("div");
    emptyDiv.style.cssText = `font-size: 11px; color: ${mutedColor}; font-style: italic; margin-top: 4px;`;
    emptyDiv.textContent = "Inga attribut att visa";
    tooltipEl.appendChild(emptyDiv);
  } else {
    // Build property rows
    displayProps.forEach(({ key, value }) => {
      const rowDiv = document.createElement("div");
      rowDiv.style.cssText = "font-size: 12px; margin-bottom: 2px;";

      const keySpan = document.createElement("span");
      keySpan.style.cssText = `color: ${mutedColor}; font-weight: 500;`;
      keySpan.textContent = `${key}:`;

      const valueSpan = document.createElement("span");
      valueSpan.style.cssText = `color: ${textColor}; margin-left: 4px;`;
      valueSpan.textContent = String(value ?? "");

      rowDiv.appendChild(keySpan);
      rowDiv.appendChild(valueSpan);
      tooltipEl.appendChild(rowDiv);
    });
  }
}

// Helper: Find Sketch layer by name
function getSketchLayer(map) {
  const layers = map?.getLayers?.()?.getArray?.() || [];
  return layers.find((lyr) => lyr?.get?.("name") === "pluginSketch") || null;
}

// Helper: Build set with both numeric and string versions of IDs
function buildVizSet(logicalIds) {
  const set = new Set();
  logicalIds.forEach((x) => {
    set.add(x);
    set.add(String(x));
  });
  return set;
}

// Helper: Convert idLike to canonical id using a pre-built Map (O(1))
function toCanonicalId(idLike, idMap) {
  return idMap.get(String(idLike)) ?? idLike;
}

function AttributeEditor(props) {
  const programmaticSketchOpsRef = React.useRef(new WeakSet());
  const [fieldMetaLocal, setFieldMetaLocal] = React.useState([]);
  const vectorLayerRef = React.useRef(null);
  const apiBase =
    props.app?.config?.appConfig?.mapserviceBase ??
    props.app?.config?.appConfig?.mapservicebase;
  const ogc = React.useMemo(() => createOgcApi(apiBase), [apiBase]);
  const [ui, setUi] = React.useState({
    title: "Attributredigerare",
    color: "4a90e2",
    mode: "table", // "table" | "form"
    dark: false,
  });

  const DEFAULT_TITLE = "Attributredigerare";
  const [pluginSettings, setPluginSettings] = React.useState({
    title: DEFAULT_TITLE,
    color: PLUGIN_COLORS.default,
  });

  const [localObserver] = React.useState(Observer());

  const modelRef = React.useRef(null);
  if (!modelRef.current) {
    modelRef.current = new AttributeEditorModel({
      localObserver,
      app: props.app,
      map: props.map,
      ogc,
      initialFeatures: [],
      fieldMeta: [],
    });
  }
  const model = modelRef.current;

  const schemaCache = React.useRef(new Map());

  const modelState = React.useSyncExternalStore(
    model.subscribe,
    model.getSnapshot,
    model.getSnapshot
  );

  const visibleIdsRef = React.useRef(new Set());
  const selectedIdsRef = React.useRef(new Set());
  const onlyFilteredRef = React.useRef(false);
  const deletedIdsRef = React.useRef(new Set());
  const pendingEditsRef = React.useRef({});
  const pendingAddsRef = React.useRef([]);
  const pendingAddIdsSetRef = React.useRef(new Set());
  const pendingDeletedDraftIdsSetRef = React.useRef(new Set());
  const rowIdMapRef = React.useRef(new Map());
  const featureIndexRef = React.useRef(new Map());
  const featureAliasesRef = React.useRef(new Map()); // Pre-computed aliases for O(1) lookup in styleFn
  const graveyardRef = React.useRef(new Map());
  const focusedIdRef = React.useRef(null);
  const draftBaselineRef = React.useRef(new Map());

  const currentServiceIdRef = React.useRef("NONE_ID");
  const [serviceList, setServiceList] = React.useState([]);

  // Keep rowIdMapRef in sync with features for O(1) toCanonicalId lookups
  React.useEffect(() => {
    const features = modelState.features || [];
    const map = new Map();
    for (const row of features) {
      map.set(String(row.id), row.id);
    }
    rowIdMapRef.current = map;
  }, [modelState.features]);

  const hoveredIdRef = React.useRef(null);
  const tooltipOverlayRef = React.useRef(null);
  const tooltipElementRef = React.useRef(null);

  const [featurePicker, setFeaturePicker] = React.useState({
    open: false,
    features: [],
  });

  const styles = React.useMemo(() => {
    const baseStroke = new Stroke({ color: "#1976d2", width: 2 });
    const baseFill = new Fill({ color: "rgba(25, 118, 210, 0.73)" });

    return {
      // DEFAULT: Unselected normal feature (original)
      visible: new Style({
        image: new CircleStyle({
          radius: 6,
          fill: baseFill,
          stroke: new Stroke({ color: "#1024feff", width: 2 }),
        }),
        stroke: baseStroke,
        fill: baseFill,
        zIndex: 2,
      }),

      // SELECTED NORMAL: Orange solid (original)
      visibleSelected: new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: "#ff9800" }),
          stroke: new Stroke({ color: "#000000ff", width: 2 }),
        }),
        stroke: new Stroke({ color: "#ff9800", width: 3 }),
        fill: new Fill({ color: "rgba(255,152,0,0.12)" }),
        zIndex: 3,
      }),

      // SELECTED: Orange (kept for backward compatibility)
      selected: new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: "#ff9800" }),
          stroke: new Stroke({ color: "#000000ff", width: 2 }),
        }),
        stroke: new Stroke({ color: "#ff9800", width: 3 }),
        fill: new Fill({ color: "rgba(255,152,0,0.12)" }),
        zIndex: 3,
      }),

      // DELETION: Unselected - red dashed (original)
      toDelete: new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: "rgba(229, 56, 53, 0.5)" }),
          stroke: new Stroke({ color: "#e53935", width: 3, lineDash: [5, 5] }),
        }),
        stroke: new Stroke({ color: "#e53935", width: 3, lineDash: [5, 5] }),
        fill: new Fill({ color: "rgba(229, 56, 53, 0.5)" }),
        zIndex: 5,
      }),

      // DELETION + SELECTED: Orange dashed
      toDeleteSelected: new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: "#ff9800" }),
          stroke: new Stroke({
            color: "#000000ff",
            width: 2,
            lineDash: [5, 5],
          }),
        }),
        stroke: new Stroke({ color: "#ff9800", width: 3, lineDash: [5, 5] }),
        fill: new Fill({ color: "rgba(255,152,0,0.12)" }),
        zIndex: 5,
      }),

      // NEW DRAFT: Unselected - green dashed
      draft: new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: "rgba(99, 251, 173, 0.8)" }), // Light green
          stroke: new Stroke({ color: "#059669", width: 2, lineDash: [5, 5] }),
        }),
        stroke: new Stroke({ color: "#059669", width: 3, lineDash: [5, 5] }),
        fill: new Fill({ color: "rgba(144, 253, 197, 0.71)" }),
        zIndex: 4,
      }),

      // NEW DRAFT + SELECTED: Orange dashed
      draftSelected: new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: "#ff9800" }),
          stroke: new Stroke({
            color: "#000000ff",
            width: 2,
            lineDash: [5, 5],
          }),
        }),
        stroke: new Stroke({ color: "#ff9800", width: 3, lineDash: [5, 5] }),
        fill: new Fill({ color: "rgba(255,152,0,0.12)" }),
        zIndex: 5,
      }),

      // EDITED: Unselected - yellow dashed
      edited: new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: "#ffe992ff" }), // Light yellow
          stroke: new Stroke({
            color: "#e45c08ff",
            width: 2,
            lineDash: [5, 5],
          }),
        }),
        stroke: new Stroke({ color: "#e45c08ff", width: 3, lineDash: [5, 5] }),
        fill: new Fill({ color: "#ffe992ff" }),
        zIndex: 4,
      }),

      // EDITED + SELECTED: Orange dashed
      editedSelected: new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: "#ff9800" }),
          stroke: new Stroke({
            color: "#000000ff",
            width: 2,
            lineDash: [5, 5],
          }),
        }),
        stroke: new Stroke({ color: "#ff9800", width: 3, lineDash: [5, 5] }),
        fill: new Fill({ color: "rgba(255,152,0,0.12)" }),
        zIndex: 5,
      }),

      // DIMMED (original)
      dimmed: new Style({
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({ color: "rgba(0,0,0,0.06)" }),
        }),
        stroke: new Stroke({ color: "rgba(0,0,0,0.25)", width: 1 }),
        fill: new Fill({ color: "rgba(255, 5, 5, 0.04)" }),
        zIndex: 1,
      }),

      // HOVERED
      hovered: new Style({
        image: new CircleStyle({
          radius: 8,
          fill: new Fill({ color: "rgba(255, 215, 0, 0.6)" }), // Gold
          stroke: new Stroke({
            color: "#FFD700",
            width: 3,
            lineDash: [8, 4],
          }),
        }),
        stroke: new Stroke({
          color: "#FFD700",
          width: 4,
          lineDash: [8, 4],
        }),
        fill: new Fill({ color: "rgba(255, 215, 0, 0.15)" }),
        zIndex: 999, // Above all else (except selected)
      }),
    };
  }, []);

  const styleFn = React.useCallback(
    (feature) => {
      const raw = getFeatureId(feature);
      // O(1) lookup from pre-computed cache instead of computing aliases every render
      const aliases = featureAliasesRef.current.get(raw) || idAliases(raw);

      const sel = selectedIdsRef.current;
      const vis = visibleIdsRef.current;
      const del = deletedIdsRef.current;
      const edits = pendingEditsRef.current;
      const hov = hoveredIdRef.current;
      // Use pre-computed Sets for O(1) lookups instead of O(n) array scans
      const addIds = pendingAddIdsSetRef.current;
      const deletedDraftIds = pendingDeletedDraftIdsSetRef.current;

      const isSelected = aliases.some((k) => sel.has(k));
      const isVisible = aliases.some((k) => vis.has(k));
      const isDeleted = aliases.some((k) => del.has(k));
      const isHovered =
        hov != null &&
        aliases.some((k) => k === hov || String(k) === String(hov));

      const hasEdits = aliases.some(
        (k) => edits[k] && Object.keys(edits[k]).length > 0
      );

      // P1 Optimization: O(1) Set.has() instead of O(n) Array.some()
      const isDraft = aliases.some((k) => {
        const numId = typeof k === "number" ? k : Number(k);
        return (Number.isFinite(numId) && numId < 0) || addIds.has(k);
      });

      // P1 Optimization: O(1) Set.has() instead of O(n) Array.some()
      const isDraftDeleted =
        isDraft && aliases.some((k) => deletedDraftIds.has(k));

      if (!isVisible && !isSelected && !isHovered) return null;

      // Hover has highest priority (if not selected)
      if (isHovered && !isSelected) {
        return styles.hovered;
      }

      // Determine category (priority order)
      let category = "visible";
      if (isDeleted || isDraftDeleted) category = "toDelete";
      else if (isDraft) category = "draft";
      else if (hasEdits) category = "edited";

      return isSelected ? styles[category + "Selected"] : styles[category];
    },
    [styles]
  );

  const handleRowHover = React.useCallback(
    (id, showTooltip = false) => {
      hoveredIdRef.current = id;
      vectorLayerRef?.current?.changed?.();

      if (!showTooltip) return;

      const feature = featureIndexRef.current.get(id);
      const overlay = tooltipOverlayRef.current;
      const tooltipEl = tooltipElementRef.current;

      if (feature && overlay && tooltipEl) {
        const geom = feature.getGeometry();
        if (geom) {
          let coord;
          const geomType = geom.getType();

          if (geomType === "Point") {
            coord = geom.getCoordinates();
          } else if (geomType === "LineString") {
            const coords = geom.getCoordinates();
            coord = coords[Math.floor(coords.length / 2)];
          } else if (geomType === "Polygon" || geomType === "MultiPolygon") {
            const extent = geom.getExtent();
            coord = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
          }

          if (coord) {
            const props = feature.getProperties();

            const displayProps = [];

            Object.entries(props).forEach(([key, value]) => {
              if (
                TOOLTIP_EXCLUDE_KEYS.has(key) ||
                key.startsWith("_") ||
                key.startsWith("__") ||
                value == null ||
                value === "" ||
                (typeof value === "object" && value !== null)
              ) {
                return;
              }

              if (displayProps.length < 5) {
                displayProps.push({ key, value });
              }
            });

            const isDark = ui.dark;
            const bgColor = isDark ? "#1e293b" : "white";
            const textColor = isDark ? "#e5e7eb" : "#111827";
            const mutedColor = isDark ? "#9ca3af" : "#6b7280";

            // Build tooltip content safely (XSS-protected)
            buildTooltipContent(tooltipEl, props.id || id, displayProps, {
              mutedColor,
              textColor,
            });

            tooltipEl.style.background = bgColor;
            tooltipEl.style.color = textColor;

            overlay.setPosition(coord);
            tooltipEl.style.display = "block";
          }
        }
      }
    },
    [ui.dark]
  );

  const handleRowLeave = React.useCallback(() => {
    hoveredIdRef.current = null;
    vectorLayerRef?.current?.changed?.();

    const tooltipEl = tooltipElementRef.current;
    if (tooltipEl) {
      tooltipEl.style.display = "none";
    }
  }, []);

  React.useEffect(() => {
    const active = props.options?.activeServices ?? [];
    if (!active.length) {
      setServiceList([]);
      return;
    }

    const abortController = new AbortController();
    const signal = abortController.signal;

    (async () => {
      try {
        // Fetch list with abort signal
        const list = await ogc.fetchWfstList(
          "id,uuid,caption,title,name,projection,layers",
          { signal }
        );

        // Check if aborted after first async operation
        if (signal.aborted) return;

        const allArr = Array.isArray(list) ? list : (list?.layers ?? []);
        const ids = active.map((x) => x.id).filter(Boolean);

        // Fetch all metadata with same signal
        const items = await Promise.all(
          ids.map(async (id) => {
            try {
              const meta = await ogc.fetchWfstMeta(id, { signal });

              // Check abort after each meta fetch
              if (signal.aborted) return null;

              const title =
                meta?.caption?.trim?.() ||
                meta?.title?.trim?.() ||
                meta?.name?.trim?.() ||
                (allArr.find((x) => (x.id ?? x.uuid) === id)?.caption ?? "")
                  .toString()
                  .trim() ||
                id;
              return {
                id,
                title,
                projection: meta?.projection,
                layers: meta?.layers || [],
              };
            } catch (err) {
              // If aborted, return null immediately
              if (signal.aborted) return null;

              // Otherwise fallback to list data
              const m = allArr.find((x) => (x.id ?? x.uuid) === id);
              return {
                id,
                title: (m?.caption || m?.title || m?.name || id)?.toString(),
                projection: m?.projection,
                layers: m?.layers || [],
              };
            }
          })
        );

        // Final abort check before setting state
        if (signal.aborted) return;

        setServiceList(items.filter(Boolean));
      } catch (e) {
        // Ignore abort errors
        if (e.name === "AbortError") return;

        if (!signal.aborted) {
          console.warn("Kunde inte läsa serviceList:", e);
          setServiceList([]);
        }
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [ogc, props.options?.activeServices]);

  React.useEffect(() => {
    // Track current async operation to prevent race conditions
    let currentAbortController = null;

    const offSel = editBus.on("edit:service-selected", async (ev) => {
      const { title, color, source, id } = ev.detail || {};
      if (source === "attrib") return;

      // Cancel any previous operation that's still running
      if (currentAbortController) {
        currentAbortController.abort();
      }

      // Create new AbortController for this operation
      currentAbortController = new AbortController();
      const signal = currentAbortController.signal;

      currentServiceIdRef.current = id || "NONE_ID";

      setPluginSettings((u) => ({
        ...u,
        title: title ?? u.title,
        color: color ?? u.color,
      }));

      // Initialize model to empty state and free memory from previous layer
      model.dispatch({ type: Action.INIT, features: [] });
      setFieldMetaLocal([]);
      model.setFieldMetadata([]);
      model.clearFeatureCollection?.();

      try {
        // Check if operation was aborted before starting
        if (signal.aborted) return;

        // 1) Fetch whole schema (no fields-param)
        let schema = schemaCache.current.get(id);
        if (!schema) {
          schema = await ogc.fetchWfst(id);

          // Check if aborted after async operation
          if (signal.aborted) return;

          schemaCache.current.set(id, schema);
          // Prevent unbounded cache growth
          limitMapSize(schemaCache.current, MAX_SCHEMA_CACHE_SIZE);
        }

        // Always emit schema-loaded, even if schema was cached
        // This ensures other plugins (like Sketch) get notified when switching services
        editBus.emit("attrib:schema-loaded", {
          schema: schema,
          serviceId: id,
        });

        // Check before continuing
        if (signal.aborted) return;

        const geomKey = String(
          schema?.geometryField || "geometry"
        ).toLowerCase();

        // 2) Create FM from editableFields (schema winner)
        const fmEditable = (schema?.editableFields || [])
          .filter((f) => !f.hidden && String(f.name).toLowerCase() !== geomKey)
          .map((f, i) => {
            const tt = String(f.textType || "")
              .trim()
              .toLowerCase();
            const dt = String(f.dataType || "")
              .trim()
              .toLowerCase();
            const multiple =
              tt === "flerval" || f.multiple === true || f.multiple === "true";

            let type;
            if (Array.isArray(f.values) && f.values.length) {
              type = multiple ? "multiselect" : "select";
            } else if (tt === "lista") {
              type = "select";
            } else if (dt.includes("bool")) {
              type = "boolean";
            } else if (dt === "int" || dt === "integer" || dt.includes("int")) {
              type = "integer";
            } else if (
              dt === "number" ||
              dt === "numeric" ||
              dt === "decimal" ||
              dt.includes("decim") ||
              dt.includes("float") ||
              dt.includes("double") ||
              dt.includes("real")
            ) {
              type = "number";
            } else if (dt === "date") {
              type = "date";
            } else if (
              dt === "datetime" ||
              dt === "timestamp" ||
              dt === "timestamptz" ||
              dt.includes("time")
            ) {
              type = "datetime";
            } else {
              type = "text";
            }

            return {
              key: f.name,
              label: f.alias || f.name,
              description: f.description,
              readOnly: false,
              type,
              options: Array.isArray(f.values) ? f.values : undefined,
              multiple,
              step: type === "integer" ? 1 : undefined,
              initialWidth: i === 0 ? 120 : 220,
            };
          });

        // 3) Add nonEditableFields as read-only (excluding geometry)
        const roFromSchema = (schema?.nonEditableFields || [])
          .filter((f) => !f.hidden && String(f.name).toLowerCase() !== geomKey)
          .map((f, i) => {
            const dt = String(f.dataType || "")
              .trim()
              .toLowerCase();
            let type = "text";
            if (dt.includes("int")) type = "integer";
            else if (
              dt === "number" ||
              dt === "numeric" ||
              dt === "decimal" ||
              dt.includes("decim") ||
              dt.includes("float") ||
              dt.includes("double") ||
              dt.includes("real")
            )
              type = "number";
            else if (dt === "date") type = "date";
            else if (
              dt === "datetime" ||
              dt === "timestamp" ||
              dt === "timestamptz" ||
              dt.includes("time")
            )
              type = "datetime";

            return {
              key: f.name,
              label: f.alias || f.name,
              readOnly: true,
              type,
              initialWidth: i === 0 ? 120 : 220,
            };
          });

        // 4) Merge read-only and editable fields (editable takes precedence in case of a conflict)
        const byKey = new Map();
        roFromSchema.forEach((m) => byKey.set(m.key, m));
        fmEditable.forEach((m) => byKey.set(m.key, m));
        let fmMerged = Array.from(byKey.values());

        // 5) Ensure that ID is always above as a RO
        function ensureRo(key, label = key, width = 90) {
          if (!fmMerged.some((m) => m.key === key)) {
            fmMerged.unshift({
              key,
              label,
              readOnly: true,
              type: "text",
              initialWidth: width,
            });
          } else {
            // if the field is found but not read-only – make it read-only and move it up
            fmMerged = fmMerged.map((m) =>
              m.key === key ? { ...m, readOnly: true } : m
            );
            // move upwards
            const idx = fmMerged.findIndex((m) => m.key === key);
            if (idx > 0) {
              const [idCol] = fmMerged.splice(idx, 1);
              fmMerged.unshift(idCol);
            }
          }
        }
        ensureRo("id", "ID", 90);

        // Check before state updates
        if (signal.aborted) return;

        // 6) Set FM (state + model) - trigger render in View
        setFieldMetaLocal(fmMerged);
        model.setFieldMetadata(fmMerged);

        // Check before loading data
        if (signal.aborted) return;

        // 7) Load data (once FM is set) - pass signal to allow cancellation
        const { featureCollection } =
          (await model.loadFromService?.(id, {}, { signal })) || {};

        // Check before OpenLayers operations
        if (signal.aborted) return;

        // 8) Set up the vector layer
        const map = props.map;
        const mapProj = map.getView().getProjection();
        const dataProj = mapProj.getCode();

        if (vectorLayerRef.current) {
          map.removeLayer(vectorLayerRef.current);
          vectorLayerRef.current = null;
        }

        const fmt = new GeoJSON();
        const features = featureCollection
          ? fmt.readFeatures(featureCollection, {
              dataProjection: dataProj,
              featureProjection: mapProj,
            })
          : [];

        // Reset index and visibility set
        featureIndexRef.current.clear();
        featureAliasesRef.current.clear();
        visibleIdsRef.current = new Set();

        // Index all features and make them visible initially (both num & str)
        // Pre-compute aliases once here for O(1) lookup in styleFn
        features.forEach((f) => {
          const raw = getFeatureId(f);
          const aliases = idAliases(raw);

          // Store pre-computed aliases for this feature (keyed by raw id)
          featureAliasesRef.current.set(raw, aliases);

          for (const k of aliases) {
            featureIndexRef.current.set(k, f);
            visibleIdsRef.current.add(k);
            visibleIdsRef.current.add(String(k));
          }
        });

        // Set OL-ID to @_fid if it exists (for safer hit testing etc.)
        features.forEach((f) => {
          const fidProp = f.get?.("@_fid");
          if (fidProp) {
            try {
              f.setId?.(fidProp);
            } catch {}
          }
        });

        const src = new VectorSource({ features });
        const lyr = new VectorLayer({
          source: src,
          style: new Style({
            image: new CircleStyle({
              radius: 6,
              fill: new Fill({ color: "#1976d2" }),
              stroke: new Stroke({ color: "#fff", width: 2 }),
            }),
            stroke: new Stroke({ color: "#1976d2", width: 2 }),
            fill: new Fill({ color: "rgba(25,118,210,0.1)" }),
          }),
        });
        lyr.setStyle(styleFn);
        lyr.set("name", "attributeeditor");
        editBus.emit("sketch.attachExternalLayer", {
          layer: lyr,
          allow: { select: true, translate: true, modify: true },
        });
        map.addLayer(lyr);
        vectorLayerRef.current = lyr;
      } catch (e) {
        // Ignore abort errors - these are expected when user switches services quickly
        if (e.name === "AbortError" || signal.aborted) {
          console.log("Service loading aborted (user switched services)");
          return;
        }

        // Log actual errors
        console.warn("Fel vid laddning av schema/data:", e);
      }
    });

    const offClr = editBus.on("edit:service-cleared", (ev) => {
      const { source } = ev.detail || {};
      if (source === "attrib") return;

      // Cancel any ongoing operation
      if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
      }

      currentServiceIdRef.current = "NONE_ID";

      setPluginSettings((u) => ({
        ...u,
        title: DEFAULT_TITLE,
        color: PLUGIN_COLORS.default,
      }));

      model.dispatch({ type: Action.INIT, features: [] });
      setFieldMetaLocal([]);
      model.setFieldMetadata([]);
      model.clearFeatureCollection?.();

      if (vectorLayerRef.current) {
        props.map.removeLayer(vectorLayerRef.current);
        vectorLayerRef.current = null;
      }

      schemaCache.current.clear();
    });

    return () => {
      // Cleanup on unmount
      // 1. Abort any ongoing async operation
      if (currentAbortController) {
        currentAbortController.abort();
      }

      // 2. Remove event listeners (EventBus handles this automatically)
      offSel();
      offClr();
    };
  }, [model, props.map, setPluginSettings, styleFn, ogc]);

  React.useEffect(() => {
    const map = props.map;
    if (!map) return;

    // Create the tooltip element
    const tooltipEl = document.createElement("div");
    tooltipEl.style.cssText = `
    position: absolute;
    background: white;
    border: 2px solid #FFD700;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 13px;
    font-family: 'Inter', system-ui, sans-serif;
    pointer-events: none;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 1000;
    display: none;
  `;
    tooltipElementRef.current = tooltipEl;

    const overlay = new Overlay({
      element: tooltipEl,
      positioning: "center-left",
      offset: [15, 0],
      stopEvent: false,
    });

    map.addOverlay(overlay);
    tooltipOverlayRef.current = overlay;

    return () => {
      map.removeOverlay(overlay);
      tooltipElementRef.current = null;
      tooltipOverlayRef.current = null;
    };
  }, [props.map]);

  React.useEffect(() => {
    const map = props.map;
    if (!map) return;

    let unbindSrc = () => {};
    let unbindLayerHook = () => {};

    const wireToCurrentSketchLayer = () => {
      try {
        unbindSrc();
      } catch {}
      try {
        unbindLayerHook();
      } catch {}

      const sketchLayer = getSketchLayer(map);
      if (!sketchLayer) return;

      const src = sketchLayer.getSource?.();
      if (!src) return;

      // If the layer changes later → rewire again
      const onChangeSource = () => {
        try {
          unbindSrc();
        } catch {}
        wireToCurrentSketchLayer();
      };
      sketchLayer.on?.("change:source", onChangeSource);
      unbindLayerHook = () => {
        try {
          sketchLayer.un?.("change:source", onChangeSource);
        } catch {}
      };

      // --- handlers ---
      const onAdd = (e) => {
        const f = e.feature;
        if (!f) return;

        if (programmaticSketchOpsRef.current.has(e.feature)) {
          programmaticSketchOpsRef.current.delete(e.feature);
          return;
        }

        // Only sync features explicitly marked for AttributeEditor from Sketch
        // This opt-in approach prevents accidental syncing of features from other plugins
        if (f.get?.("SKETCH_ATTRIBUTEEDITOR") !== true) {
          return;
        }

        if (
          !currentServiceIdRef.current ||
          currentServiceIdRef.current === "NONE_ID"
        ) {
          return;
        }

        let incomingId = f.getId?.() ?? f.get?.("id");
        if (incomingId != null && featureIndexRef.current.has(incomingId)) {
          try {
            f.setId?.(undefined);
          } catch {}
          try {
            f.unset?.("id", true);
          } catch {}
          incomingId = undefined;
        }

        // Reset Sketch's style so AE's styleFn can take over
        try {
          f.setStyle(null);
          // Unset Sketch's flag indicating that the feature's style is being controlled by Attribute Editor
          f.unset?.("__ae_style_delegate", true);
        } catch {}

        // create draft with negative id
        const tempId = model.addDraftFromFeature(f);
        f.setId?.(tempId);
        try {
          f.set?.("id", tempId, true);
        } catch {}

        // Capture baseline immediately when draft is created
        const baseline = {};
        fieldMetaLocal.forEach(({ key }) => {
          const val = f.get?.(key);
          baseline[key] = val == null ? "" : val;
        });
        draftBaselineRef.current.set(tempId, baseline);

        featureIndexRef.current.set(tempId, f);
        // Pre-compute aliases for the new draft feature
        featureAliasesRef.current.set(tempId, idAliases(tempId));
        graveyardRef.current.delete(tempId);

        // Remove from Sketch layer and add to AE layer
        try {
          // Remove from Sketch layer
          programmaticSketchOpsRef.current.add(f);
          src.removeFeature(f);

          // Add to AE layer
          const aeLayer = vectorLayerRef.current;
          const aeSrc = aeLayer?.getSource?.();
          if (aeSrc) {
            programmaticSketchOpsRef.current.add(f);
            aeSrc.addFeature(f);
          }
        } catch (err) {
          console.warn("Kunde inte flytta feature mellan lager:", err);
        }

        selectedIdsRef.current = new Set([tempId]);
        visibleIdsRef.current.add(tempId);

        vectorLayerRef.current?.changed?.();

        // Emit select-ids to sync table selection state with map selection
        editBus.emit("attrib:select-ids", {
          ids: [tempId],
          source: "map",
          mode: "replace",
        });
        editBus.emit("attrib:focus-id", { id: tempId, source: "map" });
      };

      const onRemove = (e) => {
        const f = e.feature;
        if (!f) return;

        if (programmaticSketchOpsRef.current.has(e.feature)) {
          programmaticSketchOpsRef.current.delete(e.feature);
          return;
        }

        if (programmaticSketchOpsRef.current.has(f)) {
          programmaticSketchOpsRef.current.delete(f);
          return;
        }

        // Find id
        let fid = f.getId?.() ?? f.get?.("id");
        if (fid == null) {
          for (const [k, v] of featureIndexRef.current.entries()) {
            if (v === f) {
              fid = k;
              break;
            }
          }
          if (fid == null) return;
        }

        graveyardRef.current.set(fid, f);
        limitMapSize(graveyardRef.current, MAX_GRAVEYARD_SIZE);
        featureIndexRef.current.delete(fid);
        featureAliasesRef.current.delete(fid);
        selectedIdsRef.current.delete(fid);
        visibleIdsRef.current.delete(fid);

        model.dispatch({
          type: Action.SET_DELETE_STATE,
          ids: [fid],
          mode: "mark",
        });

        if (focusedIdRef?.current === fid) {
          editBus.emit("attrib:focus-id", { id: null });
        }

        vectorLayerRef.current?.changed?.();
      };

      // bind
      src.on("addfeature", onAdd);
      src.on("removefeature", onRemove);

      unbindSrc = () => {
        try {
          src.un("addfeature", onAdd);
        } catch {}
        try {
          src.un("removefeature", onRemove);
        } catch {}
      };
    };

    // initial wiring
    wireToCurrentSketchLayer();

    // rewire when a layer is added or removed
    const layers = map.getLayers();
    const onLayerAdd = () => wireToCurrentSketchLayer();
    const onLayerRemove = () => wireToCurrentSketchLayer();
    layers.on("add", onLayerAdd);
    layers.on("remove", onLayerRemove);

    return () => {
      try {
        layers.un("add", onLayerAdd);
      } catch {}
      try {
        layers.un("remove", onLayerRemove);
      } catch {}
      try {
        unbindSrc();
      } catch {}
      try {
        unbindLayerHook();
      } catch {}
    };
  }, [props.map, model, vectorLayerRef, fieldMetaLocal]);

  React.useEffect(() => {
    return model.subscribe(() => {
      const st = model.getSnapshot?.() || {};
      const del =
        st.pendingDeletes instanceof Set ? st.pendingDeletes : new Set();
      deletedIdsRef.current = new Set(del);
      pendingEditsRef.current = st.pendingEdits || {};
      pendingAddsRef.current = st.pendingAdds || [];

      // Build Sets for O(1) lookups in styleFn
      const adds = st.pendingAdds || [];
      const addIdsSet = new Set();
      const deletedDraftIdsSet = new Set();
      for (const d of adds) {
        addIdsSet.add(d.id);
        addIdsSet.add(String(d.id));
        if (d.__pending === "delete") {
          deletedDraftIdsSet.add(d.id);
          deletedDraftIdsSet.add(String(d.id));
        }
      }
      pendingAddIdsSetRef.current = addIdsSet;
      pendingDeletedDraftIdsSetRef.current = deletedDraftIdsSet;

      vectorLayerRef.current?.changed?.();
    });
  }, [model, vectorLayerRef]);

  // --- BACK-SYNC: AttributeEditor -> Sketch layer -----------------------------
  React.useEffect(() => {
    // We need to keep track of the previous state to get the diff
    // (pendingAdds = drafts with negative id, __pending: 'add'|'delete')
    const prevRef = { current: null };
    return model.subscribe(() => {
      const prev = prevRef.current;
      const next = model.getSnapshot();
      prevRef.current = next;
      if (!prev) return;

      const sketchLayer = getSketchLayer(props.map);
      const src = sketchLayer?.getSource?.();
      if (!src) return;

      // Helper
      const getDraftMap = (st) => new Map(st.pendingAdds.map((d) => [d.id, d]));
      const prevDrafts = getDraftMap(prev);
      const nextDrafts = getDraftMap(next);

      // 1) Drafts that are removed completely (REMOVE_DRAFTS, or UNDO of an add)
      //    -> remove feature from Sketch layer if it exists
      for (const [id] of prevDrafts) {
        if (!nextDrafts.has(id)) {
          const f = featureIndexRef.current.get(id);
          if (f) {
            try {
              // PROG-GUARD: mark this remove as programmatic so onRemove ignores it
              programmaticSketchOpsRef.current.add(f);
              src.removeFeature(f);
            } catch {}
            featureIndexRef.current.delete(id);
            featureAliasesRef.current.delete(id);
            graveyardRef.current.set(id, f);
            limitMapSize(graveyardRef.current, MAX_GRAVEYARD_SIZE);
          }
        }
      }

      // 2) Drafts that are marked for deletion (toggle/mark) -> remove from the map
      for (const [id, draftNext] of nextDrafts) {
        const was = prevDrafts.get(id)?.__pending;
        const now = draftNext.__pending;
        if (was !== "delete" && now === "delete") {
          const f = featureIndexRef.current.get(id);
          if (f) {
            try {
              // PROG-GUARD: programmatic remove to avoid re-dispatch in onRemove
              programmaticSketchOpsRef.current.add(f);
              src.removeFeature(f);
            } catch {}
            featureIndexRef.current.delete(id);
            featureAliasesRef.current.delete(id);
            graveyardRef.current.set(id, f);
            limitMapSize(graveyardRef.current, MAX_GRAVEYARD_SIZE);
          }
        }
      }

      // 3) Drafts that are unmarked for deletion (unmark/undo) -> put back in the map
      for (const [id, draftNext] of nextDrafts) {
        const was = prevDrafts.get(id)?.__pending;
        const now = draftNext.__pending;
        if (was === "delete" && now !== "delete") {
          const f = graveyardRef.current.get(id);
          if (f) {
            try {
              // PROG-GUARD: programmatic add to avoid re-dispatch in onAdd
              programmaticSketchOpsRef.current.add(f);
              src.addFeature(f);
            } catch {}
            featureIndexRef.current.set(id, f);
            featureAliasesRef.current.set(id, idAliases(id));
            graveyardRef.current.delete(id);
          }
        }
      }

      // 4) Commit: negative IDs disappear and become real features in the model.
      //    We want to ensure that corresponding temporary (Sketch) features are removed from the map.
      //    What we detect here is: all negative IDs that existed before but are not present now
      //    (and are not in the next drafts) -> remove from the map.
      const prevNegIds = prev.pendingAdds
        .map((d) => d.id)
        .filter((id) => id < 0);
      const nextNegSet = new Set(
        next.pendingAdds.map((d) => d.id).filter((id) => id < 0)
      );
      prevNegIds.forEach((id) => {
        if (!nextNegSet.has(id)) {
          const f = featureIndexRef.current.get(id);
          if (f) {
            try {
              // PROG-GUARD: programmatic remove to avoid onRemove loop
              programmaticSketchOpsRef.current.add(f);
              src.removeFeature(f);
            } catch {}
            featureIndexRef.current.delete(id);
            featureAliasesRef.current.delete(id);
          }
        }
      });
    });
  }, [props.map, model]);

  React.useEffect(() => {
    const map = props.map;
    if (!map) return;

    // Helper: Get current logical ids
    // Use rowIdMapRef for O(1) lookups
    const getCurrentLogical = () => {
      const idMap = rowIdMapRef.current;
      const current = selectedIdsRef.current || new Set();
      const uniqStr = new Set(Array.from(current).map(String));
      const canon = new Set(
        Array.from(uniqStr).map((id) => toCanonicalId(id, idMap))
      );
      return canon;
    };

    const onClick = (evt) => {
      if (evt.dragging) return;
      if (evt.originalEvent?.detail >= 2) return;
      if (evt.originalEvent?.button !== 0) return;
      // Skip if Alt key is pressed (reserved for Modify interaction's deleteCondition)
      if (evt.originalEvent?.altKey) return;

      handleRowLeave();

      const layer = vectorLayerRef.current;
      if (!layer) return;

      // Collect all features
      const hits = [];
      map.forEachFeatureAtPixel(
        evt.pixel,
        (f, lyr) => {
          if (lyr === layer) {
            hits.push(f);
          }
        },
        { layerFilter: (lyr) => lyr === layer, hitTolerance: 3 }
      );

      // No hits → clear selection
      if (hits.length === 0) {
        if (selectedIdsRef.current.size) {
          selectedIdsRef.current = new Set();
          vectorLayerRef.current?.changed?.();
        }
        editBus.emit("attrib:select-ids", {
          ids: [],
          source: "map",
          mode: "clear",
        });
        return;
      }

      // Multiple features → show picker
      if (hits.length > 1) {
        // Use rowIdMapRef for O(1) lookups
        const idMap = rowIdMapRef.current;
        const pickerFeatures = hits.map((f) => {
          const rawId = getFeatureId(f);
          const canonId = toCanonicalId(rawId, idMap);
          return {
            id: canonId,
            feature: f,
          };
        });

        // Remove duplicates
        const uniqueFeatures = [];
        const seenIds = new Set();
        pickerFeatures.forEach((item) => {
          if (!seenIds.has(item.id)) {
            seenIds.add(item.id);
            uniqueFeatures.push(item);
          }
        });

        if (uniqueFeatures.length > 1) {
          setFeaturePicker({
            open: true,
            features: uniqueFeatures,
          });
          return;
        }
      }

      // Single feature (original logic fortsätter...)
      const hit = hits[0];
      const rawId = getFeatureId(hit);
      // Use rowIdMapRef for O(1) lookup
      const canonId = toCanonicalId(rawId, rowIdMapRef.current);

      editBus.emit("attrib:select-ids", {
        ids: [canonId],
        source: "map",
        mode: "replace",
      });

      const multi =
        evt.originalEvent?.ctrlKey ||
        evt.originalEvent?.metaKey ||
        evt.originalEvent?.shiftKey;

      const logical = getCurrentLogical();

      if (multi) {
        if (logical.has(canonId) || logical.has(String(canonId))) {
          logical.delete(canonId);
          logical.delete(String(canonId));
        } else {
          logical.add(canonId);
        }

        selectedIdsRef.current = buildVizSet(logical);
        vectorLayerRef.current?.changed?.();

        editBus.emit("attrib:select-ids", {
          ids: Array.from(logical),
          source: "map",
          mode: "toggle",
        });
      } else {
        const same =
          logical.size === 1 &&
          (logical.has(canonId) || logical.has(String(canonId)));

        const next = new Set([canonId]);
        selectedIdsRef.current = buildVizSet(next);
        if (!same) vectorLayerRef.current?.changed?.();

        editBus.emit("attrib:select-ids", {
          ids: [canonId],
          source: "map",
          mode: "replace",
        });
      }
    };

    map.on("singleclick", onClick);
    return () => {
      try {
        map.un("singleclick", onClick);
      } catch {}
    };
  }, [props.map, vectorLayerRef, selectedIdsRef, model, handleRowLeave]);

  // HANDLE FEATURE PICKER SELECTION
  const handleFeaturePickerSelect = React.useCallback(
    (selectedIds) => {
      if (selectedIds.length === 0) return;

      // Update selection
      selectedIdsRef.current = buildVizSet(selectedIds);
      vectorLayerRef.current?.changed?.();

      // Emit event
      editBus.emit("attrib:select-ids", {
        ids: selectedIds,
        source: "map",
        mode: "replace",
      });

      // Focus on first selected
      if (selectedIds.length > 0) {
        editBus.emit("attrib:focus-id", {
          id: selectedIds[0],
          source: "map",
        });
      }
    },
    [vectorLayerRef, selectedIdsRef]
  );

  const handleFeaturePickerClose = React.useCallback(() => {
    setFeaturePicker({ open: false, features: [] });
  }, []);

  React.useEffect(() => {
    const map = props.map;
    if (!map) return;

    // Create DragBox interaction - activated with Ctrl+Drag
    const dragBox = new DragBox({
      condition: platformModifierKeyOnly, // Ctrl (Mac: Cmd) + drag
    });

    map.addInteraction(dragBox);

    // When user releases box-selection
    // Ctrl + drag box always ADDS to existing selection
    dragBox.on("boxend", () => {
      const boxExtent = dragBox.getGeometry().getExtent();
      const layer = vectorLayerRef.current;
      if (!layer) return;

      const source = layer.getSource();
      if (!source) return;

      // Find all features within the box
      const selectedFeatures = [];
      source.forEachFeatureInExtent(boxExtent, (feature) => {
        // Check that the feature is actually visible
        const raw = getFeatureId(feature);
        const aliases = idAliases(raw);

        const isVisible = aliases.some(
          (k) =>
            visibleIdsRef.current.has(k) || visibleIdsRef.current.has(String(k))
        );

        if (isVisible) {
          selectedFeatures.push(feature);
        }
      });

      if (selectedFeatures.length === 0) return;

      // Convert to canonical IDs
      // Use rowIdMapRef for O(1) lookups
      const idMap = rowIdMapRef.current;
      const newIds = selectedFeatures.map((f) => {
        const rawId = getFeatureId(f);
        return toCanonicalId(rawId, idMap);
      });

      // Always combine with existing selection
      const existingIds = [];
      if (selectedIdsRef.current.size > 0) {
        selectedIdsRef.current.forEach((id) => {
          // Only add non-string versions to avoid duplicates
          if (typeof id !== "string" || !existingIds.includes(Number(id))) {
            existingIds.push(id);
          }
        });
      }
      const finalIds = Array.from(new Set([...existingIds, ...newIds]));

      // Update selection
      selectedIdsRef.current = buildVizSet(finalIds);
      vectorLayerRef.current?.changed?.();

      // Emit event
      editBus.emit("attrib:select-ids", {
        ids: finalIds,
        source: "map",
        mode: "add",
      });
    });

    return () => {
      map.removeInteraction(dragBox);
    };
  }, [props.map, vectorLayerRef, selectedIdsRef, visibleIdsRef, model]);

  React.useEffect(() => {
    const sub = localObserver.subscribe("AttributeEditorEvent", (msg) => {
      switch (msg?.type) {
        case "UNDO":
          model.dispatch({ type: Action.UNDO });
          break;
        case "COMMIT":
          model.dispatch({ type: Action.COMMIT });
          break;
        default:
          break;
      }
    });
    return () => localObserver.unsubscribe(sub);
  }, [localObserver, model]);

  const controller = React.useMemo(
    () => ({
      // UI
      setMode: (m) => setUi((u) => ({ ...u, mode: m })),
      setDark: (v) => setUi((u) => ({ ...u, dark: v })),
      setTitle: (t) => setUi((u) => ({ ...u, title: t })),
      setColor: (c) => setUi((u) => ({ ...u, color: c })),

      // Model actions
      editCell: (id, key, value) =>
        model.dispatch({ type: Action.EDIT, id, key, value }),
      batchEdit: (ops) => model.dispatch({ type: Action.BATCH_EDIT, ops }), // ops: [{id,key,value}]
      toggleDelete: (ids, mode = "toggle") =>
        model.dispatch({ type: Action.SET_DELETE_STATE, ids, mode }),
      duplicateRows: (ids) =>
        model.dispatch({
          type: Action.DUPLICATE_ROWS,
          ids,
          readOnlyKeys: model.readOnlyKeys(),
        }),
      commit: () => model.dispatch({ type: Action.COMMIT }),
      undo: () => model.dispatch({ type: Action.UNDO }),
    }),
    [model]
  );

  React.useEffect(() => {
    const off = editBus.on("attrib:zoom-to-features", (ev) => {
      const ids = ev?.detail?.ids || [];
      if (!ids.length) return;

      const layer = vectorLayerRef.current;
      if (!layer) return;

      const features = [];
      ids.forEach((id) => {
        const f = featureIndexRef.current.get(id);
        if (f) features.push(f);
      });

      if (!features.length) return;

      const extent = features.reduce((acc, f) => {
        const geom = f.getGeometry?.();
        if (!geom) return acc;
        const fExtent = geom.getExtent();
        if (!acc) return fExtent;
        return [
          Math.min(acc[0], fExtent[0]),
          Math.min(acc[1], fExtent[1]),
          Math.max(acc[2], fExtent[2]),
          Math.max(acc[3], fExtent[3]),
        ];
      }, null);

      if (extent) {
        const view = props.map.getView();
        const windowWidth = props.options?.winwidth || 800;
        const rightPadding = Math.floor(windowWidth * 0.5) + 160;
        const maxZoom = Number(props.options?.maxzoom) || 6;

        view.fit(extent, {
          padding: [50, rightPadding, 50, 50],
          duration: 500,
          maxZoom: maxZoom,
        });
      }
    });
    return () => off();
  }, [
    props.map,
    vectorLayerRef,
    featureIndexRef,
    props.options?.winwidth,
    props.options?.maxzoom,
  ]);

  const updateCustomProp = React.useCallback((prop, value) => {
    setUi((prev) => ({ ...prev, [prop]: value }));
  }, []);

  const panelHeaderButtonCallback = React.useCallback(() => {
    console.log("You just clicked the panel-header button!");
  }, []);

  return (
    <>
      <BaseWindowPlugin
        {...props}
        type="AttributeEditor"
        custom={{
          icon: <BugReportIcon />,
          title: pluginSettings.title,
          color: pluginSettings.color,
          description: "En kort beskrivning som visas i widgeten",
          customPanelHeaderButtons: [
            {
              icon: <BugReportIcon />,
              onClickCallback: panelHeaderButtonCallback,
            },
          ],
          height: props.options.winheight,
          width: props.options.winwidth,
        }}
      >
        <AttributeEditorView
          ogc={ogc}
          model={model}
          app={props.app}
          localObserver={localObserver}
          globalObserver={props.app.globalObserver}
          updateCustomProp={updateCustomProp}
          winheight={props.options.winheight}
          state={modelState}
          controller={controller}
          ui={ui}
          setPluginSettings={setPluginSettings}
          fieldMeta={fieldMetaLocal}
          vectorLayerRef={vectorLayerRef}
          styleFn={styleFn}
          visibleIdsRef={visibleIdsRef}
          selectedIdsRef={selectedIdsRef}
          onlyFilteredRef={onlyFilteredRef}
          serviceList={serviceList}
          featureIndexRef={featureIndexRef}
          graveyardRef={graveyardRef}
          draftBaselineRef={draftBaselineRef}
          map={props.map}
          handleRowHover={handleRowHover}
          handleRowLeave={handleRowLeave}
        />
      </BaseWindowPlugin>

      {/* Modal Dialog */}
      <FeaturePickerDialog
        open={featurePicker.open}
        onClose={handleFeaturePickerClose}
        onSelect={handleFeaturePickerSelect}
        features={featurePicker.features}
        fieldMeta={fieldMetaLocal}
        handleRowHover={handleRowHover}
        handleRowLeave={handleRowLeave}
      />
    </>
  );
}

export default AttributeEditor;
