import Plugin from '../../models/Plugin.js';
import Panel from '../../components/Panel.js';
import React, { Component } from "react";
import { createPortal } from "react-dom";
import EditIcon from "@material-ui/icons/Edit";

class Edit extends Plugin {
  constructor(spec) {
    super(spec);
  }

  getButton() {
    return <EditIcon />;
  }

  getPanel(activePanel) {
    const active = activePanel === this.type;
    return createPortal(<Panel active={active} type={this.type}/>, document.getElementById("map"));
  }
}

export default Edit;