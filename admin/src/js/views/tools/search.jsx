import React from "react";
import { Component } from "react";

var defaultState = {
  validationErrors: [],
  toolbar: "bottom",
  active: false,
  onMap: false,
  selectionTools: true,
  filterVisible: true,
  displayPopup: true,
  maxZoom: 14,
  excelExportUrl: "/mapservice/export/excel",
  kmlExportUrl: "/mapservice/export/kml",
  markerImg: "http://localhost/hajk/assets/icons/marker.png",
  anchorX: 16,
  anchorY: 32,
  imgSizeX: 32,
  imgSizeY: 32
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
    this.type = "search";
  }

  componentDidMount() {
    var tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        onMap: tool.options.onMap,
        maxZoom: tool.options.maxZoom,
        markerImg: tool.options.markerImg,
        kmlExportUrl: tool.options.kmlExportUrl,
        excelExportUrl: tool.options.excelExportUrl,
        selectionTools: tool.options.selectionTools,
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
        onMap: this.state.onMap,
        toolbar: this.state.onMap ? '' : 'bottom',
        maxZoom: this.state.maxZoom,
        markerImg: this.state.markerImg,
        kmlExportUrl: this.state.kmlExportUrl,
        excelExportUrl: this.state.excelExportUrl,
        displayPopup: this.state.displayPopup,
        selectionTools: this.state.selectionTools,
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
            <input
              id="onMap"
              name="onMap"
              type="checkbox"
              onChange={(e) => {this.handleInputChange(e)}}
              checked={this.state.onMap}/>&nbsp;
            <label htmlFor="onMap">Alltid synlig</label>
          </div>
          <div>
            <input
              id="displayPopup"
              name="displayPopup"
              type="checkbox"
              onChange={(e) => {this.handleInputChange(e)}}
              checked={this.state.displayPopup}/>&nbsp;
            <label htmlFor="displayPopup">Visa popup</label>
          </div>
          <div>
            <input
              id="selectionTools"
              name="selectionTools"
              type="checkbox"
              onChange={(e) => {this.handleInputChange(e)}}
              checked={this.state.selectionTools}/>&nbsp;
            <label htmlFor="selectionTools">Verktyg för ytsökning</label>
          </div>
          <div>
            <label htmlFor="active">Zoomnivå</label>
            <input value={this.state.maxZoom} type="text" name="maxZoom" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="excelExportUrl">URL Excel-tjänst</label>
            <input value={this.state.excelExportUrl} type="text" name="excelExportUrl" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="kmlExportUrl">URL KML-tjänst</label>
            <input value={this.state.kmlExportUrl} type="text" name="kmlExportUrl" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="markerImg">Ikon för sökträff</label>
            <input value={this.state.markerImg} type="text" name="markerImg" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="anchorX">Ikonförskjutning X</label>
            <input value={this.state.anchorX} type="text" name="anchorX" onChange={(e) => {this.handleInputChange(e)}}></input>
          </div>
          <div>
            <label htmlFor="active">Ikonförskjutning Y</label>
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
        </form>
      </div>
    )
  }
}

export default ToolOptions;
