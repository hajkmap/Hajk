import React, { Component } from "react";
import BreadCrumb from "./BreadCrumb.js";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography/Typography";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import RemoveCircleIcon from "@material-ui/icons/RemoveCircle";
import ScrollMenu from "react-horizontal-scrolling-menu";
import "./BreadCrumbs.css";

const styles = theme => ({
  moreButton: {
    background: "white",
    padding: "6px",
    margin: "0px",
    borderRadius: "100%",
    "&:hover": {
      cursor: "pointer"
    }
  },
  breadExpand: {
    position: "fixed",
    right: 0,
    bottom: "-2px",
    zIndex: 1000
  },
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
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2
  },
  breadCrumbsContainerMobile: {
    maxHeight: "300px",
    overflow: "auto",
    margin: "10px",
    [theme.breakpoints.down("md")]: {
      maxHeight: "236px"
    },
    [theme.breakpoints.down("xs")]: {
      maxHeight: "150px"
    }
  },
  overflow: {
    position: "absolute",
    right: 0,
    bottom: "50px"
  },
  arrowLeft: {
    background: "white",
    height: "24px",
    display: "flex",
    alignContent: "center",
    padding: "10px",
    border: "1px solid #ccc"
  },
  arrowRight: {
    background: "white",
    height: "24px",
    display: "flex",
    alignContent: "center",
    padding: "10px",
    border: "1px solid #ccc"
  }
});

class BreadCrumbs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visibleLayers: [],
      open: false
    };
    props.app.globalObserver.subscribe("informativeLoaded", chapters => {
      this.setState({
        chapters: chapters
      });
    });
    this.timer = 0;
  }

  bindLayerEvents = visibleLayers => layer => {
    if (layer.get("visible")) {
      visibleLayers.push(layer);
    }

    this.setState({
      visibleLayers: visibleLayers
    });

    this.addedLayerBuffer = [];
    this.removedLayerBuffer = [];

    layer.on("change:visible", e => {
      let changedLayer = e.target;
      setTimeout(() => {
        var visibleLayers = [
          ...this.state.visibleLayers,
          ...this.addedLayerBuffer
        ];
        visibleLayers = visibleLayers.filter(visibleLayer => {
          return !this.removedLayerBuffer.some(
            removedLayer => visibleLayer === removedLayer
          );
        });
        this.setState({
          visibleLayers: visibleLayers
        });
        this.addedLayerBuffer = [];
        this.removedLayerBuffer = [];
      }, 0);

      if (this.props.model.clearing) {
        this.setState({
          visibleLayers: []
        });
      } else {
        if (changedLayer.get("visible")) {
          this.addedLayerBuffer.push(changedLayer);
        } else {
          this.removedLayerBuffer.push(changedLayer);
        }
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

  renderMobile(layers) {
    const { classes } = this.props;
    const { open, chapters } = this.state;
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
        {open ? (
          <div className={classes.breadCrumbsContainerMobile}>
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
                chapters={chapters}
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  renderDesktop(layers) {
    const { classes, app } = this.props;
    const { chapters } = this.state;

    var breadCrumbs = layers.map(layer => (
      <BreadCrumb
        key={layer.get("caption") + Math.random()}
        title={layer.get("caption")}
        layer={layer}
        chapters={chapters}
        app={app}
      />
    ));
    return (
      <div className={classes.breadCrumbsContainer}>
        <ScrollMenu
          ref="scrollMenu"
          data={breadCrumbs}
          alignCenter={false}
          // hideArrows={false}
          // arrowLeft={<Arrow type="left" />}
          // arrowRight={<Arrow type="right" />}
        />
      </div>
    );
  }

  componentDidUpdate() {}

  render() {
    const { classes } = this.props;
    const isMobile = this.state.width < 600;
    var layers = this.state.visibleLayers.filter(layer => {
      var isBreadCrumb = true;
      if (
        !layer.getProperties().layerInfo ||
        (layer.getProperties().layerInfo &&
          layer.getProperties().layerInfo.layerType === "base")
      ) {
        isBreadCrumb = false;
      }
      return isBreadCrumb;
    });
    if (isMobile) {
      return this.renderMobile(layers);
    } else {
      return (
        <div className={classes.breadBasket}>
          <div>{this.renderDesktop(layers)}</div>
        </div>
      );
    }
  }
}

export default withStyles(styles)(BreadCrumbs);
