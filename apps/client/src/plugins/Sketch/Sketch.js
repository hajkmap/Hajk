import React from "react";
import Observer from "react-event-observer";
import EditIcon from "@mui/icons-material/Edit";

// Bus
import { editBus } from "../../buses/editBus";

// Helpers
import LocalStorageHelper from "../../utils/LocalStorageHelper";

// Views
import BaseWindowPlugin from "../BaseWindowPlugin";
import SketchView from "./views/SketchView";

// Models
import SketchModel from "./models/SketchModel";
import DrawModel from "../../models/DrawModel";
import KmlModel from "../../models/KmlModel";
import GpxModel from "../../models/GpxModel";

// OL
import Select from "ol/interaction/Select";
import Translate from "ol/interaction/Translate";
import Modify from "ol/interaction/Modify";
import { Stroke, Fill } from "ol/style";

// Constants
import {
  STORAGE_KEY,
  DEFAULT_MEASUREMENT_SETTINGS,
  PLUGIN_COLORS,
} from "./constants";

// Hooks
import useCookieStatus from "../../hooks/useCookieStatus";

// Returns the measurement-settings-object from LS if it exists, otherwise it returns
// the default measurement-settings. The LS might be empty since the user might have chosen
// not to accept functional cookies.
const getMeasurementSettings = () => {
  const { measurementSettings } = LocalStorageHelper.get(STORAGE_KEY);
  return measurementSettings || DEFAULT_MEASUREMENT_SETTINGS;
};

const Sketch = (props) => {
  const lastEditFeatureRef = React.useRef(null);
  // We're gonna need to keep track of the current chosen activity. ("ADD", "REMOVE", etc).
  const [activityId, setActivityId] = React.useState("ADD");
  // We're gonna need to keep track of the currently active draw-type. ("Polygon", "Rectangle", etc).
  const [activeDrawType, setActiveDrawType] = React.useState("Polygon");
  // We have to keep track of the eventual feature that has been selected for modification.
  const [editFeature, setEditFeature] = React.useState(null);
  // We also need to keep track of if we're supposed to be enabling a modify-interaction along with
  // the edit-interaction. (The edit-interaction allows the user to change feature colors etc. and the
  // modify-interaction allows the user to change the features geometries).
  const [modifyEnabled, setModifyEnabled] = React.useState(false);
  // We also have to keep track of if free-hand-translation should be enabled or not.
  // Free-hand-translate is a part of the move-interaction allowing the user to move features
  // by dragging them in the map.
  const [translateEnabled, setTranslateEnabled] = React.useState(true);
  // We need to keep track of features that has been selected while in move-mode.
  const [moveFeatures, setMoveFeatures] = React.useState([]);
  // We're gonna need to keep track of if the actual plugin is shown or not.
  const [pluginShown, setPluginShown] = React.useState(
    props.options.visibleAtStart ?? false
  );

  // A toggle-button that allows the user to toggle between turn off & choose-drawn-object to buffer in the new buffer sketch accordion.
  const [toggleBufferBtn, setToggleBufferBtn] = React.useState({
    toggle: false, // Represents the state whether the button is currently toggled on or off
    map: props.map, // Reference to the map object passed as a prop
    app: props.app, // Reference to the app object passed as a prop
  });

  // We have to keep track of some measurement-settings
  const [measurementSettings, setMeasurementSettings] = React.useState(
    getMeasurementSettings()
  );
  // We're gonna need to keep track of if we're allowed to save stuff in LS. Let's use the hook.
  const { functionalCookiesOk } = useCookieStatus(props.app.globalObserver);
  // The local observer will handle the communication between models and views.
  const [localObserver] = React.useState(() => Observer());

  const prevActivityRef = React.useRef(activityId);
  React.useEffect(() => {
    const prev = prevActivityRef.current;
    if (prev === "EDIT" && activityId !== "EDIT") {
      setEditFeature(null);
      setMoveFeatures([]);
    }
    prevActivityRef.current = activityId;
  }, [activityId]);

  // We're also gonna need a drawModel to handle all draw functionality
  const [drawModel] = React.useState(
    () =>
      new DrawModel({
        layerName: "pluginSketch",
        map: props.map,
        observer: localObserver,
        measurementSettings: measurementSettings,
      })
  );

  // We need a model used to interact with the map etc. We want to
  // keep the view free from direct interactions.
  // There's a possibility that this model won't be needed since most
  // (if not all) of the functionality should exist in the core Draw-model.
  const [sketchModel] = React.useState(
    () =>
      new SketchModel({
        drawModel: drawModel,
        modifyDefaultEnabled: modifyEnabled,
        translateDefaultEnabled: translateEnabled,
        storageKey: STORAGE_KEY,
      })
  );

  // We'll also need a KML-model so that the user can import and export to/from .kml.
  const [kmlModel] = React.useState(
    () =>
      new KmlModel({
        layerName: "pluginSketch",
        map: props.map,
        observer: localObserver,
        drawModel: drawModel,
        enableDragAndDrop: true,
      })
  );

  // We'll also need a GPX-model so that the user can import and export to/from .gpx.
  const [gpxModel] = React.useState(
    () =>
      new GpxModel({
        layerName: "pluginSketch",
        map: props.map,
        observer: localObserver,
        drawModel: drawModel,
        enableDragAndDrop: true,
      })
  );

  // TODO: Refine!!!
  const [pluginSettings, setPluginSettings] = React.useState({
    title: "Rita",
    color: "4a90e2",
  });

  React.useEffect(() => {
    const offSel = editBus.on("edit:service-selected", (ev) => {
      const { title, color, source } = ev.detail || {};
      if (source === "sketch") return;
      setPluginSettings((ps) => ({
        ...ps,
        title: title ?? ps.title,
        color: color ?? ps.color,
      }));
    });

    const offClr = editBus.on("edit:service-cleared", (ev) => {
      const { source } = ev.detail || {};
      if (source === "sketch") return;
      setPluginSettings((ps) => ({
        ...ps,
        title: "Rita",
        color: PLUGIN_COLORS.default,
      }));
    });

    return () => {
      offSel();
      offClr();
    };
  }, []);

  function materializeStyleFromLayer(layer, feature, map) {
    if (!feature) return;
    if (feature.get && feature.get("__ae_style_delegate")) return;
    const lf = layer?.getStyleFunction?.();
    if (!lf) return;

    feature.set?.("__ae_style_delegate", true, true);

    feature.setStyle((f, resArg) => {
      const res = resArg ?? map?.getView?.().getResolution?.();
      let st = lf(f, res);
      if (Array.isArray(st)) st = st[0];
      if (!st) return st;

      const out = st.clone ? st.clone() : st;

      const gt = f.getGeometry?.()?.getType?.();
      const isPointy = gt === "Point" || gt === "MultiPoint";
      if (!isPointy) {
        if (out.getStroke && !out.getStroke()) {
          out.setStroke(new Stroke({ color: "rgba(0,0,0,0)", width: 0 }));
        }
        if (out.getFill && !out.getFill()) {
          out.setFill(new Fill({ color: "rgba(0,0,0,0)" }));
        }
      }

      return out;
    });
  }

  // Orchestrates Sketch ↔ AttributeEditor integration for AE layers.
  // - Finds/attaches OpenLayers interactions (Select/Translate/Modify) for the
  //   "attributeeditor" layer and keeps them enabled/disabled based on UI state
  //   (current activity, translate/modify toggles).
  // - Mirrors selection between map and panels: publishes the current AE
  //   selection to Sketch (EditView needs a single feature; MoveView needs a list).
  // - Listens to cross-plugin bus events:
  //     • sketch:ae-translate / sketch:ae-rotate → apply DrawModel move/rotate
  //     • attrib:focus-id → focus a specific AE feature and push it to EditView
  //     • sketch.attachExternalLayer → attach interactions to newly added AE layer
  // - In DELETE mode: handles map clicks to select the hit AE feature and toggles
  //   its delete state in the AttributeEditor.
  // - Ensures AE features have a materialized style before passing them to Sketch,
  //   so edit tools render/behave consistently.
  // - Cleans up all listeners/interactions on unmount or dependency changes.
  React.useEffect(() => {
    const map = props.map;
    if (!map) return;
    const lastPublishRef = { id: null, chan: null };

    //Helper
    const matchesLogicalId = (feat, want) => {
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
    };

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
        feature.set("DRAW_METHOD", method, true);
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
      }

      if (feature && !feature.getStyle?.()) {
        const owner = [...reg.keys()].find((lyr) => {
          const src = lyr.getSource?.();
          return (
            !!src &&
            (src.getFeatureById?.(feature.getId?.()) ||
              src.getFeatures?.().includes?.(feature))
          );
        });
        materializeStyleFromLayer(owner, feature, map);
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

        if (wanted.size === 0) continue;

        const srcFeatures = src.getFeatures?.() || [];
        wanted.forEach((wid) => {
          const f =
            src.getFeatureById?.(wid) ||
            srcFeatures.find((x) => matchesLogicalId(x, wid));
          if (f) fc.push(f);
        });
      }
    };

    // ============================================================
    // SECTION: Constants & shared refs
    // ============================================================
    const LAYER_NAME = "attributeeditor";
    const reg = new Map(); // Map<olLayer, { select, translate, modify, cleanup }>

    // ============================================================
    // SECTION: Enable/disable interactions based on UI state
    // ============================================================
    const applyEnablement = () => {
      const inMove = activityId === "MOVE";
      const inEditWithNodes = activityId === "EDIT" && modifyEnabled;

      for (const { select, translate, modify } of reg.values()) {
        try {
          select.setActive(true);
        } catch {}
        try {
          translate.setActive(
            inMove && translate.__allowTranslate && translateEnabled
          );
        } catch {}
        try {
          modify.setActive(inEditWithNodes && modify.__allowModify);
        } catch {}
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

      const beforeGeomRef = new Map();

      const sel = new Select({
        layers: (lyr) => lyr === layer,
        style: null,
        hitTolerance: 6,
        multi: true,
        // We sync selection via attrib:select-ids; block OL's own picking.
        condition: () => false,
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
              if (lyr === layer) {
                hit = f;
                return true;
              }
              return false;
            },
            { hitTolerance: 6, layerFilter: (lyr) => lyr === layer }
          );
          if (!hit) return false;

          materializeStyleFromLayer(layer, hit, map);

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
            fc.push(hit);
            editBus.emit("attrib:select-ids", {
              ids: [canon],
              source: "map",
              mode: "replace",
            });
          } else {
            const arr = fc.getArray ? fc.getArray() : [];
            if (arr.includes(hit)) fc.remove(hit);
            else fc.push(hit);

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

      const mod = new Modify({ features: fc, pixelTolerance: 6 });

      tr.__allowTranslate = !!allow.translate;
      mod.__allowModify = !!allow.modify;

      // ---------- named handlers (so we can bind/unbind cleanly) ----------
      const onSelect = () => {
        const arr = fc.getArray ? fc.getArray() : [];
        arr.forEach((f) => {
          if (f && !f.getStyle?.()) materializeStyleFromLayer(layer, f, map);
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

      lastPublishRef.id = null;
      lastPublishRef.chan = null;

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
      if (f && !f.getStyle?.()) {
        const layerForF = [...reg.keys()].find((lyr) => {
          const src = lyr.getSource?.();
          return (
            !!src &&
            (src.getFeatureById?.(id) || src.getFeatures?.().includes?.(f))
          );
        });
        materializeStyleFromLayer(layerForF, f, map);
      }
      if (activityId === "EDIT") {
        localObserver?.publish("drawModel.modify.mapClick", f || null);
      } else if (activityId === "MOVE") {
        localObserver?.publish("drawModel.move.select", f ? [f] : []);
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
        (f, lyr) => (lyr === targetLayer ? ((hit = f), true) : false),
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
    props,
    props.map,
    localObserver,
    activityId,
    modifyEnabled,
    translateEnabled,
    drawModel,
  ]);

  // This functions handles events from the draw-model that are sent
  // when we are in edit-mode and the map is clicked. A feature might be sent
  // in the payload, but if the user clicked the map where no drawn feature exists,
  // null is sent.
  const handleModifyMapClick = React.useCallback((clickedFeature) => {
    if (lastEditFeatureRef.current === clickedFeature) return;
    lastEditFeatureRef.current = clickedFeature;
    setEditFeature(clickedFeature);
  }, []);

  // This functions handles events from the draw-model that are sent
  // when we are in move-mode and the map is clicked. The payload will contain
  // all features currently selected in the map.
  const handleMoveFeatureSelected = React.useCallback((selectedFeatures) => {
    setMoveFeatures(selectedFeatures);
  }, []);

  // This effect makes sure to subscribe (and un-subscribe) to all observer-events
  // we are interested in in this view.
  React.useEffect(() => {
    localObserver.subscribe("drawModel.modify.mapClick", handleModifyMapClick);
    localObserver.subscribe("drawModel.move.select", handleMoveFeatureSelected);
    return () => {
      localObserver.unsubscribe("drawModel.modify.mapClick");
      localObserver.unsubscribe("drawModel.move.select");
    };
  }, [localObserver, handleModifyMapClick, handleMoveFeatureSelected]);

  // This effect makes sure that we activate the proper draw-interaction when the draw-type,
  // activity-id, or plugin-visibility changes. (This includes activating the first draw-interaction on first render).
  React.useEffect(() => {
    // If the plugin is not shown, we have to make sure to disable
    // the potential draw-interaction.
    // If the toggleBufferBtn is not toggled on, we have to make sure to disable the potential draw-interaction to be able to buffer an object.
    if (!pluginShown || !toggleBufferBtn.toggle) {
      return drawModel.toggleDrawInteraction("");
    }
    // Otherwise, we make sure to toggle the draw-interaction to the correct one.
    switch (activityId) {
      case "ADD":
        return drawModel.toggleDrawInteraction(activeDrawType);
      case "DELETE":
        return drawModel.toggleDrawInteraction("Delete");
      case "EDIT":
        return drawModel.toggleDrawInteraction("Edit");
      case "MOVE":
        return drawModel.toggleDrawInteraction("Move");
      default:
        return drawModel.toggleDrawInteraction("");
    }
  }, [activeDrawType, activityId, drawModel, pluginShown, toggleBufferBtn]);

  // This effect makes sure to reset the edit- and move-feature if the window is closed,
  // or if the user changes activity. (We don't want to keep the features selected
  // if the user toggles from edit- or move-mode to create mode for example).
  React.useEffect(() => {
    setEditFeature(null);
    setMoveFeatures([]);
  }, [activityId, pluginShown]);

  // An effect that makes sure to set the modify-interaction in the model
  // when the modify-state changes.
  React.useEffect(() => {
    drawModel.setModifyActive(modifyEnabled);
  }, [drawModel, modifyEnabled]);

  // An effect that makes sure to set the translate-interaction in the model
  // when the translate-state changes.
  React.useEffect(() => {
    drawModel.setTranslateActive(translateEnabled);
  }, [drawModel, translateEnabled]);

  // An effect making sure to update the measurement-settings in the draw-model
  // (and in LS if thats OK) when they are changed in the view.
  React.useEffect(() => {
    if (functionalCookiesOk) {
      LocalStorageHelper.set(STORAGE_KEY, {
        ...LocalStorageHelper.get(STORAGE_KEY),
        measurementSettings: measurementSettings,
      });
    }
    drawModel.setMeasurementSettings(measurementSettings);
  }, [functionalCookiesOk, drawModel, measurementSettings]);

  // We're gonna need to catch if the user closes the window, and make sure to
  // update the state so that the effect handling the draw-interaction-toggling fires.
  const onWindowHide = () => {
    setPluginShown(false);
    setToggleBufferBtn({ ...toggleBufferBtn, toggle: false });
  };

  // We're gonna need to catch if the user opens the window, and make sure to
  // update the state so that the effect handling the draw-interaction-toggling fires.
  const onWindowShow = () => {
    setPluginShown(true);
    setToggleBufferBtn({ ...toggleBufferBtn, toggle: true });
  };

  // We're rendering the view in a BaseWindowPlugin, since this is a
  // "standard" plugin.
  return (
    <BaseWindowPlugin
      {...props}
      type="Sketch"
      custom={{
        icon: <EditIcon />,
        title: pluginSettings.title,
        color: pluginSettings.color,
        description: "Skapa dina helt egna geometrier!",
        height: "dynamic",
        width: 350,
        onWindowHide: onWindowHide,
        onWindowShow: onWindowShow,
      }}
    >
      <SketchView
        model={sketchModel}
        drawModel={drawModel}
        kmlModel={kmlModel}
        gpxModel={gpxModel}
        options={props.options}
        localObserver={localObserver}
        globalObserver={props.app.globalObserver}
        activeDrawType={activeDrawType}
        activityId={activityId}
        setActivityId={setActivityId}
        setActiveDrawType={setActiveDrawType}
        modifyEnabled={modifyEnabled}
        setModifyEnabled={setModifyEnabled}
        translateEnabled={translateEnabled}
        setTranslateEnabled={setTranslateEnabled}
        editFeature={editFeature}
        moveFeatures={moveFeatures}
        measurementSettings={measurementSettings}
        setMeasurementSettings={setMeasurementSettings}
        pluginShown={pluginShown}
        toggleBufferBtn={toggleBufferBtn}
        setToggleBufferBtn={setToggleBufferBtn}
        setPluginSettings={setPluginSettings}
      />
    </BaseWindowPlugin>
  );
};

export default Sketch;
