import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";
import AttributeEditorView from "./AttributeEditorView";
import Observer from "react-event-observer";
import BugReportIcon from "@mui/icons-material/BugReport";
import AttributeEditorModel, { Action } from "./AttributeEditorModel";
import { createDummyFeatures, FIELD_META } from "./dummy/DummyData";
import { editBus } from "../../buses/editBus";
import { PLUGIN_COLORS } from "./constants/index";

function AttributeEditor(props) {
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
    const offSel = editBus.on("edit:service-selected", (ev) => {
      const { title, color, source } = ev.detail || {};
      if (source === "attrib") return;
      setPluginSettings((u) => ({
        ...u,
        title: title ?? u.title,
        color: color ?? u.color,
      }));
    });

    const offClr = editBus.on("edit:service-cleared", (ev) => {
      const { source } = ev.detail || {};
      if (source === "attrib") return;
      setPluginSettings((u) => ({
        ...u,
        title: DEFAULT_TITLE,
        color: PLUGIN_COLORS.default,
      }));
    });

    return () => {
      offSel();
      offClr();
    };
  }, []);

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
      />
    </BaseWindowPlugin>
  );
}

export default AttributeEditor;
