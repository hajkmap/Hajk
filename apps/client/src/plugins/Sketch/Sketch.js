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

  React.useEffect(() => {
    const map = props.map;
    if (!map) return;

    const { localObserver } = props;
    const LAYER_NAME = "attributeeditor";
    const reg = new Map();

    const attachForLayer = (
      layer,
      allow = { select: true, translate: true, modify: true }
    ) => {
      if (!layer || reg.has(layer)) return;
      if (layer.get?.("name") !== LAYER_NAME) return;

      const sel = new Select({
        layers: (lyr) => lyr === layer,
        style: null,
        hitTolerance: 6,
      });

      const fc = sel.getFeatures();

      const publishSelection = () => {
        const first = fc?.item?.(0) ?? null;
        localObserver?.publish("drawModel.modify.mapClick", first);

        const arr = [];
        fc?.forEach?.((feat) => arr.push(feat));
        localObserver?.publish("drawModel.move.select", arr);
      };

      const onFcAdd = () => publishSelection();
      const onFcRemove = () => publishSelection();
      const onSelect = () => publishSelection();

      fc?.on?.("add", onFcAdd);
      fc?.on?.("remove", onFcRemove);
      sel.on("select", onSelect);

      const tr = new Translate({ features: fc });

      const mod = new Modify({
        features: fc,
        pixelTolerance: 6,
      });

      map.addInteraction(sel);
      map.addInteraction(tr);
      map.addInteraction(mod);

      tr.__allowTranslate = !!allow.translate;
      mod.__allowModify = !!allow.modify;

      const onTranslateEnd = (e) => {
        const f = e?.features?.item?.(0);
        const id = f?.getId?.() ?? f?.get?.("id");
        if (id != null) {
          editBus.emit("attrib:select-ids", {
            ids: [id],
            source: "map",
            mode: "replace",
          });
        }
        publishSelection();
      };

      const onModifyEnd = (e) => {
        const f = e?.features?.item?.(0);
        const id = f?.getId?.() ?? f?.get?.("id");
        if (id != null) {
          editBus.emit("attrib:select-ids", {
            ids: [id],
            source: "map",
            mode: "replace",
          });
        }
        publishSelection();
      };

      tr.on("translateend", onTranslateEnd);
      mod.on("modifyend", onModifyEnd);

      const cleanup = () => {
        try {
          fc?.un?.("add", onFcAdd);
        } catch {}
        try {
          fc?.un?.("remove", onFcRemove);
        } catch {}
        try {
          sel.un("select", onSelect);
        } catch {}
        try {
          tr.un("translateend", onTranslateEnd);
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
      };

      reg.set(layer, { select: sel, translate: tr, modify: mod, cleanup });

      publishSelection();
      applyEnablement();
    };

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

      if (activityId === "EDIT") {
        for (const { select } of reg.values()) {
          const f = select?.getFeatures?.().item?.(0) ?? null;
          localObserver?.publish("drawModel.modify.mapClick", f);
          break;
        }
      }
    };

    // Helper: get AE-selected features
    const getAeSelected = () => {
      const arr = [];
      for (const { select } of reg.values()) {
        select?.getFeatures?.().forEach((f) => arr.push(f));
      }
      return arr;
    };

    const offTranslateCmd = editBus.on("sketch:ae-translate", (ev) => {
      const { distance, angleDeg } = ev.detail || {};
      const feats = getAeSelected();
      if (feats.length) {
        drawModel.translateSelectedFeatures(distance, angleDeg, {
          features: feats,
        });
      }
    });

    const offRotateCmd = editBus.on("sketch:ae-rotate", (ev) => {
      const { degrees, clockwise } = ev.detail || {};
      const feats = getAeSelected();
      if (feats.length) {
        drawModel.rotateSelectedFeatures(degrees, clockwise, {
          features: feats,
        });
      }
    });

    // Focus from AE tabs to Sketch edit feature
    const findAeFeatureById = (id) => {
      for (const lyr of reg.keys()) {
        const src = lyr.getSource?.();
        if (!src) continue;
        let f = src.getFeatureById?.(id);
        if (!f) {
          f = src
            .getFeatures?.()
            .find((x) => (x.getId?.() ?? x.get?.("id")) === id);
        }
        if (f) return f;
      }
      return null;
    };

    const offFocus = editBus.on("attrib:focus-id", (ev) => {
      const id = ev?.detail?.id;
      if (id == null) {
        localObserver?.publish("drawModel.modify.mapClick", null);
        return;
      }
      const f = findAeFeatureById(id);
      localObserver?.publish("drawModel.modify.mapClick", f || null);
    });

    // Listen for the AE layer being attached
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

    const onAdd = (e) => {
      const lyr = e.element || e.layer || e.target;
      attachForLayer(lyr, { select: true, translate: true, modify: true });
    };
    layers.on?.("add", onAdd);

    applyEnablement();

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
        (f, lyr) => {
          if (lyr === targetLayer) {
            hit = f;
            return true;
          }
          return false;
        },
        { layerFilter: (lyr) => lyr === targetLayer, hitTolerance: 6 }
      );

      if (!hit) return;

      const fid = hit.getId?.() ?? hit.get?.("id");
      if (fid == null) return;

      editBus.emit("attrib:select-ids", {
        ids: [fid],
        source: "map",
        mode: "replace",
      });
      editBus.emit("attrib:toggle-delete-ids", { ids: [fid], source: "map" });

      evt.preventDefault?.();
      evt.stopPropagation?.();
    };

    map.on("singleclick", onDeleteClick);

    return () => {
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
        layers.un?.("add", onAdd);
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
    props.localObserver,
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
