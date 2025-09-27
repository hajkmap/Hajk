import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";
import AttributeEditorView from "./AttributeEditorView";
import Observer from "react-event-observer";
import BugReportIcon from "@mui/icons-material/BugReport";
import AttributeEditorModel, { Action } from "./AttributeEditorModel";
import { editBus } from "../../buses/editBus";
import { PLUGIN_COLORS } from "./constants/index";
import { createOgcApi } from "./api/ogc";

import GeoJSON from "ol/format/GeoJSON";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Style, Circle as CircleStyle, Fill, Stroke } from "ol/style";

function AttributeEditor(props) {
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

  const modelState = React.useSyncExternalStore(
    model.subscribe,
    model.getSnapshot,
    model.getSnapshot
  );

  const visibleIdsRef = React.useRef(new Set());
  const selectedIdsRef = React.useRef(new Set());
  const onlyFilteredRef = React.useRef(false);
  const deletedIdsRef = React.useRef(new Set());
  const featureIndexRef = React.useRef(new Map());
  const graveyardRef = React.useRef(new Map());
  const focusedIdRef = React.useRef(null);

  const currentServiceIdRef = React.useRef("NONE_ID");
  const [serviceList, setServiceList] = React.useState([]);

  const styles = React.useMemo(() => {
    const baseStroke = new Stroke({ color: "#1976d2", width: 2 });
    const baseFill = new Fill({ color: "rgba(25, 118, 210, 0.73)" });
    return {
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
      toDelete: new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: "rgba(229,57,53,0.25)" }),
          stroke: new Stroke({ color: "#e53935", width: 3 }),
        }),
        stroke: new Stroke({ color: "#e53935", width: 3 }),
        fill: new Fill({ color: "rgba(229,57,53,0.12)" }),
        zIndex: 5,
      }),
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
      dimmed: new Style({
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({ color: "rgba(0,0,0,0.06)" }),
        }),
        stroke: new Stroke({ color: "rgba(0,0,0,0.25)", width: 1 }),
        fill: new Fill({ color: "rgba(255, 5, 5, 0.04)" }),
        zIndex: 1,
      }),
    };
  }, []);

  const styleFn = React.useCallback(
    (feature) => {
      // 1) use attribute id if it exists, otherwise use @_fid, and lastly OL-id
      const keyRaw =
        feature.get?.("id") ?? feature.get?.("@_fid") ?? feature.getId?.();
      const keyStr = String(keyRaw);

      const sel = selectedIdsRef.current;
      const vis = visibleIdsRef.current;
      const del = deletedIdsRef.current;

      const isSelected = sel.has(keyRaw) || sel.has(keyStr);
      const isVisible = vis.has(keyRaw) || vis.has(keyStr);

      if (!isVisible && !isSelected) return null;
      if (del.has(keyRaw) || del.has(keyStr)) return styles.toDelete;
      if (isSelected) return styles.selected;
      return styles.visible;
    },
    [styles]
  );

  React.useEffect(() => {
    let cancelled = false;
    const active = props.options?.activeServices ?? [];
    if (!active.length) {
      setServiceList([]);
      return;
    }

    (async () => {
      try {
        // Fetch full list once for fallback lookups
        const list = await ogc.fetchWfstList(
          "id,uuid,caption,title,name,projection,layers"
        );
        const allArr = Array.isArray(list) ? list : (list?.layers ?? []);

        const ids = active.map((x) => x.id).filter(Boolean);
        const items = await Promise.all(
          ids.map(async (id) => {
            try {
              // Primary source of truth
              const meta = await ogc.fetchWfstMeta(id);
              const title =
                meta?.caption?.trim?.() ||
                meta?.title?.trim?.() ||
                meta?.name?.trim?.() ||
                // fallback: look up in fetched list
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
            } catch {
              // Hard fallback: list row or bare id
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

        if (!cancelled) setServiceList(items.filter(Boolean));
      } catch (e) {
        if (!cancelled) setServiceList([]);
        console.warn("Kunde inte läsa serviceList:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ogc, props.options?.activeServices, setServiceList]);

  React.useEffect(() => {
    const offSel = editBus.on("edit:service-selected", async (ev) => {
      const { title, color, source, id, projection } = ev.detail || {};
      if (source === "attrib") return;

      currentServiceIdRef.current = id || "NONE_ID";

      setPluginSettings((u) => ({
        ...u,
        title: title ?? u.title,
        color: color ?? u.color,
      }));

      // Initialize model to empty state
      model.dispatch({ type: Action.INIT, features: [] });
      setFieldMetaLocal([]);
      model.setFieldMetadata([]);

      try {
        // 1) Fetch whole schema (no fields-param)
        const schema = await ogc.fetchWfst(id);

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

        // 6) Set FM (state + model) - trigger render in View
        setFieldMetaLocal(fmMerged);
        model.setFieldMetadata(fmMerged);

        // 7) Load data (once FM is set)
        const { featureCollection } = (await model.loadFromService?.(id)) || {};

        // 8) Set up the vector layer
        const map = props.map;
        const mapProj = map.getView().getProjection();
        const dataProj =
          projection || featureCollection?.crs?.properties?.name || "EPSG:3006";

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

        visibleIdsRef.current = new Set(
          features.flatMap((f) => {
            const fid = f.get?.("id") ?? f.get?.("@_fid") ?? f.getId?.();
            return [fid, String(fid)];
          })
        );

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
        console.warn("Fel vid laddning av schema/data:", e);
      }
    });

    const offClr = editBus.on("edit:service-cleared", (ev) => {
      const { source } = ev.detail || {};
      if (source === "attrib") return;

      currentServiceIdRef.current = "NONE_ID";

      setPluginSettings((u) => ({
        ...u,
        title: DEFAULT_TITLE,
        color: PLUGIN_COLORS.default,
      }));

      model.dispatch({ type: Action.INIT, features: [] });
      setFieldMetaLocal([]);
      model.setFieldMetadata([]);

      if (vectorLayerRef.current) {
        props.map.removeLayer(vectorLayerRef.current);
        vectorLayerRef.current = null;
      }
    });

    return () => {
      offSel();
      offClr();
    };
  }, [model, props.map, setPluginSettings, styleFn, ogc]);

  // Find Sketch layer
  function getSketchLayer(map) {
    const layers = map.getLayers().getArray?.() || [];
    // Sketch layer name: "pluginSketch"
    return layers.find((lyr) => lyr?.get?.("name") === "pluginSketch") || null;
  }

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

        if (
          !currentServiceIdRef.current ||
          currentServiceIdRef.current === "NONE_ID"
        ) {
          return;
        }

        // If the feature comes in with an id that is already in use (e.g. -1 from the original dataset),
        // reassign the id so we can give it a new temporary id in AE.
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

        // create draft with negative id
        const tempId = model.addDraftFromFeature(f);
        f.setId?.(tempId);
        try {
          f.set?.("id", tempId, true);
        } catch {}

        featureIndexRef.current.set(tempId, f);
        graveyardRef.current.delete(tempId);

        selectedIdsRef.current = new Set([tempId]);
        visibleIdsRef.current.add(tempId);

        vectorLayerRef.current?.changed?.();
        editBus.emit("attrib:focus-id", { id: tempId, source: "map" });
      };

      const onRemove = (e) => {
        const f = e.feature;
        if (!f) return;
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
        featureIndexRef.current.delete(fid);

        // Is this right - Test
        selectedIdsRef.current.delete(fid);
        visibleIdsRef.current.delete(fid);

        if (typeof fid === "number" && fid < 0) {
          model.dispatch({ type: Action.REMOVE_DRAFTS, ids: [fid] });
        } else {
          model.dispatch({
            type: Action.SET_DELETE_STATE,
            ids: [fid],
            mode: "mark",
          });
        }

        // reset focus if the deleted feature was focused
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
  }, [props.map, model, vectorLayerRef]);

  React.useEffect(() => {
    return model.subscribe(() => {
      const st = model.getSnapshot?.() || {};
      const del =
        st.pendingDeletes instanceof Set ? st.pendingDeletes : new Set();
      deletedIdsRef.current = new Set(del);
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

      // Helperr
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
              src.removeFeature(f);
            } catch {}
            featureIndexRef.current.delete(id);
            graveyardRef.current.set(id, f);
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
              src.removeFeature(f);
            } catch {}
            featureIndexRef.current.delete(id);
            graveyardRef.current.set(id, f);
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
              src.addFeature(f);
            } catch {}
            featureIndexRef.current.set(id, f);
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
              src.removeFeature(f);
            } catch {}
            featureIndexRef.current.delete(id);
          }
        }
      });
    });
  }, [props.map, model]);

  React.useEffect(() => {
    const map = props.map;
    if (!map) return;

    // Helper: Convert idLike to canonical id
    const toCanonicalId = (idLike) => {
      const rows = model.getSnapshot?.().features || [];
      const hit = rows.find((r) => String(r.id) === String(idLike));
      return hit ? hit.id : idLike;
    };

    // Helper: Build set of logical ids
    const buildVizSet = (logicalIds) => {
      const set = new Set();
      logicalIds.forEach((x) => {
        set.add(x);
        set.add(String(x));
      });
      return set;
    };

    // Helper: Get current logical ids
    const getCurrentLogical = () => {
      const current = selectedIdsRef.current || new Set();
      const uniqStr = new Set(Array.from(current).map(String));
      const canon = new Set(Array.from(uniqStr).map(toCanonicalId));
      return canon;
    };

    const onClick = (evt) => {
      if (evt.dragging) return;
      if (evt.originalEvent?.detail >= 2) return;
      if (evt.originalEvent?.button !== 0) return;

      const layer = vectorLayerRef.current;
      if (!layer) return;

      let hit = null;
      map.forEachFeatureAtPixel(
        evt.pixel,
        (f, lyr) => {
          if (lyr === layer) {
            hit = f;
            return true;
          }
          return false;
        },
        { layerFilter: (lyr) => lyr === layer, hitTolerance: 3 }
      );

      if (!hit) {
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

      // 1) pick feature id
      const rawId = hit.get?.("id") ?? hit.get?.("@_fid") ?? hit.getId?.();
      const canonId = toCanonicalId(rawId);

      const multi =
        evt.originalEvent?.ctrlKey ||
        evt.originalEvent?.metaKey ||
        evt.originalEvent?.shiftKey;

      // 2) cannonical ids
      const logical = getCurrentLogical();

      if (multi) {
        // toggle canonId
        if (logical.has(canonId) || logical.has(String(canonId))) {
          logical.delete(canonId);
          logical.delete(String(canonId));
        } else {
          logical.add(canonId);
        }

        selectedIdsRef.current = buildVizSet(logical);
        vectorLayerRef.current?.changed?.();

        // only send canonical ids
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
  }, [props.map, vectorLayerRef, selectedIdsRef, model]);

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

  const updateCustomProp = (prop, value) => {
    setUi((prev) => ({ ...prev, [prop]: value }));
  };

  const panelHeaderButtonCallback = () => {
    console.log("You just clicked the panel-header button!");
  };

  return (
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
      />
    </BaseWindowPlugin>
  );
}

export default AttributeEditor;
