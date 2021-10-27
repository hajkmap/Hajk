import React from "react";
import { Component } from "react";
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import DeleteIcon from "@material-ui/icons/Delete";
import SaveIcon from "@material-ui/icons/SaveSharp";
import { withStyles } from "@material-ui/core/styles";
import { blue } from "@material-ui/core/colors";

const ColorButtonBlue = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700],
    },
  },
}))(Button);

const defaultState = {
  validationErrors: [],
  active: false,
  index: 0,
  target: "toolbar",
  instruction: "",
  visibleAtStart: false,
  visibleForGroups: [],
  workspaceGroups: ["GIS-verktyg"],
  workspaces: [],
  newGroupName: "",
  newGroupError: false,
};

class ToolOptions extends Component {
  /**
   *
   */
  constructor() {
    super();
    this.state = defaultState;
    this.type = "fmeServer";
  }

  componentDidMount() {
    let tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        target: tool.options.target || "toolbar",
        position: tool.options.position,
        width: tool.options.width,
        height: tool.options.height,
        instruction: tool.options.instruction,
        visibleAtStart: tool.options.visibleAtStart,
        visibleForGroups:
          tool.options.visibleForGroups || this.state.visibleForGroups,
        workspaceGroups:
          tool.options.workspaceGroups || this.state.workspaceGroups,
        workspaces: tool.options.workspaces || this.state.workspaces,
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

  handleInputChange(event) {
    const t = event.target;
    const name = t.name;
    let value = t.type === "checkbox" ? t.checked : t.value;
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value;
    }
    this.setState({
      [name]: value,
    });
  }

  handleLayerInputChange(event) {
    const target = event.target;
    const name = target.name;
    let value = target.type === "checkbox" ? target.checked : target.value;
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

  /**
   * Called from treeEdit.jsx in componentDidMount and passes refs.
   * Sets checkboxes and input fields for edit layers.
   * @param {*} childRefs
   */
  loadLayers(childRefs) {
    // check checkboxes, show input field
    // and set text from map config
    let ids = [];

    for (let id of this.state.activeServices) {
      ids.push(id);
    }
    if (ids.length > 0 && typeof ids[0].visibleForGroups === "undefined") {
      let idsNew = [];
      for (let i = 0; i < ids.length; i++) {
        let as = {
          id: ids[i],
          visibleForGroups: [],
        };
        idsNew.push(as);
      }
      ids = idsNew;
      this.setState({
        activeServices: idsNew,
      });
    }
    if (typeof childRefs !== "undefined") {
      for (let i of ids) {
        childRefs["cb_" + i.id] && (childRefs["cb_" + i.id].checked = true);
        childRefs[i.id] && (childRefs[i.id].hidden = false);
        childRefs[i.id] && (childRefs[i.id].value = i.visibleForGroups.join());
      }
    }
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
    const tool = {
      type: this.type,
      index: this.state.index,
      options: {
        target: this.state.target,
        position: this.state.position,
        width: this.state.width,
        height: this.state.height,
        instruction: this.state.instruction,
        visibleAtStart: this.state.visibleAtStart,
        visibleForGroups: this.state.visibleForGroups.map(
          Function.prototype.call,
          String.prototype.trim
        ),
        workspaceGroups: this.state.workspaceGroups,
        workspaces: this.state.workspaces,
      },
    };

    const existing = this.getTool();

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
            this.setState(defaultState);
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

  handleNewGroupChange = (e) => {
    const groupNameExists = this.state.workspaceGroups.includes(e.target.value);
    this.setState({
      newGroupName: e.target.value,
      newGroupError: groupNameExists,
    });
  };

  handleAddNewGroupClick = () => {
    const { workspaceGroups } = this.state;
    workspaceGroups.push(this.state.newGroupName);
    this.setState({ workspaceGroups, newGroupName: "" });
  };

  handleRemoveGroupClick = (group) => {
    const { workspaceGroups } = this.state;
    const updatedGroups = workspaceGroups.filter((g) => {
      return g !== group;
    });
    this.setState({
      workspaceGroups: updatedGroups,
    });
  };

  renderVisibleForGroups() {
    if (this.props.parent.props.parent.state.authActive) {
      return (
        <div>
          <label htmlFor="visibleForGroups">Tillträde</label>
          <input
            id="visibleForGroups"
            value={this.state.visibleForGroups}
            type="text"
            name="visibleForGroups"
            onChange={(e) => {
              this.handleAuthGrpsChange(e);
            }}
          />
        </div>
      );
    } else {
      return null;
    }
  }

  renderWorkspaceGroups = () => {
    return (
      <Grid container>
        {this.state.workspaceGroups.map((group, index) => {
          return (
            <Grid item key={index}>
              <Paper
                elevation={6}
                style={{ padding: 8, marginTop: 16, marginRight: 16 }}
              >
                <Typography component="span">{group}</Typography>
                <IconButton
                  size="small"
                  component="span"
                  onClick={() => this.handleRemoveGroupClick(group)}
                >
                  <DeleteIcon />
                </IconButton>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    );
  };

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
          <div>
            <label htmlFor="target">Verktygsplacering</label>
            <select
              id="target"
              name="target"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.target}
            >
              <option value="toolbar">Drawer</option>
              <option value="left">Widget left</option>
              <option value="right">Widget right</option>
              <option value="control">Control button</option>
            </select>
          </div>
          <div>
            <label htmlFor="position">
              Fönsterplacering{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Placering av verktygets fönster. Anges som antingen 'left' eller 'right'."
              />
            </label>
            <select
              id="position"
              name="position"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.position}
            >
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div>
            <label htmlFor="width">
              Fönsterbredd{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Bredd i pixlar på verktygets fönster. Anges som ett numeriskt värde. Lämna tomt för att använda standardbredd."
              />
            </label>
            <input
              id="width"
              name="width"
              type="number"
              min="0"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.width}
            />
          </div>
          <div>
            <label htmlFor="height">
              Fönsterhöjd{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Höjd i pixlar på verktygets fönster. Anges antingen numeriskt (pixlar), 'dynamic' för att automatiskt anpassa höjden efter innehållet eller 'auto' att använda maximal höjd."
              />
            </label>
            <input
              id="height"
              name="height"
              type="text"
              className="control-fixed-width"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.height}
            />
          </div>
          <div className="separator">Övriga inställningar</div>
          <div>
            <input
              id="visibleAtStart"
              name="visibleAtStart"
              type="checkbox"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              checked={this.state.visibleAtStart}
            />
            &nbsp;
            <label htmlFor="visibleAtStart">Synlig vid start</label>
          </div>
          <div>
            <label htmlFor="instruction">
              Instruktion{" "}
              <i
                className="fa fa-question-circle"
                data-toggle="tooltip"
                title="Visas som tooltip vid mouseover på verktygsknappen"
              />
            </label>
            <textarea
              type="text"
              id="instruction"
              name="instruction"
              onChange={(e) => {
                this.handleInputChange(e);
              }}
              value={this.state.instruction ? atob(this.state.instruction) : ""}
            />
          </div>
          <div>{this.renderVisibleForGroups()}</div>
          <div className="separator">Grupper</div>
          <Grid container item xs={12} id="fmeGroupArea">
            <Grid item xs={12}>
              <p>
                <i>
                  En arbetsyta skall kopplas till en grupp för att användarna
                  enkelt skall kunna hitta den arbetsyta de letar efter. <br />
                  Här kan grupper läggas till eller raderas efter tycke och
                  smak.
                </i>
              </p>
            </Grid>
            <Grid container item xs={12}>
              <Grid container item xs={12} alignItems="flex-start" spacing={1}>
                <Grid item>
                  <TextField
                    size="small"
                    variant="outlined"
                    placeholder="Gruppnamn"
                    error={this.state.newGroupError}
                    value={this.state.newGroupName}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        this.handleAddNewGroupClick();
                      }
                    }}
                    onChange={this.handleNewGroupChange}
                    id="new-fme-group-input"
                    helperText={
                      this.state.newGroupError
                        ? "En grupp med det namnet finns redan"
                        : ""
                    }
                  />
                </Grid>
                <Grid item>
                  <Button
                    disabled={
                      this.state.newGroupError ||
                      this.state.newGroupName.length < 3
                    }
                    onClick={this.handleAddNewGroupClick}
                    variant="contained"
                  >
                    Lägg till grupp
                  </Button>
                </Grid>
              </Grid>
            </Grid>
            {this.renderWorkspaceGroups()}
          </Grid>
          <div className="separator">Arbetsytor</div>
          <Grid container>
            <Grid item xs={12}>
              <p>
                <i>
                  Nedan kan arbetsytor läggas till eller tas bort. Det finns
                  även möjlighet att redigera arbetsytornas inställningar. För
                  att förenkla adderandet av nya arbetsytor så hämtas alla
                  tillgängliga repositories samt arbetsytor från FME-server.
                  Observera att det bara är de arbetsytor och repositories som
                  FME-användaren (angiven i backend) har tillgång till som
                  listas.
                </i>
              </p>
            </Grid>
          </Grid>
        </form>
      </div>
    );
  }
}

export default ToolOptions;
