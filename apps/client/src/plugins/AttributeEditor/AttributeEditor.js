// controller/AttributeEditor.js
import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";
import AttributeEditorView from "./AttributeEditorView";
import Observer from "react-event-observer";
import BugReportIcon from "@mui/icons-material/BugReport";
import AttributeEditorModel, { Action } from "./AttributeEditorModel";
import { createDummyFeatures, FIELD_META } from "./dummy/DummyData";

function AttributeEditor(props) {
  // --- UI-only state (widget-ramen, tema, etc.) ---
  const [ui, setUi] = React.useState({
    title: "AttributeEditor",
    color: null,
    mode: "table", // "table" | "form"
    dark: false,
  });

  // --- Event bus som tidigare ---
  const [localObserver] = React.useState(Observer());

  // --- Model-instans: behåll din klass men med store-API (se patch nedan) ---
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

  // --- Prenumerera på model-state (external store) ---
  const modelState = React.useSyncExternalStore(
    model.subscribe,
    model.getSnapshot,
    model.getSnapshot
  );

  // --- Exempel: lyssna på bus och dispatcha model-actions ---
  React.useEffect(() => {
    const sub = localObserver.subscribe("AttributeEditorEvent", (msg) => {
      switch (msg?.type) {
        case "UNDO":
          model.dispatch({ type: Action.UNDO });
          break;
        case "COMMIT":
          model.dispatch({ type: Action.COMMIT });
          break;
        // lägg till fler event-mappningar vid behov
        default:
          // console.log("AttributeEditorEvent:", msg);
          break;
      }
    });
    return () => localObserver.unsubscribe(sub);
  }, [localObserver, model]);

  // --- Controller: tunna handlers som bara dispatchar till modellen (eller uppdaterar UI-state) ---
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
        title: ui.title,
        color: ui.color,
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
        // — gamla props som du skickade —
        model={model}
        app={props.app}
        localObserver={localObserver}
        globalObserver={props.app.globalObserver}
        updateCustomProp={updateCustomProp}
        winheight={props.options.winheight}
        // — nya props: tillgång till data och actions —
        state={modelState} // features, pending*, undoStack, etc.
        controller={controller} // editCell, batchEdit, commit, undo, toggleDelete, duplicateRows, setMode, setDark...
        ui={ui} // mode/dark m.m.
      />
    </BaseWindowPlugin>
  );
}

export default AttributeEditor;
