import React, { Component } from "react";
import BreadCrumb from "./BreadCrumb.js";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography/Typography";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import RemoveCircleIcon from "@material-ui/icons/RemoveCircle";

const styles = theme => ({
  breadCrumbs: {
    position: "fixed",
    background: "white",
    bottom: "20px",
    right: "20px",
    [theme.breakpoints.up("xs")]: {
      borderRadius: "4px",
      overflow: "hidden",
      width: "269px",
      boxShadow:
        "0px 1px 3px 0px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12)"
    },
    [theme.breakpoints.down("xs")]: {
      left: 0,
      bottom: 0,
      right: 0,
      width: "auto"
    }
  },
  breadCrumbsHeader: {
    background: "white",
    padding: "5px 18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "#ccc"
  },
  breadCrumbsHeaderText: {
    marginRight: "15px"
  },
  breadCrumbsContainer: {
    maxHeight: "300px",
    overflow: "auto",
    margin: "10px",
    [theme.breakpoints.down("md")]: {
      maxHeight: "236px"
    },
    [theme.breakpoints.down("xs")]: {
      maxHeight: "150px"
    }
  }
});

class BreadCrumbs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visibleLayers: [],
      open: true
    };
  }

  bindLayerEvents = visibleLayers => layer => {
    if (layer.get("visible")) {
      visibleLayers.push(layer);
    }
    this.setState({
      visibleLayers: visibleLayers
    });
    layer.on("change:visible", e => {
      let changedLayer = e.target;
      if (changedLayer.get("visible")) {
        setTimeout(
          () =>
            this.setState({
              visibleLayers: [...this.state.visibleLayers, changedLayer]
            }),
          0
        );
      } else {
        setTimeout(
          () =>
            this.setState({
              visibleLayers: this.state.visibleLayers.filter(
                visibleLayer => visibleLayer !== changedLayer
              )
            }),
          0
        );
      }
    });
  };

  getVisibleLayers() {
    return this.props.map
      .getLayers()
      .getArray()
      .filter(layer => {
        return layer.getVisible();
      });
  }

  clear = () => {
    this.state.visibleLayers
      .filter(layer =>
        layer.getProperties().layerInfo
          ? layer.getProperties().layerInfo.layerType !== "base"
          : false
      )
      .forEach(layer => {
        layer.setVisible(false);
      });
  };

  componentDidMount() {
    var visibleLayers = [];
    if (this.props.map) {
      this.props.map
        .getLayers()
        .getArray()
        .forEach(this.bindLayerEvents(visibleLayers));
    }
  }

  toggle = () => {
    this.setState({
      open: !this.state.open
    });
  };

  render() {
    const { classes } = this.props;
    const { open } = this.state;

    var layers = this.state.visibleLayers.filter(layer =>
      layer.getProperties().layerInfo
        ? layer.getProperties().layerInfo.layerType !== "base"
        : false
    );

    return (
      <div className={classes.breadCrumbs}>
        <div className={classes.breadCrumbsHeader}>
          <Typography variant="h5" className={classes.breadCrumbsHeaderText}>
            Innehåll i kartan
          </Typography>
          <div>
            {open ? (
              <IconButton
                className={classes.button}
                onClick={() => this.toggle()}
              >
                <RemoveCircleIcon />
              </IconButton>
            ) : (
              <IconButton
                className={classes.button}
                onClick={() => this.toggle()}
              >
                <AddCircleIcon />
              </IconButton>
            )}
          </div>
        </div>
        {this.state.open ? (
          <div className={classes.breadCrumbsContainer}>
            {layers.length > 0 ? (
              <Button onClick={this.clear}>Ta bort allt innehåll</Button>
            ) : (
              <Typography>
                Använd sökfunktionen eller innehållsmenyn för att visa
                information i kartan.
              </Typography>
            )}
            {layers.map(layer => (
              <BreadCrumb
                key={layer.get("caption") + Math.random()}
                title={layer.get("caption")}
                layer={layer}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }
}

export default withStyles(styles)(BreadCrumbs);
