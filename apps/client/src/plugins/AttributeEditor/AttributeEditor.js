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

  const [serviceList, setServiceList] = React.useState([]);

  const styles = React.useMemo(() => {
    const baseStroke = new Stroke({ color: "#1976d2", width: 2 });
    const baseFill = new Fill({ color: "rgba(25, 118, 210, 0.73)" });
    return {
      selected: new Style({
        image: new CircleStyle({
          radius: 7,
          fill: new Fill({ color: "#ff9800" }),
          stroke: new Stroke({ color: "#fff", width: 2 }),
        }),
        stroke: new Stroke({ color: "#ff9800", width: 3 }),
        fill: new Fill({ color: "rgba(255,152,0,0.12)" }),
        zIndex: 3,
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
        fill: new Fill({ color: "rgba(0,0,0,0.04)" }),
        zIndex: 1,
      }),
    };
  }, []);

  const styleFn = React.useCallback(
    (feature) => {
      const id = feature.getId?.() ?? feature.get("id");
      const selected = selectedIdsRef.current.has(id);
      const visible = visibleIdsRef.current.has(id);

      if (onlyFilteredRef.current && !visible && !selected) return null;
      if (selected) return styles.selected;
      if (visible) return styles.visible;
      return styles.dimmed;
    },
    [styles]
  );

  React.useEffect(() => {
    let cancelled = false;

    async function loadCaptions() {
      try {
        // 1) Fetch the entire list at once (for fallback lookup)
        const all = await ogc.fetchWfstList(
          "id,caption,title,name,projection,layers"
        );
        const allArr = Array.isArray(all) ? all : (all?.layers ?? []);

        // 2) For each active id: fetch metadata and create a robust object
        const items = await Promise.all(
          (props.options?.activeServices ?? []).map(async ({ id }) => {
            try {
              const meta = await ogc.getServiceMeta(id);
              // coalesce: caption/title/name/label
              const title =
                meta?.caption?.trim() ||
                meta?.title?.trim() ||
                meta?.name?.trim() ||
                // fallback: look up in the list if getServiceMeta didn't return anything
                (
                  allArr.find((x) => (x.id ?? x.uuid) === id)?.caption ?? ""
                ).trim() ||
                id;

              return {
                id,
                title,
                projection: meta?.projection,
                layers: meta?.layers,
              };
            } catch {
              // fallback: let's search in allArr
              const m = allArr.find((x) => (x.id ?? x.uuid) === id);
              return {
                id,
                title: m?.caption || m?.title || id,
                projection: m?.projection,
                layers: m?.layers,
              };
            }
          })
        );

        if (!cancelled) setServiceList(items.filter(Boolean));
      } catch (e) {
        if (!cancelled) setServiceList([]);
        console.warn("Kunde inte läsa captions:", e);
      }
    }

    const active = props.options?.activeServices ?? [];
    if (active.length) loadCaptions();
    else setServiceList([]);

    return () => {
      cancelled = true;
    };
  }, [ogc, props.options?.activeServices, setServiceList]);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      const ids =
        props.options?.activeServices?.map((x) => x.id).filter(Boolean) || [];

      // fetch metadata per id (caption, possibly layers and projection)
      const metas = await Promise.all(
        ids.map(async (id) => {
          try {
            const m = await ogc.fetchWfstMeta(id); // see helper futher down
            return {
              id,
              title: m?.caption || id,
              projection: m?.projection,
              layers: m?.layers || [],
            };
          } catch {
            return { id, title: id };
          }
        })
      );

      if (alive) setServiceList(metas);
    })();

    return () => {
      alive = false;
    };
  }, [ogc, props.options?.activeServices]);

  React.useEffect(() => {
    const offSel = editBus.on("edit:service-selected", async (ev) => {
      const { title, color, source, id, projection } = ev.detail || {};
      if (source === "attrib") return;

      setPluginSettings((u) => ({
        ...u,
        title: title ?? u.title,
        color: color ?? u.color,
      }));

      model.dispatch({ type: Action.INIT, features: [] });
      model.setFieldMetadata([]);

      try {
        // 1) load features from service via model
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
        lyr.setStyle(styleFn);
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
  }, [model, props.map, setPluginSettings, styleFn]);

  const highlightFeatureById = React.useCallback(
    (fid) => {
      const size = props.map.getSize() || [0, 0];

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

      const top = 20,
        bottom = 20,
        left = 20;
      // Make the sidebar "wide" so the object wraps around the image.
      // 35–45% of the map width is a good breakpoint for desktop.
      const right = Math.round(size[0] * 0.4);

      props.map.getView().fit(feat.getGeometry().getExtent(), {
        maxZoom: 4,
        duration: 250,
        padding: [top, right, bottom, left],
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
        vectorLayerRef={vectorLayerRef}
        styleFn={styleFn}
        visibleIdsRef={visibleIdsRef}
        selectedIdsRef={selectedIdsRef}
        onlyFilteredRef={onlyFilteredRef}
        serviceList={serviceList}
      />
    </BaseWindowPlugin>
  );
}

export default AttributeEditor;
