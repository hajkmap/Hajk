import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import CollectorForm from "./components/CollectorForm.js";
import "./style.css";

const styles = theme => {
  return {
    hidden: {
      display: "none"
    },
    popup: {
      position: "absolute",
      left: "50%",
      top: "10%",
      bottom: "50%",
      width: "360px",
      marginLeft: "-180px",
      border: "1px solid #ccc",
      boxShadow: "3px 4px 5px rgba(0, 0, 0, 0.5)",
      borderRadius: "10px",
      zIndex: 1200,
      background: "white",
      padding: "20px",
      [theme.breakpoints.down("xs")]: {
        left: "10px",
        right: "10px",
        marginLeft: "auto",
        width: "auto"
      }
    },
    right: {
      float: "right"
    },
    left: {
      float: "left"
    }
  };
};

class CollectorView extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.model = props.model;
  }

  componentDidMount() {}

  onClose = () => {
    this.props.onClose();
  };

  render() {
    return (
      <CollectorForm
        localObserver={this.props.localObserver}
        model={this.model}
        onClose={this.onClose}
        form={this.props.form}
        serviceConfig={this.props.serviceConfig}
        options={this.props.options}
      />
    );
  }
}

export default withStyles(styles)(CollectorView);
