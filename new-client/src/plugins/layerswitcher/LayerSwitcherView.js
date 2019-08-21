import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import AppBar from "@material-ui/core/AppBar";
import BackgroundSwitcher from "./components/BackgroundSwitcher.js";
import LayerGroup from "./components/LayerGroup.js";
import BreadCrumbs from "./components/BreadCrumbs.js";
import "element-scroll-polyfill";

const styles = theme => ({
  windowContent: {
    margin: "-10px" // special case, we need to "unset" the padding for Window content that's set in Window.js
  },
  tabContent: {
    padding: "10px"
  },
  indicator: {
    display: "none"
  },
  tabStyle: {
    maxWidth: "120px",
    borderRadius: "35px",
    marginBottom: "5px",
    marginTop: "5px"
  },
  tabActive: {
    backgroundColor: theme.palette.primary.main
  }
});

class LayersSwitcherView extends React.PureComponent {
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
      <div className={classes.windowContent}>
        <AppBar position="static" color="default">
          <Tabs
            value={this.state.activeTab}
            onChange={this.handleChangeTabs}
            indicatorColor="primary"
            textColor="secondary"
            variant="fullWidth"
            classes={{ indicator: classes.indicator }}
            centered
          >
            <Tab
              label="Kartlager"
              classes={{ root: classes.tabStyle, selected: classes.tabActive }}
            />
            <Tab
              label="Bakgrund"
              classes={{ root: classes.tabStyle, selected: classes.tabActive }}
            />
          </Tabs>
        </AppBar>
        <div className={classes.tabContent}>
          <div
            style={{
              display: this.state.activeTab === 0 ? "block" : "none"
            }}
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
          {this.props.breadCrumbs ? this.renderBreadCrumbs() : null}
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(LayersSwitcherView);
