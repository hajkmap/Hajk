import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import LayersClearIcon from "@material-ui/icons/LayersClear";
import { IconButton } from "@material-ui/core";
import BackgroundSwitcher from "./components/BackgroundSwitcher.js";
import LayerGroup from "./components/LayerGroup.js";
import BreadCrumbs from "./components/BreadCrumbs.js";

const styles = theme => ({
  button: {
    margin: 0,
    cursor: "pointer",
    userSelect: "none",
    textAlign: "center",
    color: "#000",
    fontSize: "10pt",
    [theme.breakpoints.down("md")]: {
      width: "50px",
      height: "50px",
      marginRight: "30px",
      outline: "none",
      background: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
      "&:hover": {
        background: theme.palette.primary.main
      }
    }
  },
  leftIcon: {
    marginRight: theme.spacing.unit
  },
  rightIcon: {
    marginLeft: theme.spacing.unit
  },
  iconSmall: {
    fontSize: 20
  },
  icon: {
    fontSize: "20pt"
  },
  layerSwitcher: {},
  reset: {},
  card: {
    cursor: "pointer",
    width: "180px",
    borderRadius: "4px",
    background: "white",
    padding: "10px 20px",
    marginBottom: "10px",
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    boxShadow:
      "0px 1px 3px 0px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0.12)",
    "&:hover": {
      background: "#e9e9e9"
    },
    [theme.breakpoints.down("md")]: {
      width: "auto",
      justifyContent: "inherit",
      marginBottom: "20px"
    }
  },
  title: {
    fontSize: "10pt",
    fontWeight: "bold",
    marginBottom: "5px"
  },
  text: {}
});

class SimpleLayersSwitcherView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.options = this.props.app.config.mapConfig.tools.find(
      t => t.type === "layerswitcher"
    ).options;
    this.state = {
      windowWidth: window.innerWidth,
      layerGroupsExpanded: true,
      baseLayers: this.props.map
        .getLayers()
        .getArray()
        .filter(
          l =>
            l.getProperties().layerInfo &&
            l.getProperties().layerInfo.layerType === "base"
        )
        .map(l => l.getProperties())
    };

    window.addEventListener("resize", () => {
      this.setState({
        innerWidth: window.innerWidth
      });
    });
  }

  handleChange = (panel, instance) => (event, expanded) => {
    this.setState(
      {
        expanded: expanded ? panel : false
      },
      () => {
        setTimeout(() => {
          var parent = instance.refs.panelElement.offsetParent;
          var topOfElement = instance.refs.panelElement.offsetTop;
          parent.scroll({ top: topOfElement, behavior: "smooth" });
        }, 50);
      }
    );
  };

  renderLayerGroups() {
    const { expanded } = this.state;
    return this.options.groups.map((group, i) => {
      return (
        <LayerGroup
          expanded={expanded === group.id}
          key={i}
          group={group}
          model={this.props.model}
          handleChange={this.handleChange}
          app={this.props.app}
        />
      );
    });
  }

  toggleLayerGroups() {
    this.setState({
      layerGroupsExpanded: !this.state.layerGroupsExpanded
    });
  }

  getArrowClass() {
    return this.state.layerGroupsExpanded ? "expand_less" : "chevron_right";
  }

  renderBreadCrumbs() {
    return createPortal(
      <BreadCrumbs
        map={this.props.map}
        model={this.props.model}
        app={this.props.app}
      />,
      document.getElementById("map")
    );
  }

  renderClearButton() {
    const { classes } = this.props;

    if (window.innerWidth < 1280) {
      return createPortal(
        <>
          <div className={classes.card} onClick={this.clear}>
            <div>
              <IconButton className={classes.button}>
                <LayersClearIcon />
              </IconButton>
            </div>
            <div>
              <Typography className={classes.title}>Rensa kartan</Typography>
              <Typography className={classes.text}>
                Återställ kartan till ursprungligt innehåll
              </Typography>
            </div>
          </div>
        </>,
        document.getElementById("widgets-other")
      );
    } else {
      return createPortal(
        <div className={classes.reset} onClick={this.clear}>
          <div className={classes.button}>
            <div className={classes.icon}>
              <LayersClearIcon />
            </div>
            <div>RENSA KARTAN</div>
          </div>
        </div>,
        document.getElementById("toolbar-right")
      );
    }
  }

  clear = () => {
    this.props.model.clear();
  };

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.layerSwitcher}>
        <div>
          <BackgroundSwitcher
            layers={this.state.baseLayers}
            layerMap={this.props.model.layerMap}
            backgroundSwitcherBlack={this.options.backgroundSwitcherBlack}
            backgroundSwitcherWhite={this.options.backgroundSwitcherWhite}
          />
          <div>{this.renderLayerGroups()}</div>
        </div>
        {this.renderBreadCrumbs()}
        {this.renderClearButton()}
      </div>
    );
  }
}

export default withStyles(styles)(SimpleLayersSwitcherView);
