import React, { Component } from "react";
import Button from '@material-ui/core/Button'; 

class Collector extends Component {
  
  constructor(props) {
    super(props);
    this.state = {};
    this.save = this.save.bind(this);
  }
  
  save() {
    console.log("Save", this.state);
  }

  onInputChange(ref, value) {
    this.setState({
      [ref]: value
    });
  }

  render() {
    if (!this.props.visible) return null;    
    return (
      <div>
        <div><label>Apa 1</label><input value={this.state.value} ref="apa1" onChange={(e) => this.onInputChange("apa1", e.target.value)} type="text"/></div>
        <div><label>Apa 2</label><input value={this.state.value} ref="apa2" onChange={(e) => this.onInputChange("apa2", e.target.value)} type="text"/></div>
        <div><label>Apa 3</label><input value={this.state.value} ref="apa3" onChange={(e) => this.onInputChange("apa3", e.target.value)} type="text"/></div>
        <div><label>Apa 4</label><input value={this.state.value} ref="apa4" onChange={(e) => this.onInputChange("apa4", e.target.value)} type="text"/></div>
        <Button color="primary" onClick={this.save}>
          Spara
        </Button>&nbsp;  
      </div>
    )
  }
}

export default Collector;