import React, { Component } from "react";
import CloseIcon from "@material-ui/icons/Close";
import "./BreadCrumb.css";

class BreadCrumb extends Component {
  constructor() {
    super();
    this.state = {};
  }
  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount() {}

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount() {}

  setLayerVisibility = layer => event => {
    layer.set("visible", !layer.get("visible"));
  };

  render() {
    return (
      <div className="bread-crumb">
        <div className="bread-crumb-header">
          <span>
            {this.props.title}{" "}
            <CloseIcon
              className="pointer"
              onClick={this.setLayerVisibility(this.props.layer)}
            />
          </span>
        </div>
      </div>
    );
  }
}

export default BreadCrumb;
