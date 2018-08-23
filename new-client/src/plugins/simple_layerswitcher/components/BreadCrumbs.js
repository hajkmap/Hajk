import React, { Component } from "react";
import BreadCrumb from "./BreadCrumb.js";
import "./BreadCrumbs.css";

class BreadCrumbs extends Component {
  constructor() {
    super();
    this.state = {      
      visibleLayers: []
    };    
  }

  bindLayerEvents = (visibleLayers) => (layer) => {    
        
    if (layer.get('visible')) {
      visibleLayers.push(layer);
    }
    this.setState({
      visibleLayers: visibleLayers
    });  
    layer.on('change:visible', (e) => {      
      let changedLayer = e.target;
      if (changedLayer.get("visible")) {
        this.setState({
          visibleLayers: [...this.state.visibleLayers, changedLayer]
        });
      } else {
        this.setState({
          visibleLayers: this.state.visibleLayers.filter(visibleLayer => 
            visibleLayer !== changedLayer)
        });
      } 
    })    
  };

  getVisibleLayers() {
    return this.props.map.getLayers().getArray().filter(layer => 
      layer.getVisible());
  }

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount() {    
    var visibleLayers = [];
    this.props.map.getLayers().getArray().forEach(this.bindLayerEvents(visibleLayers));

  }

  /**
   * Triggered when component unmounts.
   * @instance
   */
  componentWillUnmount() {}

  /**
   * On visible change event handler.
   * @instance
   */
  onVisibleChanged() {}

  /**
   * On legend change event handler.
   * @instance
   */
  onLegendChanged() {}

  /**
   * On show legend change event handler.
   * @instance
   */
  onShowLegendChanged() {}

  /**
   * On show info change event handler.
   * @instance
   */
  onShowInfoChanged() {}

  /**
   * Toggle legend visibility
   * @instance
   */
  toggleLegend() {}

  /**
   * Toggle info visibility
   * @instance
   */
  toggleInfo() {}

  /**
   * Render the load information component.
   * @instance
   * @return {external:ReactElement}
   */
  renderStatus() {
  }

  render() {
    return (
      <div className="bread-crumbs">
        {this.state.visibleLayers
          .filter(layer => 
            layer.getProperties().layerInfo 
            ? layer.getProperties().layerInfo.layerType !== "base"
            : false
          )
          .map((layer, i) => 
            <BreadCrumb key={i} title={layer.get("caption")} layer={layer}></BreadCrumb>
          )
        }
      </div>
    );
  }
}

export default BreadCrumbs;
