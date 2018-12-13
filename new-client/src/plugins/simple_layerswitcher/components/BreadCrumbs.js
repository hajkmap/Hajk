import React, { Component } from "react";
import BreadCrumb from "./BreadCrumb.js";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography/Typography";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";
import RemoveCircleIcon from "@material-ui/icons/RemoveCircle";

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
    bottom: 0,
    zIndex: 1000,
    display: "flex",
    overflow: "hidden",
    overflowX: "hidden"
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
  }
});

class BreadCrumbs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      visibleLayers: [],
      open: false,
      width: window.innerWidth
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
              visibleLayers: [...this.state.visibleLayers, changedLayer],
              postCompose: false
            }),
          0
        );
      } else {
        setTimeout(
          () =>
            this.setState({
              visibleLayers: this.state.visibleLayers.filter(
                visibleLayer => visibleLayer !== changedLayer
              ),
              postCompose: false
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

  handleWindowSizeChange = () => {
    this.setState({
      width: window.innerWidth,
      postCompose: false
    });
  };

  componentWillMount() {
    window.addEventListener("resize", this.handleWindowSizeChange);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.handleWindowSizeChange);
  }

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
    const { open } = this.state;
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
              />
            ))}
          </div>
        ) : null}
      </div>
    );
  }

  renderDesktop(layers) {
    const { classes } = this.props;
    return (
      <div className={classes.breadCrumbsContainer} id="bread-crumbs-container">
        {layers.map(layer => (
          <BreadCrumb
            key={layer.get("caption") + Math.random()}
            title={layer.get("caption")}
            layer={layer}
          />
        ))}
      </div>
    );
  }

  componentDidUpdate() {
    var overflowIndex = -1;
    var accumulatedWidth = 0;
    document
      .querySelectorAll('[data-type="bread-crumb"]')
      .forEach((element, i) => {
        accumulatedWidth += element.clientWidth + 5;
        if (
          accumulatedWidth > window.innerWidth - 50 &&
          overflowIndex === -1 &&
          window.innerWidth > 600
        ) {
          overflowIndex = i;
          element.style.opacity = 0;
        } else {
          element.style.opacity = 1;
        }
      });

    var layers = this.state.visibleLayers.filter(layer =>
      layer.getProperties().layerInfo
        ? layer.getProperties().layerInfo.layerType !== "base"
        : false
    );

    if (!this.state.postCompose) {
      if (overflowIndex !== -1) {
        let overflowLayers = layers.splice(overflowIndex);
        this.setState({
          overflowLayers: overflowLayers,
          postCompose: true
        });
      } else {
        this.setState({
          overflowLayers: [],
          postCompose: true
        });
      }
    }
  }

  toggleOverflow = () => {
    this.setState({
      displayOverflow: !this.state.displayOverflow
    });
  };

  renderOverflow() {
    return this.state.overflowLayers.map(layer => (
      <BreadCrumb
        key={layer.get("caption") + Math.random()}
        title={layer.get("caption")}
        layer={layer}
        type="flat"
      />
    ));
  }

  render() {
    const { classes } = this.props;
    const isMobile = this.state.width < 600;
    var layers = this.state.visibleLayers.filter(layer =>
      layer.getProperties().layerInfo
        ? layer.getProperties().layerInfo.layerType !== "base"
        : false
    );
    if (isMobile) {
      return this.renderMobile(layers);
    } else {
      return (
        <div className={classes.breadBasket}>
          <div>{this.renderDesktop(layers)}</div>
          <div className={classes.breadExpand}>
            {this.state.overflowLayers &&
            this.state.overflowLayers.length > 0 ? (
              this.state.displayOverflow ? (
                <RemoveCircleIcon
                  className={classes.moreButton}
                  onClick={() => this.toggleOverflow()}
                />
              ) : (
                <MoreHorizIcon
                  className={classes.moreButton}
                  onClick={() => this.toggleOverflow()}
                />
              )
            ) : null}
            {this.state.displayOverflow ? (
              <div className={classes.overflow}>{this.renderOverflow()}</div>
            ) : null}
          </div>
        </div>
      );
    }
  }
}

export default withStyles(styles)(BreadCrumbs);
