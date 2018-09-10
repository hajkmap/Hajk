import Plugin from '../../models/Plugin.js';
import Dialog from '../../components/Dialog.js';
import React, { Component } from "react";
import { createPortal } from "react-dom";
import InfoIcon from "@material-ui/icons/Info";

class Infomation extends Plugin {
  constructor(spec) {
    super(spec);
    this.text = "Infomation";
  }

  onClose = () => {
    this.setState({
      dialogOpen: false
    });
  };

  onClick() {
    this.setState({
      dialogOpen: true
    });
  }

  getButton() {
    return <InfoIcon />;
  }

  getPanel(activePanel) {

    var open = this.getState().dialogOpen === undefined
      ? this.options.visibleAtStart
      : this.getState().dialogOpen;

    this.dialog = (
      <Dialog
        options={this.options}
        open={open}
        onClose={this.onClose}>
      </Dialog>
    );
    return createPortal(this.dialog, document.getElementById("map"));
  }
}

export default Infomation;