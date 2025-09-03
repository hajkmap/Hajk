import React from "react";
import BaseWindowPlugin from "../BaseWindowPlugin";
import AttributeEditorModel from "./AttributeEditorModel";
import AttributeEditorView from "./AttributeEditorView";
import Observer from "react-event-observer";
import BugReportIcon from "@mui/icons-material/BugReport";

function AttributeEditor(props) {
  const [state, setState] = React.useState({
    title: "AttributeEditor",
    color: null,
  });

  const [localObserver] = React.useState(Observer());
  const [attributeEditorModel] = React.useState(
    () =>
      new AttributeEditorModel({
        localObserver,
        app: props.app,
        map: props.map,
      })
  );

  React.useEffect(() => {
    const sub = localObserver.subscribe("AttributeEditorEvent", (message) => {
      console.log(message);
    });
    return () => {
      localObserver.unsubscribe(sub);
    };
  }, [localObserver]);

  const updateCustomProp = (prop, value) => {
    setState((prev) => ({ ...prev, [prop]: value }));
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
        title: state.title,
        color: state.color,
        description: "En kort beskrivning som visas i widgeten",
        customPanelHeaderButtons: [
          {
            icon: <BugReportIcon />,
            onClickCallback: panelHeaderButtonCallback,
          },
        ],
        height: "dynamic",
        width: 1000,
      }}
    >
      <AttributeEditorView
        model={attributeEditorModel}
        app={props.app}
        localObserver={localObserver}
        globalObserver={props.app.globalObserver}
        updateCustomProp={updateCustomProp}
      />
    </BaseWindowPlugin>
  );
}

export default AttributeEditor;
