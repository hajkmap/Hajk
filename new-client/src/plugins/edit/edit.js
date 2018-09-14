import Plugin from "../../models/Plugin.js";
import Panel from "../../components/Panel.js";
import React from "react";
import { createPortal } from "react-dom";
import EditIcon from "@material-ui/icons/Edit";

// Super simple example that demonstrates that even
// super simple component's render is called 3 times.
// This happens because each plugin's getPanel() is called
// 3 times from App.js, AND IT IS IN getPanel() THAT THE
// <EditComponent> COMPONENT IS CREATED. NO WONDER IT CALLS
// render() 3 TIMES!
class EditComponent extends React.Component {
  componentWillMount() {
    console.log("Will mount EditComponent");
  }
  render() {
    console.log("Will render EditComponent");
    return <h1>Hello</h1>;
  }
}
class Edit extends Plugin {
  constructor(spec) {
    super(spec);
    this.text = "Mät";
  }

  // onClick(e, appComponent) {
  //   console.log("Override default behaviour on click.");
  // }

  getButton() {
    return <EditIcon />;
  }

  getPanel(activePanel) {
    const active = activePanel === this.type;
    console.log(`${this.type} is active? ${active}`);

    return createPortal(
      <Panel
        active={active}
        type={this.type}
        title={this.text}
        onClose={this.closePanel}
      >
        <EditComponent />
      </Panel>,
      document.getElementById("map-overlay")
    );
  }
}

export default Edit;
