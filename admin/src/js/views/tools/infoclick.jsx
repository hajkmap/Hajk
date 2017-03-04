import React from "react";
import { Component } from "react";

var defaultState = {
  validationErrors: [],
  active: false,
  markerImg: "assets/icons/marker.png",
  displayPopup: false,
  imgSizeX: 32,
  imgSizeY: 32,
  anchorX: 16,
  anchorY: 16
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
    this.type = "infoclick";
  }

  componentDidMount() {
    var tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        markerImg: tool.options.markerImg,
        displayPopup: tool.options.displayPopup,
        imgSizeX: tool.options.imgSize[0] || this.state.imgSizeX,
        imgSizeY: tool.options.imgSize[1] || this.state.imgSizeX,
        anchorX: tool.options.anchor[0] || this.state.anchorX,
        anchorY: tool.options.anchor[1] || this.state.anchorY
      });
    } else {
      this.setState({
        active: false
      });
    }
  }

  componentWillUnmount() {
  }
  /**
   *
   */
  componentWillMount() {
  }

  handleInputChange(event) {
    const target = event.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    this.setState({
      [name]: !isNaN(Number(value)) ? Number(value) : value
    });
  }

  getTool() {
    return this.props.model.get('toolConfig').find(tool => tool.type === this.type);
  }

  add(tool) {
    this.props.model.get("toolConfig").push(tool);
  }

  remove(tool) {
    this.props.model.set({
      "toolConfig": this.props.model.get("toolConfig").filter(tool => tool.type !== this.type)
    });
  }

  replace(tool) {
    this.props.model.get('toolConfig').forEach(t => {
      if (t.type === this.type) {
        t.options = tool.options;
      }
    });
  }

  save() {

    var tool = {
      "type": this.type,
      "options": {
        displayPopup: this.state.displayPopup,
        markerImg: this.state.markerImg,
        anchor: [this.state.anchorX, this.state.anchorY],
        imgSize: [this.state.imgSizeX, this.state.imgSizeY]
      }
    };

    var existing = this.getTool();

    function update() {
      this.props.model.updateToolConfig(this.props.model.get("toolConfig"), () => {
        this.props.parent.props.parent.setState({
          alert: true,
          alertMessage: "Uppdateringen lyckades"
        });
      });
    }

    if (!this.state.active) {
      if (existing) {
        this.props.parent.props.parent.setState({
          alert: true,
          confirm: true,
          alertMessage: "Verktyget kommer att tas bort. Nuvarande inställningar kommer att gå förlorade. Vill du fortsätta?",
          confirmAction: () => {
            this.remove();
            update.call(this);
            this.setState(defaultState);
          }
        });
      } else {
        this.remove();
        update.call(this);
      }
    } else {
      if (existing) {
        this.replace(tool);
      } else {
        this.add(tool);
      }
      update.call(this);
    }
  }

  /**
   *
   */
  render() {
    return (
      <div>
        <form>
          <p>
            <button className="btn btn-primary" onClick={(e) => {e.preventDefault(); this.save()}}>Spara</button>
          </p>
          <div>
            <input
              id="active"
              name="active"
              type="checkbox"
              onChange={(e) => {this.handleInputChange(e)}}
              checked={this.state.active}/>&nbsp;
            <label htmlFor="active">Aktiverad</label>
          </div>
          <div>
            <label htmlFor="markerImg">Bild för markering</label>
            <input value={this.state.markerImg} type="text" name="markerImg" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="anchorX">Ikonförskjutning X</label>
            <input value={this.state.anchorX} type="text" name="anchorX" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="anchorY">Ikonförskjutning Y</label>
            <input value={this.state.anchorY} type="text" name="anchorY" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="imgSizeX">Bildbredd</label>
            <input value={this.state.imgSizeX} type="text" name="imgSizeX" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="imgSizeY">Bildhöjd</label>
            <input value={this.state.imgSizeY} type="text" name="imgSizeY" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <input
              id="displayPopup"
              name="displayPopup"
              type="checkbox"
              onChange={(e) => {this.handleInputChange(e)}}
              checked={this.state.displayPopup}/>&nbsp;
            <label htmlFor="displayPopup">Visa som popup</label>
          </div>
        </form>
      </div>
    )
  }

}

export default ToolOptions;
