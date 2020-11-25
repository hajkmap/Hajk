import React, { Component } from "react";
import CollectorForm from "./components/CollectorForm.js";
import "./style.css";

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

export default CollectorView;
