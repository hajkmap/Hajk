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
    var infoclick = this.props.model.get("toolConfig").filter(tool => tool.type === "bookmark")[0];
    this.setState({
      active: !!infoclick
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
        "type": "bookmark",
        "options": {
        }
      });

    } else {
      this.props.model.set({
        "toolConfig": this.props.model.get("toolConfig").filter(tool => tool.type !== "bookmark")
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
