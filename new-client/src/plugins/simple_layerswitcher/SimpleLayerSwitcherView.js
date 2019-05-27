import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Button from "@material-ui/core/Button";
import AppBar from "@material-ui/core/AppBar";
import VisibilityOffIcon from "@material-ui/icons/VisibilityOff";
import BackgroundSwitcher from "./components/BackgroundSwitcher.js";
import LayerGroup from "./components/LayerGroup.js";
import BreadCrumbs from "./components/BreadCrumbs.js";
import "element-scroll-polyfill";

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
    fontSize: 14
  },
  layerSwitcher: {
    marginTop: "55px"
  },
  layerGroups: {
    padding: "0px"
  },
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
  text: {},
  clearContainer: {
    float: "right",
    position: "fixed",
    marginLeft: "250px",
    marginTop: "5px"
  },
  clearButton: {
    textTransform: "none"
  }
});

const StyledTab = withStyles({
  root: {
    minWidth: "50px",
    width: "120px",
    height: "50px",
    textTransform: "unset",
    fontSize: 15
  }
})(Tab);

class SimpleLayersSwitcherView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.options = this.props.app.config.mapConfig.tools.find(
      t => t.type === "layerswitcher"
    ).options;
    this.state = {
      windowWidth: window.innerWidth,
      layerGroupsExpanded: true,
      chapters: [],
      baseLayers: this.props.map
        .getLayers()
        .getArray()
        .filter(
          l =>
            l.getProperties().layerInfo &&
            l.getProperties().layerInfo.layerType === "base"
        )
        .map(l => l.getProperties()),
      activeTab: 0
    };

    window.addEventListener("resize", () => {
      this.setState({
        innerWidth: window.innerWidth
      });
    });

    props.observer.on("panelOpen", () => {
      this.forceUpdate();
    });

    props.app.globalObserver.on("informativeLoaded", chapters => {
      if (Array.isArray(chapters)) {
        this.setState({
          chapters: chapters
        });
      }
    });
  }

  handleChange = (panel, instance) => (event, expanded) => {
    this.setState(
      {
        expanded: expanded ? panel : false
      },
      () => {
        setTimeout(() => {
          const parent = instance.refs.panelElement.offsetParent;
          const topOfElement = instance.refs.panelElement.offsetTop - 145;
          const sections = parent.getElementsByTagName("section");
          if (sections.length > 0) {
            sections[0].scroll({ top: topOfElement, behavior: "smooth" });
          }
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
          chapters={this.state.chapters}
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

  handleChangeTabs = (event, value) => {
    this.setState({ activeTab: value });
  };

  render() {
    const { classes } = this.props;
    return (
      <div>
        <AppBar position="fixed" color="default" style={{ top: "45px" }}>
          <Tabs
            value={this.state.activeTab}
            onChange={this.handleChangeTabs}
            indicatorColor="primary"
            textColor="primary"
          >
            <StyledTab label="Kartlager" />
            <StyledTab label="Bakgrund" />
          </Tabs>
          <div className={classes.clearContainer}>
            <Button
              variant="outlined"
              size="small"
              color="primary"
              className={classes.clearButton}
              onClick={e => {
                e.stopPropagation();
                this.props.app.clear();
              }}
            >
              <VisibilityOffIcon className={classes.leftIcon} />
              Släck alla
            </Button>
          </div>
        </AppBar>
        <div className={classes.layerSwitcher}>
          <div>
            <div className="content">
              <div
                style={{
                  display: this.state.activeTab === 0 ? "block" : "none"
                }}
                className={classes.layerGroups}
              >
                {this.renderLayerGroups()}
              </div>
              <BackgroundSwitcher
                display={this.state.activeTab === 1}
                layers={this.state.baseLayers}
                layerMap={this.props.model.layerMap}
                backgroundSwitcherBlack={this.options.backgroundSwitcherBlack}
                backgroundSwitcherWhite={this.options.backgroundSwitcherWhite}
              />
            </div>
          </div>
          {this.props.breadCrumbs ? this.renderBreadCrumbs() : null}
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(SimpleLayersSwitcherView);
