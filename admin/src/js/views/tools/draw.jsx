import React from "react";
import { Component } from "react";

var defaultState = {
  validationErrors: []
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
  }

  componentDidMount() {
    var draw = this.props.model.get("toolConfig").filter(tool => tool.type === "draw")[0];
    this.setState({
      active: !!draw
    });
  }

  componentWillUnmount() {
  }
  /**
   *
   */
  componentWillMount() {
  }

  activeChanged(e) {
    this.setState({
      active: e.target.checked
    });
  }

  save() {

    if (this.state.active) {

      this.props.model.get("toolConfig").push({
        "type": "draw",
        "options": {
          "markerImg": "assets/icons/marker.png",
          "anchor": [
            16,
            32
          ],
          "imgSize": [
            32,
            32
          ]
        }
      });

    } else {
      this.props.model.set({
        "toolConfig": this.props.model.get("toolConfig").filter(tool => tool.type !== "draw")
      });
    }

    this.props.model.updateToolConfig(this.props.model.get("toolConfig"), () => {
      this.props.parent.props.parent.setState({
        alert: true,
        alertMessage: "Uppdateringen lyckades"
      });
    });

  }

  /**
   *
   */
  render() {
    return (
      <div>
        <p>
          <button className="btn btn-primary" onClick={() => this.save()}>Spara</button>
        </p>
        <div>
          <input
            id="active"
            name="active"
            type="checkbox"
            onChange={(e) => {this.activeChanged(e)}}
            checked={this.state.active}>
          </input>&nbsp;
          <label htmlFor="active">Aktiverad</label>
        </div>
      </div>
    )
  }

}

export default ToolOptions;
