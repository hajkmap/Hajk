import React, { useMemo } from "react";
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
import AngleSnapping from "../Measurer/AngleSnapping";

// Constants
import {
  STORAGE_KEY,
  DEFAULT_MEASUREMENT_SETTINGS,
  PLUGIN_COLORS,
} from "./constants";

// Hooks
import useCookieStatus from "../../hooks/useCookieStatus";
import useAttributeEditorIntegration from "./hooks/useAttributeEditorIntegration";
import useGeometryValidation from "./hooks/useGeometryValidation";

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
  // Allowed geometry types when in AttributeEditor-mode
  const [allowedGeometryTypes, setAllowedGeometryTypes] = React.useState(null);

  // A toggle-button that allows the user to toggle between turn off & choose-drawn-object to buffer in the new buffer sketch accordion.
  const [toggleBufferBtn, setToggleBufferBtn] = React.useState({
    toggle: false, // Represents the state whether the button is currently toggled on or off
    map: props.map, // Reference to the map object passed as a prop
    app: props.app, // Reference to the app object passed as a prop
  });

  // State for fixed-length drawing mode (AttributeEditor mode)
  const [fixedLengthEnabled, setFixedLengthEnabled] = React.useState(false);
  const [fixedLength, setFixedLength] = React.useState(1000); // Default 1000 meters
  const [fixedAngle, setFixedAngle] = React.useState(0); // Default 0 degrees (North)

  // We have to keep track of some measurement-settings
  const [measurementSettings, setMeasurementSettings] = React.useState(
    getMeasurementSettings()
  );
  // Keep track of whether to show kink markers
  const [showKinkMarkers, setShowKinkMarkers] = React.useState(() => {
    const saved = LocalStorageHelper.get(STORAGE_KEY);
    return saved?.showKinkMarkers ?? true;
  });
  // We're gonna need to keep track of if we're allowed to save stuff in LS. Let's use the hook.
  const { functionalCookiesOk } = useCookieStatus(props.app.globalObserver);
  // The local observer will handle the communication between models and views.
  const [localObserver] = React.useState(() => Observer());

  const prevActivityRef = React.useRef(activityId);
  // Track if AttributeEditor has an active editable layer
  const attributeEditorActiveRef = React.useRef(false);

  React.useEffect(() => {
    const prev = prevActivityRef.current;
    if (prev === "EDIT" && activityId !== "EDIT") {
      setEditFeature(null);
      setMoveFeatures([]);
    }
    prevActivityRef.current = activityId;
  }, [activityId]);

  // Save showKinkMarkers to localStorage when it changes
  React.useEffect(() => {
    if (functionalCookiesOk) {
      LocalStorageHelper.set(STORAGE_KEY, {
        ...LocalStorageHelper.get(STORAGE_KEY),
        showKinkMarkers: showKinkMarkers,
      });
    }
  }, [showKinkMarkers, functionalCookiesOk]);

  // Load showKinkMarkers from localStorage when cookie status changes
  React.useEffect(() => {
    if (functionalCookiesOk) {
      const saved = LocalStorageHelper.get(STORAGE_KEY);
      setShowKinkMarkers(saved?.showKinkMarkers ?? true);
    } else {
      setShowKinkMarkers(true);
    }
  }, [functionalCookiesOk]);

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

  // We need angle snapping functionality (perpendicular to lines/polygon sides)
  const angleSnapping = useMemo(() => {
    return new AngleSnapping(drawModel, props.map);
  }, [drawModel, props.map]);

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
    const offSel = editBus.on("edit:service-selected", async (ev) => {
      const { id, source } = ev.detail || {};

      if (!id) {
        setAllowedGeometryTypes(null);
        attributeEditorActiveRef.current = false;
        return;
      }

      // Mark that AttributeEditor is active with an editable layer
      attributeEditorActiveRef.current = true;

      // If source is "sketch", we don't need to request schema
      // (Sketch already knows the schema from its own selection)
      if (source === "sketch") return;

      try {
        // Retrieve schema
        // AttributeEditor emits the schema via the bus
        editBus.emit("attrib:request-schema", { serviceId: id });
      } catch (e) {
        console.warn("Kunde inte hämta schema:", e);
      }
    });

    const offSchema = editBus.on("attrib:schema-loaded", (ev) => {
      const { schema } = ev.detail || {};
      if (!schema) return;

      // Mapping from backend flags to Sketch draw types
      const allowed = [];

      // Punkt → Point
      if (schema.editPoint || schema.editMultiPoint) {
        allowed.push("Point");
      }

      // Polygon → Polygon, Rectangle, Square, Select
      if (schema.editPolygon || schema.editMultiPolygon) {
        allowed.push("Polygon", "Rectangle", "Square", "Select");
      }

      // Linje → LineString
      if (schema.editLine || schema.editMultiLine) {
        allowed.push("LineString");
      }

      setAllowedGeometryTypes(allowed.length > 0 ? allowed : null);
    });

    const offClr = editBus.on("edit:service-cleared", (ev) => {
      const { source } = ev.detail || {};
      if (source === "sketch") return;
      setAllowedGeometryTypes(null);
      attributeEditorActiveRef.current = false;
    });

    return () => {
      offSel();
      offSchema();
      offClr();
    };
  }, []);

  React.useEffect(() => {
    // Only run logic when there are geometry type restrictions (redigerbart lager selected)
    if (!allowedGeometryTypes || allowedGeometryTypes.length === 0) {
      // No restrictions - user can freely select any draw type
      return;
    }

    // When there are restrictions, ensure the current draw type is allowed
    if (!allowedGeometryTypes.includes(activeDrawType)) {
      setActiveDrawType(allowedGeometryTypes[0]);
    }
  }, [allowedGeometryTypes, activeDrawType, setActiveDrawType]);

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

  // Use custom hooks for AttributeEditor integration and geometry validation
  useAttributeEditorIntegration({
    map: props.map,
    props,
    drawModel,
    localObserver,
    activityId,
    modifyEnabled,
    translateEnabled,
    pluginShown,
    attributeEditorActiveRef,
    measurementSettings,
  });

  useGeometryValidation({
    map: props.map,
    allowedGeometryTypes,
    activityId,
    showKinkMarkers,
  });

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

  // Handle draw start event to enable angle snapping and publish to localObserver
  const handleDrawStart = React.useCallback(
    (e) => {
      angleSnapping.handleDrawStartEvent(e, props.map, drawModel);
      localObserver.publish("sketch:drawStart");
    },
    [angleSnapping, props.map, drawModel, localObserver]
  );

  // Handle draw end event to publish to localObserver
  const handleDrawEnd = React.useCallback(() => {
    localObserver.publish("sketch:drawEnd");
  }, [localObserver]);

  // Handle draw abort event to publish to localObserver
  const handleDrawAbort = React.useCallback(() => {
    localObserver.publish("sketch:drawAbort");
  }, [localObserver]);

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
        return drawModel.toggleDrawInteraction(activeDrawType, {
          handleDrawStart: handleDrawStart,
          handleDrawEnd: handleDrawEnd,
          handleDrawAbort: handleDrawAbort,
          fixedLengthEnabled: fixedLengthEnabled,
          // Note: fixedLength and fixedAngle are NOT passed here
          // They are updated via a separate useEffect that calls updateFixedLengthSettings
        });
      case "DELETE":
        return drawModel.toggleDrawInteraction("Delete");
      case "EDIT":
        return drawModel.toggleDrawInteraction("Edit");
      case "MOVE":
        return drawModel.toggleDrawInteraction("Move");
      default:
        return drawModel.toggleDrawInteraction("");
    }
  }, [
    activeDrawType,
    activityId,
    drawModel,
    pluginShown,
    toggleBufferBtn,
    handleDrawStart,
    handleDrawEnd,
    handleDrawAbort,
    fixedLengthEnabled,
    // Note: fixedLength and fixedAngle are NOT in this dependency array
    // because they are updated separately via updateFixedLengthSettings effect below.
    // This allows users to change length/angle mid-drawing without restarting.
  ]);

  // Separate effect to update fixed length/angle settings in DrawModel
  // This allows user to change direction between segments without restarting drawing
  React.useEffect(() => {
    drawModel.updateFixedLengthSettings(fixedLength, fixedAngle);
  }, [drawModel, fixedLength, fixedAngle]);

  // This effect makes sure to reset the edit- and move-feature if the window is closed,
  // or if the user changes activity. (We don't want to keep the features selected
  // if the user toggles from edit- or move-mode to create mode for example).
  React.useEffect(() => {
    setEditFeature(null);
    setMoveFeatures([]);
  }, [activityId, pluginShown]);

  // Make sure angle snapping is active when the plugin is shown
  React.useEffect(() => {
    angleSnapping.setActive(pluginShown);
    if (!pluginShown) {
      angleSnapping.clearSnapGuides();
    }
  }, [angleSnapping, pluginShown]);

  // Prevent measurement guides from being treated as user-drawn features
  // This effect listens for features being added and immediately marks guides as non-user-drawn
  React.useEffect(() => {
    const source = drawModel?.getCurrentVectorSource?.();
    if (!source) return;

    const handleFeatureAdd = (event) => {
      const feature = event?.feature;
      if (feature && feature.get("USER_MEASUREMENT_GUIDE")) {
        // Measurement guides should not sync to AttributeEditor
        feature.set("USER_DRAWN", false, true); // silent = true
        feature.set("SKETCH_ATTRIBUTEEDITOR", false, true); // Explicitly prevent AttributeEditor sync
      } else if (
        feature &&
        feature.get("USER_DRAWN") &&
        attributeEditorActiveRef.current
      ) {
        // Mark normal user-drawn features for AttributeEditor sync when active
        feature.set("SKETCH_ATTRIBUTEEDITOR", true, true);
      }
    };

    source.on("addfeature", handleFeatureAdd);

    return () => {
      source.un("addfeature", handleFeatureAdd);
    };
  }, [drawModel]);

  // Clear snap guides when activity or draw type changes
  React.useEffect(() => {
    // Clear guides whenever we change activity or draw type
    try {
      angleSnapping.clearSnapGuides();
    } catch (error) {
      // Ignore errors when cleaning up
    }
  }, [activityId, activeDrawType, angleSnapping]);

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
    angleSnapping.setActive(false);
    angleSnapping.clearSnapGuides();
    setPluginShown(false);
    setToggleBufferBtn({ ...toggleBufferBtn, toggle: false });
  };

  // We're gonna need to catch if the user opens the window, and make sure to
  // update the state so that the effect handling the draw-interaction-toggling fires.
  const onWindowShow = () => {
    angleSnapping.setActive(true);
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
        showKinkMarkers={showKinkMarkers}
        setShowKinkMarkers={setShowKinkMarkers}
        pluginShown={pluginShown}
        toggleBufferBtn={toggleBufferBtn}
        setToggleBufferBtn={setToggleBufferBtn}
        setPluginSettings={setPluginSettings}
        map={props.map}
        allowedGeometryTypes={allowedGeometryTypes}
        fixedLengthEnabled={fixedLengthEnabled}
        setFixedLengthEnabled={setFixedLengthEnabled}
        fixedLength={fixedLength}
        setFixedLength={setFixedLength}
        fixedAngle={fixedAngle}
        setFixedAngle={setFixedAngle}
      />
    </BaseWindowPlugin>
  );
};

export default Sketch;
