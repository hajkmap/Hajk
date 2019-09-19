import React from "react";
import LayerItem from "./LayerItem.js";
import { withStyles } from "@material-ui/core/styles";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import Typography from "@material-ui/core/Typography";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import Checkbox from "@material-ui/core/Checkbox";

const styles = theme => ({
  root: {
    width: "100%",
    display: "block",
    padding: "0"
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    flexBasis: "100%"
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary
  },
  disableTransition: {
    borderRadius: "0 !important",
    boxShadow: "none"
  },
  panel: {},
  /*groupCheckbox: {
    marginRight: "5px"
  },*/
  caption: {
    display: "flex",
    flexBasis: "100%",
    borderBottom: "1px solid #ccc"
  },
  panelSummary: {
    padding: "0px",
    overflow: "hidden"
  },
  checkBoxIcon: {
    cursor: "pointer",
    float: "left",
    marginRight: "5px",
    padding: "0"
  },
  arrowIcon: {
    float: "left"
  },
  expansionPanel: {
    marginLeft: "18px"
  }
});

const StyledExpansionPanelSummary = withStyles({
  root: {
    minHeight: 35,
    "&$expanded": {
      minHeight: 35
    }
  },
  content: {
    transition: "inherit !important",
    marginTop: "0",
    marginBottom: "0",
    "&$expanded": {
      marginTop: "0",
      marginBottom: "0"
    }
  },
  expanded: {}
})(ExpansionPanelSummary);

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
          chapters={this.props.chapters}
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

  isSemiToggled() {
    var layers = this.props.app
      .getMap()
      .getLayers()
      .getArray();
    const { group } = this.props;
    return group.layers.every(layer => {
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
          <div>
            {this.isToggled(this.props.group) ? (
              this.isSemiToggled(this.props.group) ? (
                <CheckBoxIcon className={classes.checkBoxIcon} />
              ) : (
                <CheckBoxIcon
                  style={{ color: "gray" }}
                  className={classes.checkBoxIcon}
                />
              )
            ) : (
              <CheckBoxOutlineBlankIcon className={classes.checkBoxIcon} />
            )}
          </div>
          <Typography className={classes.heading}>{this.state.name}</Typography>
        </div>
      );
    } else {
      return (
        <div className={classes.caption}>
          <Checkbox className={classes.checkBoxIcon} disabled />
          <Typography className={classes.heading}>{this.state.name}</Typography>
        </div>
      );
    }
  }

  render() {
    const { classes, child } = this.props;
    const { expanded } = this.state;
    var groupClass = "";
    if (child) {
      groupClass = classes.panel;
    }
    return (
      <div ref="panelElement" className={groupClass}>
        <ExpansionPanel
          className={classes.disableTransition}
          expanded={this.state.expanded}
          TransitionProps={{
            timeout: 0
          }}
          onChange={() => {
            this.setState({
              expanded: !this.state.expanded
            });
          }}
        >
          <StyledExpansionPanelSummary className={classes.panelSummary}>
            <div className={classes.arrowIcon}>
              {expanded ? (
                <ArrowDropDownIcon onClick={() => this.toggleExpanded()} />
              ) : (
                <ArrowRightIcon onClick={() => this.toggleExpanded()} />
              )}
            </div>
            {this.renderToggleAll()}
          </StyledExpansionPanelSummary>
          <ExpansionPanelDetails classes={{ root: classes.root }}>
            <div className={classes.expansionPanel}>
              {this.state.layers.map((layer, i) => {
                var mapLayer = this.model.layerMap[Number(layer.id)];
                if (mapLayer) {
                  return (
                    <LayerItem
                      key={mapLayer.get("name")}
                      layer={mapLayer}
                      model={this.props.model}
                      chapters={this.props.chapters}
                      app={this.props.app}
                      onOpenChapter={chapter => {
                        const informativePanel = this.props.app.windows.find(
                          window => window.type === "informative"
                        );
                        informativePanel.open(chapter);
                      }}
                    />
                  );
                } else {
                  return null;
                }
              })}
              {this.renderLayerGroups()}
            </div>
          </ExpansionPanelDetails>
        </ExpansionPanel>
      </div>
    );
  }
}

export default withStyles(styles)(LayerGroup);
