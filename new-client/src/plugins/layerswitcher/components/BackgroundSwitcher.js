import React, { Component } from "react";
import "./BackgroundSwitcher.css";

class BackgroundSwitcher extends Component {

  constructor() {
    super();
    this.onChange = this.onChange.bind(this);
    this.state = {
      selectedLayer: -1
    }
  }

  onChange(e) {      
    if (Number(this.state.selectedLayer) > 0) {
      this.props.layerMap[Number(this.state.selectedLayer)].setVisible(false);            
    }
    if (Number(e.target.value) > 0) {
      this.props.layerMap[Number(e.target.value)].setVisible(true);
    }
    
    if (e.target.value === "-2")  {
      document.getElementById("map").style.backgroundColor = "#000";
    } else {
      document.getElementById("map").style.backgroundColor = "#FFF";
    } 

    this.setState({
      selectedLayer: e.target.value
    });    
  }

  componentWillMount() {    
    this.props.layers
      .filter(layer => layer.visibleAtStart)
      .forEach((layer, i) => {
        if (i !== 0) {
          this.props.layerMap[Number(layer.id)].setVisible(false);      
        } else {
          this.setState({
            selectedLayer: layer.id
          });
        }
      });
  }

  renderRadioButton(config, index) {
        
    var caption
      , checked
      , mapLayer = this.props.layerMap[Number(config.id)];
            
    if (mapLayer) {
      caption = mapLayer.get('layerInfo').caption;
    } else {
      caption = config.caption;
    }
    checked = this.state.selectedLayer === config.id;  
    
    return (
      <div key={index}>
        <input 
          onChange={this.onChange.bind(this)} 
          checked={checked} 
          value={config.id || config}
          id={caption + "_" + index} 
          type="radio" 
          name="background">
        </input>
        <label htmlFor={caption + "_" + index}>{caption}</label>
      </div>
    )

  }

  renderBaseLayerComponents() {    
    var radioButtons = []
    
    radioButtons = [
      ...radioButtons,
      ...[
        this.renderRadioButton({
          id: "-1",
          caption: "Vit"
        }, -1),
        this.renderRadioButton({
          id: "-2",
          caption: "Svart"
        }, -2)
      ]
    ];

    radioButtons = [
      ...radioButtons, 
      ...this.props.layers.map((layerConfig, i) => 
        this.renderRadioButton(layerConfig, i)
      )
    ];

    return radioButtons;
  }

  render() {
  	return (
      <div>
    		<h1>Bakgrundskartor</h1>
        {this.renderBaseLayerComponents()}
      </div>
    );
  }
}

export default BackgroundSwitcher;
