import React from "react";
import { Component } from "react";
import SaveIcon from "@material-ui/icons/Save";

var defaultState = {
  validationErrors: [],
  transformations: [],
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
    this.type = "";
  }

  componentDidMount() {
    if (this.getTool()) {
      this.setState({
        active: true,
        index: tool.index,
        transformations: this.getTool().options.transformations || [],
      });
    } else {
      this.setState({
        active: false,
      });
    }
  }

  /**
   *
   */

  activeChanged(e) {
    this.setState({
      active: e.target.checked,
    });
  }

  getTool() {
    return this.props.model
      .get("toolConfig")
      .find((tool) => tool.type === this.type);
  }

  add(tool) {
    this.props.model.get("toolConfig").push(tool);
  }

  remove(tool) {
    this.props.model.set({
      toolConfig: this.props.model
        .get("toolConfig")
        .filter((tool) => tool.type !== this.type),
    });
  }

  replace(tool) {
    this.props.model.get("toolConfig").forEach((t) => {
      if (t.type === this.type) {
        t.options = tool.options;
        t.index = tool.index;
      }
    });
  }

  save() {
    var tool = {
      type: this.type,
      index: this.state.index,
      options: {
        transformations: this.state.transformations,
      },
    };

    var existing = this.getTool();

    function update() {
      this.props.model.updateToolConfig(
        this.props.model.get("toolConfig"),
        () => {
          this.props.parent.props.parent.setState({
            alert: true,
            alertMessage: "Uppdateringen lyckades",
          });
        }
      );
    }

    if (!this.state.active) {
      if (existing) {
        this.props.parent.props.parent.setState({
          alert: true,
          confirm: true,
          alertMessage:
            "Verktyget kommer att tas bort. Nuvarande inställningar kommer att gå förlorade. Vill du fortsätta?",
          confirmAction: () => {
            this.remove();
            update.call(this);
            this.setState({
              transformations: [],
            });
          },
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
        <p>
          <button className="btn btn-primary" onClick={() => this.save()}>
            <SaveIcon className="button-icon-vertical-align" />
            Spara
          </button>
        </p>
        <div>
          <input
            id="active"
            name="active"
            type="checkbox"
            onChange={(e) => {
              this.activeChanged(e);
            }}
            checked={this.state.active}
          />
          &nbsp;
          <label htmlFor="active">Aktiverad</label>
        </div>
        <div>
          <label htmlFor="index">Sorteringsordning</label>
          <input
            id="index"
            name="index"
            type="number"
            min="0"
            onChange={(e) => {
              this.handleInputChange(e);
            }}
            value={this.state.index}
          />
        </div>
      </div>
    );
  }
}

export default ToolOptions;
