import React from "react";
import { createPortal } from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import BackgroundSwitcher from "./components/BackgroundSwitcher.js";
import LayerGroup from "./components/LayerGroup.js";
import BreadCrumbs from "./components/BreadCrumbs.js";
import Button from "@material-ui/core/Button";
import PublicIcon from "@material-ui/icons/Public";

const styles = theme => ({
  button: {
    margin: theme.spacing.unit
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
  layerSwitcher: {},
  reset: {
    marginBottom: "10px"
  }
});

class SimpleLayersSwitcherView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.options = this.props.app.config.mapConfig.tools.find(
      t => t.type === "layerswitcher"
    ).options;
    this.state = {
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
  }

  handleChange = (panel, instance) => (event, expanded) => {
    this.setState(
      {
        expanded: expanded ? panel : false
      },
      () => {
        setTimeout(() => {
          instance.refs.panelElement.scrollIntoView();
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
      <BreadCrumbs map={this.props.map} />,
      document.getElementById("map")
    );
  }

  clear = () => {
    this.props.model.clear();
  };

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.layerSwitcher}>
        <div className={classes.reset}>
          <Button variant="contained" color="primary" onClick={this.clear}>
            <PublicIcon />
            &nbsp;Återställ
          </Button>
        </div>
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
      </div>
    );
  }
}

export default withStyles(styles)(SimpleLayersSwitcherView);
