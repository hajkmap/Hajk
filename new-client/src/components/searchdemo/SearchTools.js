import React from "react";
import { withStyles } from "@material-ui/core/styles";

import { Vector as VectorLayer } from "ol/layer";
import VectorSource from "ol/source/Vector";
import { Stroke, Style, Circle, Fill } from "ol/style";
import Draw from "ol/interaction/Draw";

import IconButton from "@material-ui/core/IconButton";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import Typography from "@material-ui/core/Typography";
import EditIcon from "@material-ui/icons/Edit";
import RadioButtonUncheckedIcon from "@material-ui/icons/RadioButtonUnchecked";
import SettingsIcon from "@material-ui/icons/Settings";

import { Paper } from "@material-ui/core";
import { createPortal } from "react-dom";

import Dialog from "../Dialog.js";

const styles = (theme) => ({});

class SearchTools extends React.PureComponent {
  state = {
    anchorEl: undefined,
    settingsDialog: false,
  };

  constructor(props) {
    super(props);
    this.map = props.map;
    this.drawOptions = [
      {
        name: "Sök med polygon",
        icon: <EditIcon />,
        type: "Polygon",
      },
      {
        name: "Sök med radie",
        icon: <RadioButtonUncheckedIcon />,
        type: "Circle",
      },
      {
        name: "Sökinställningar",
        icon: <SettingsIcon />,
        type: "SETTINGS",
      },
    ];

    this.drawSource = new VectorSource({ wrapX: false });
    this.drawLayer = new VectorLayer({
      source: this.drawSource,
      style: this.drawStyle,
    });

    this.map.addLayer(this.drawLayer);

    this.drawStyle = new Style({
      stroke: new Stroke({
        color: "rgba(255, 214, 91, 0.6)",
        width: 4,
      }),
      fill: new Fill({
        color: "rgba(255, 214, 91, 0.2)",
      }),
      image: new Circle({
        radius: 6,
        stroke: new Stroke({
          color: "rgba(255, 214, 91, 0.6)",
          width: 2,
        }),
      }),
    });
  }

  toggleSelection = () => {};

  toggleDraw = (active, type, freehand = false, drawEndCallback) => {
    const { map, handleDrawStart, handleDrawEnd } = this.props;
    if (active) {
      this.draw = new Draw({
        source: this.drawSource,
        type: type,
        freehand: freehand,
        stopClick: true,
        style: this.drawStyle,
      });

      map.clicklock = true;
      map.addInteraction(this.draw);
      this.drawSource.clear();
      handleDrawStart(this.drawSource);

      this.drawSource.on("addfeature", () => {
        map.removeInteraction(this.draw);
        handleDrawEnd();
      });
    } else {
      map.removeInteraction(this.draw);
      map.clicklock = false;
      this.drawSource.clear();
    }
  };

  handleMenuItemClick = (event, index, option) => {
    const type = option.type;
    this.setState({ anchorEl: undefined });

    if (type === "SELECTION") {
      this.toggleSelection();
    } else if (type === "SETTINGS") {
      this.setState({ settingsDialog: true });
    } else {
      this.toggleDraw(true, type);
    }
  };

  renderSettingsDialog = () => {
    const { settingsDialog } = this.state;
    if (settingsDialog) {
      return createPortal(
        <Dialog
          options={{
            text: "Avancerade inställningar...",
            headerText: "Inställningar",
            buttonText: "OK",
          }}
          open={settingsDialog}
          onClose={() => {
            this.setState({
              settingsDialog: false,
            });
          }}
        />,
        document.getElementById("windows-container")
      );
    } else {
      return null;
    }
  };

  render() {
    const { anchorEl } = this.state;

    return (
      <div>
        {this.renderSettingsDialog()}
        <IconButton
          aria-haspopup="true"
          aria-controls="lock-menu"
          size="small"
          onClick={(e) =>
            this.setState({
              anchorEl: e.currentTarget,
            })
          }
        >
          <MoreVertIcon />
        </IconButton>
        <Paper>
          <Menu
            id="lock-menu"
            anchorEl={anchorEl}
            getContentAnchorEl={null}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "center" }}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={() =>
              this.setState({
                anchorEl: undefined,
              })
            }
          >
            {this.drawOptions.map((option, index) => (
              <MenuItem
                key={index}
                onClick={(event) =>
                  this.handleMenuItemClick(event, index, option)
                }
              >
                {option.icon ? (
                  <ListItemIcon>{option.icon}</ListItemIcon>
                ) : null}
                <Typography variant="inherit" noWrap>
                  {option.name}
                </Typography>
              </MenuItem>
            ))}
          </Menu>
        </Paper>
      </div>
    );
  }
}

export default withStyles(styles)(SearchTools);
