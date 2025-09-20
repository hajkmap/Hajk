import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";
import AttributeEditorView from "./AttributeEditorView";
import Observer from "react-event-observer";
import BugReportIcon from "@mui/icons-material/BugReport";
import AttributeEditorModel, { Action } from "./AttributeEditorModel";
import { createDummyFeatures, FIELD_META } from "./dummy/DummyData";
import { editBus } from "../../buses/editBus";
import { PLUGIN_COLORS } from "./constants/index";
import { createOgcApi } from "./api/ogc";

import GeoJSON from "ol/format/GeoJSON";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import { Style, Circle as CircleStyle, Fill, Stroke } from "ol/style";

function AttributeEditor(props) {
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
      initialFeatures: props.options?.initialFeatures ?? createDummyFeatures(),
      fieldMeta: FIELD_META,
    });
  }
  const model = modelRef.current;

  const modelState = React.useSyncExternalStore(
    model.subscribe,
    model.getSnapshot,
    model.getSnapshot
  );

  React.useEffect(() => {
    const offSel = editBus.on("edit:service-selected", async (ev) => {
      const { title, color, source, id, projection } = ev.detail || {};
      if (source === "attrib") return;

      setPluginSettings((u) => ({
        ...u,
        title: title ?? u.title,
        color: color ?? u.color,
      }));

      try {
        // 1) load features via model
        const { featureCollection } = (await model.loadFromService?.(id)) || {};

        // 2) build/create vector layer in the map
        const map = props.map;
        const mapProj = map.getView().getProjection();
        const dataProj =
          projection || featureCollection?.crs?.properties?.name || "EPSG:3006"; // fallback – dina koordinater ser ut som 3006

        // rebuild vector layer
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

        map.addLayer(lyr);
        vectorLayerRef.current = lyr;

        // 3) zoom to the data - shortcut: fit the extent of the features
        const extent = src.getExtent();
        if (extent) {
          map
            .getView()
            .fit(extent, { padding: [20, 20, 20, 20], duration: 300 });
        }
      } catch (e) {
        console.warn("loadFromService fel:", e);
      }
    });

    const offClr = editBus.on("edit:service-cleared", (ev) => {
      const { source } = ev.detail || {};
      if (source === "attrib") return;

      setPluginSettings((u) => ({
        ...u,
        title: DEFAULT_TITLE,
        color: PLUGIN_COLORS.default,
      }));

      model.dispatch({ type: Action.INIT, features: [] });
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
  }, [model, props.map, setPluginSettings]);

  const highlightFeatureById = React.useCallback(
    (fid) => {
      const src = vectorLayerRef.current?.getSource?.();
      if (!src) return;
      let feat = src.getFeatureById(fid);
      if (!feat) {
        // fallback: find via attribute if id does not match an OL feature
        feat = src
          .getFeatures()
          .find((f) => f.get("id") === fid || f.get("ID") === fid);
        if (feat && !feat.getId()) feat.setId(fid);
      }
      if (!feat) return;

      props.map.getView().fit(feat.getGeometry().getExtent(), {
        maxZoom: 17,
        duration: 250,
        padding: [20, 20, 20, 20],
      });
    },
    [props.map]
  );

  React.useEffect(() => {
    const off = editBus.on("attrib:focus-id", (ev) => {
      const id = ev?.detail?.id;
      if (id) highlightFeatureById(id);
    });
    return () => off();
  }, [highlightFeatureById]);

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
          annotateField: "ar_anteckning",
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
        fieldMeta={model.getFieldMetadata()}
      />
    </BaseWindowPlugin>
  );
}

export default AttributeEditor;
