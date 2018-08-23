import React, { Component } from "react";
import "./BreadCrumb.css";

class BreadCrumb extends Component {
  constructor() {
    super();
    this.state = {
    };
  }
  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount() {
  }

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount() {}  

  setLayerVisibility = (layer) => (event) => {
    layer.set('visible', !layer.get('visible'));
  };

  render() {        
    return (
      <div className="bread-crumb">
        <div className="bread-crumb-header">
          <span>{this.props.title} <i className="material-icons" onClick={this.setLayerVisibility(this.props.layer)}>close</i></span>
        </div>
        <div className="bread-crumb-body">
          <a href="#">Läs mer</a>
        </div>
      </div>
    );
  }
}

export default BreadCrumb;
