import React from "react";
import LayerItem from "./LayerItem.js";
import { withStyles } from "@material-ui/core/styles";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
  root: {
    width: "100%",
    display: "block",
    padding: "5px 0",
    borderTop: "1px solid #ccc",
    background: "#efefef"
  },
  heading: {
    fontSize: theme.typography.pxToRem(18),
    flexBasis: "100%",
    flexShrink: 0
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary
  },
  disableTransition: {
    transition: "none",
    borderRadius: "0 !important"
  },
  panel: {
    marginLeft: "10px"
  },
  groupCheckbox: {
    marginRight: "5px"
  },
  caption: {
    display: "flex"
  }
});

class LayerGroup extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      expanded: false,
      groups: [],
      layers: [],
      name: "",
      parent: "-1",
      toggled: false,
      chapters: []
    };
    this.toggleExpanded = this.toggleExpanded.bind(this);
    this.props.app
      .getMap()
      .getLayers()
      .getArray()
      .forEach(layer => {
        layer.on("change:visible", () => {
          this.forceUpdate();
        });
      });
  }

  componentDidMount() {
    this.setState({
      ...this.state,
      ...this.props.group
    });
    this.model = this.props.model;
  }

  handleChange = panel => (event, expanded) => {
    this.setState({
      expanded: expanded ? panel : false
    });
  };

  renderLayerGroups() {
    let { expanded } = this.state;
    const { classes } = this.props;
    if (this.state.groups.length === 1 && this.state.groups[0].expanded) {
      expanded = this.state.groups[0].id;
    }
    return this.state.groups.map((group, i) => {
      return (
        <LayerGroup
          expanded={expanded === group.id}
          key={i}
          group={group}
          model={this.props.model}
          handleChange={this.handleChange}
          app={this.props.app}
          classes={classes}
          child={true}
        />
      );
    });
  }

  toggleExpanded() {
    this.setState({ expanded: !this.state.expanded });
  }

  isToggled() {
    var layers = this.props.app
      .getMap()
      .getLayers()
      .getArray();
    const { group } = this.props;
    return group.layers.some(layer => {
      let foundMapLayer = layers.find(mapLayer => {
        return mapLayer.get("name") === layer.id;
      });
      if (foundMapLayer && foundMapLayer.getVisible()) {
        return true;
      } else {
        return false;
      }
    });
  }

  toggleLayers(visibility, layers) {
    var mapLayers = this.props.app
      .getMap()
      .getLayers()
      .getArray();

    mapLayers
      .filter(mapLayer => {
        return layers.some(layer => layer.id === mapLayer.get("name"));
      })
      .forEach(mapLayer => {
        if (mapLayer.layerType === "group") {
          if (visibility === true) {
            this.model.observer.publish("showLayer", mapLayer);
          } else {
            this.model.observer.publish("hideLayer", mapLayer);
          }
        }
        mapLayer.setVisible(visibility);
      });
  }

  renderToggleAll() {
    const { classes } = this.props;
    if (this.props.group.toggled) {
      return (
        <div
          className={classes.caption}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            if (this.isToggled()) {
              this.toggleLayers(false, this.props.group.layers);
            } else {
              this.toggleLayers(true, this.props.group.layers);
            }
          }}
        >
          <div className={classes.groupCheckbox}>
            {this.isToggled(this.props.group) ? (
              <CheckBoxIcon />
            ) : (
              <CheckBoxOutlineBlankIcon />
            )}
          </div>
          <Typography className={classes.heading}>{this.state.name}</Typography>
        </div>
      );
    } else {
      return (
        <Typography className={classes.heading}>{this.state.name}</Typography>
      );
    }
  }

  render() {
    const { classes, child } = this.props;
    var groupClass = "";
    if (child) {
      groupClass = classes.panel;
    }
    return (
      <div ref="panelElement" className={groupClass}>
        <ExpansionPanel
          className={classes.disableTransition}
          CollapseProps={{ classes: { container: classes.disableTransition } }}
          expanded={this.props.expanded}
          onChange={this.props.handleChange(this.props.group.id, this)}
        >
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            {this.renderToggleAll()}
          </ExpansionPanelSummary>
          <ExpansionPanelDetails classes={{ root: classes.root }}>
            {this.state.layers.map((layer, i) => {
              var mapLayer = this.model.layerMap[Number(layer.id)];
              return (
                <LayerItem
                  key={mapLayer.get("name")}
                  layer={mapLayer}
                  model={this.props.model}
                  chapters={this.props.chapters}
                  app={this.props.app}
                  onOpenChapter={chapter => {
                    var informativePanel = this.props.app.panels.find(
                      panel => panel.type === "informative"
                    );
                    informativePanel.open(chapter);
                  }}
                />
              );
            })}
            {this.renderLayerGroups()}
          </ExpansionPanelDetails>
        </ExpansionPanel>
      </div>
    );
  }
}

export default withStyles(styles)(LayerGroup);
