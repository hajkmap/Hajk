import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import PropTypes from "prop-types";
import { withSnackbar } from "notistack";
import ExportPdfSettings from "./components/ExportPdfSettings.js";

const styles = theme => ({});

class ExportView extends Component {
  state = {};

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.app = this.props.app;
    this.localObserver = this.props.localObserver;
  }

  componentDidMount() {}

  componentWillUnmount() {}

  render() {
    return (
      <>
        <ExportPdfSettings model={this.model} />
      </>
    );
  }
}

ExportView.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(withSnackbar(ExportView));
