import React from "react";
import { Component } from "react";
import $ from "jquery";
import Button from "@material-ui/core/Button";
import AddIcon from "@material-ui/icons/Add";
import CancelIcon from "@material-ui/icons/Cancel";
import DoneIcon from "@material-ui/icons/Done";
import RemoveIcon from "@material-ui/icons/Remove";
import SaveIcon from "@material-ui/icons/SaveSharp";
import { withStyles } from "@material-ui/core/styles";
import { red, green, blue } from "@material-ui/core/colors";

const examples = [
  {
    name: "Google Street view",
    uri: "https://maps.google.com/?q=&layer=c&cbll={y|EPSG:4326|4},{x|EPSG:4326|4}",
  },
  {
    name: "Google maps",
    uri: "https://maps.google.com/?q={y|EPSG:4326|4},{x|EPSG:4326|4}&ll={y|EPSG:4326|4},{x|EPSG:4326|4}&z=20",
  },
  {
    name: "OpenStreetMap",
    uri: "https://www.openstreetmap.org/#map=19/{y|EPSG:4326|4}/{x|EPSG:4326|4}",
  },
];

const ColorButtonRed = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700],
    },
  },
}))(Button);

const ColorButtonGreen = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700],
    },
  },
}))(Button);

const ColorButtonBlue = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700],
    },
  },
}))(Button);

class ToolOptions extends Component {
  constructor() {
    super();
    this.type = "externalLinks";
    this.state = {
      validationErrors: [],
      list: [],
      active: false,
      index: 0,
      //z target: "toolbar",
      //z instruction: "",
      visibleAtStart: false,
      visibleForGroups: [],
      editing: null,
      showResults: false,
    };
    $(".list-container li").editable(this);
  }

  componentDidMount() {
    var tool = this.getTool();
    if (tool) {
      const list = tool.options?.list || [];
      this.setState({
        active: true,
        authActive: this.props.parent.props.parent.state.authActive,
        index: tool.index,
        list: list,
        visibleAtStart: tool.options.visibleAtStart,
        visibleForGroups: tool.options.visibleForGroups
          ? tool.options.visibleForGroups
          : [],
      });

      if(list.length === 0){
        this.setState({
          list: [...examples],
        });
      }

    } else {
      this.setState({
        active: false,
      });
    }
  }

  handleInputChange(event) {
    var target = event.target;
    var name = target.name;
    var value = target.type === "checkbox" ? target.checked : target.value;
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value;
    }

    if (name === "instruction") {
      value = btoa(value);
    }
    this.setState({
      [name]: value,
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
        t.instruction = tool.instruction;
      }
    });
  }

  save() {
    var tool = {
      type: this.type,
      index: this.state.index,
      options: {
        //z target: this.state.target,
        //z position: this.state.position,
        //z width: this.state.width,
        //z height: this.state.height,
        list: this.state.list,
        //z instruction: this.state.instruction,
        visibleForGroups: this.state.visibleForGroups.map(
          Function.prototype.call,
          String.prototype.trim
        ),
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
              list: [],
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

  addLink(e) {

    if(this.refs.link_name.value.trim() === "" || this.refs.link_url.value.trim() === ""){
      return;
    }

    this.setState({
      list: [
        ...this.state.list,
        {
          name: this.refs.link_name.value,
          uri: this.refs.link_url.value,
        },
      ],
    });
  }

  removeLink(name) {
    this.setState({
      list: this.state.list.filter((f) => f.name !== name),
    });
  }

  editLink(e, name, url) {
    if (name && url) {
      var elements = this.refs.editName;
      var elements2 = this.refs.editUrl;

      e.name = elements.value;
      e.uri = elements2.value;
    }
    this.setState({
      editing: e.name,
      editUrl: e.uri,
      showResults: !this.state.showResults,
    });
  }

  createGuid() {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }
    return (
      s4() +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      "-" +
      s4() +
      s4() +
      s4()
    );
  }

  renderLinks() {
    return this.state.list.map((t, i) => (
      <div key={i}>
        <li
          className="layer-node link-name"
          key={Math.round(Math.random() * 1e6)}
          data-id={t.name}
          ref="buttonContainer"
        >
          {t.name === this.state.editing ? (
            this.state.showResults ? (
              <div>
                <input
                  ref="editName"
                  type="text"
                  defaultValue={t.name}
                  placeholder="Namn på länk"
                  style={{width: "100%"}}
                />
                <br />
                <input
                  ref="editUrl"
                  type="text"
                  defaultValue={t.uri}
                  placeholder="Url"
                  style={{width: "100%"}}
                />
                <br />
                <ColorButtonGreen
                  variant="contained"
                  className="btn"
                  onClick={() => this.editLink(t, t.name, t.uri)}
                  startIcon={<DoneIcon />}
                >
                  Klar
                </ColorButtonGreen>&nbsp;&nbsp;
                <ColorButtonBlue
                  variant="contained"
                  className="btn"
                  onClick={() => this.editLink(t)}
                  startIcon={<CancelIcon />}
                >
                  Avbryt
                </ColorButtonBlue>&nbsp;&nbsp;
                <ColorButtonRed
                  variant="contained"
                  className="btn btn-danger"
                  onClick={() => this.removeLink(t.name)}
                  startIcon={<RemoveIcon />}
                >
                  Radera
                </ColorButtonRed>
              </div>
            ) : (
              <span>{t.name}&nbsp;</span>
            )
          ) : (
            <span>{t.name}&nbsp;</span>
          )}
          <i
            style={{float:"right"}}
            className={this.state.showResults ? "" : "fa fa-pencil link-icon"}
            onClick={() => this.editLink(t)}
          />
        </li>
      </div>
    ));
  }

  handleAuthGrpsChange(event) {
    const target = event.target;
    const value = target.value;
    let groups = [];

    try {
      groups = value.split(",");
    } catch (error) {
      console.log(`Någonting gick fel: ${error}`);
    }

    this.setState({
      visibleForGroups: value !== "" ? groups : [],
    });
  }

  renderVisibleForGroups() {
    if (this.props.parent.props.parent.state.authActive) {
      return (
        <div>
          <label htmlFor="visibleForGroups">Tillträde</label>
          <input
            id="visibleForGroups"
            name="visibleForGroups"
            type="text"
            onChange={(e) => {
              this.handleAuthGrpsChange(e);
            }}
            value={this.state.visibleForGroups}
          />
        </div>
      );
    } else {
      return null;
    }
  }

  render() {
    return (
      <div>
        <form>
          <p>
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={(e) => {
                e.preventDefault();
                this.save();
              }}
              startIcon={<SaveIcon />}
            >
              Spara
            </ColorButtonBlue>
          </p>
          <div>
            <input
              id="active"
              name="active"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.active}
            />
            &nbsp;
            <label htmlFor="active">Aktiverad</label>
          </div>
          <div className="separator">Fönsterinställningar</div>
          <div>
            <label htmlFor="index">Sorteringsordning</label>
            <input
              id="index"
              name="index"
              type="number"
              min="0"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.index}
            />
          </div>

          <div className="separator">Övriga inställningar</div>

          {this.renderVisibleForGroups()}
          <div>
            <div>
              <h4>Lägg till länk</h4>
              <div>
                <label>Namn*</label>
                <input
                  name="name"
                  type="text"
                  placeholder="Namn på länk"
                  required
                  ref="link_name"
                />
              </div>
              <div>
                <label>Url*</label>
                <input
                  name="uri"
                  type="text"
                  required
                  ref="link_url"
                />
              </div>
              <ColorButtonGreen
                variant="contained"
                className="btn"
                onClick={(e) => {
                  e.preventDefault();
                  this.addLink(e);
                }}
                startIcon={<AddIcon />}
              >
                Lägg till
              </ColorButtonGreen>
            </div>
            <br/>
            <h4>Länkar</h4>
            <div className="list-container">
              <ul style={{paddingLeft: 0}}>{this.renderLinks()}</ul>
            </div>
          </div>
        </form>
      </div>
    );
  }
}

export default ToolOptions;
