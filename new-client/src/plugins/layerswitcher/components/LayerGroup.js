import React from "react";
import propTypes from "prop-types";
import LayerItem from "./LayerItem.js";
import { withStyles } from "@material-ui/core/styles";
import {
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  Typography
} from "@material-ui/core";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";

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
  panel: {
    marginLeft: "21px"
  },
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
  expansionPanel: {}
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
  state = {
    expanded: false,
    groups: [],
    layers: [],
    name: "",
    parent: "-1",
    toggled: false,
    chapters: []
  };

  static defaultProps = {
    child: false,
    expanded: false
  };

  static propTypes = {
    app: propTypes.object.isRequired,
    chapters: propTypes.array.isRequired,
    child: propTypes.bool.isRequired,
    classes: propTypes.object.isRequired,
    expanded: propTypes.bool.isRequired,
    group: propTypes.object.isRequired,
    handleChange: propTypes.func,
    model: propTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.model = this.props.model;

    // Setup a listener on every layer that will force re-render on this component
    // FIXME: The problem with this approach is that we forceUpdate ONCE PER EVERY LAYERGROUP.
    this.props.app
      .getMap()
      .getLayers()
      .getArray()
      .forEach(layer => {
        layer.on("change:visible", () => {
          //
          this.forceUpdate();
        });
      });
  }

  componentDidMount() {
    this.setState({
      ...this.props.group
    });
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

  toggleExpanded = () => {
    this.setState({ expanded: !this.state.expanded });
  };

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
  /**
   * @summary Loops through groups of objects and changes visibility for all layers within group.
   *
   * @param {boolean} visibility
   * @param {array|object} groupsArray
   * @memberof LayerGroup
   */
  toggleGroups(visibility, groupsArray) {
    // Sometimes groupsArray is an array of objects:
    Array.isArray(groupsArray) &&
      groupsArray.forEach(group => {
        // First call this function on all groups that might be inside this group
        group.groups.length &&
          group.groups.forEach(g => {
            this.toggleGroups(visibility, g);
          });

        // Next, call toggleLayers on all layers in group
        this.toggleLayers(visibility, group.layers);
      });

    // … but sometimes it's not an array but rather an object:
    typeof groupsArray === "object" &&
      groupsArray !== null &&
      groupsArray.hasOwnProperty("groups") &&
      this.toggleGroups(visibility, groupsArray.groups);

    typeof groupsArray === "object" &&
      groupsArray !== null &&
      groupsArray.hasOwnProperty("layers") &&
      this.toggleLayers(visibility, groupsArray.layers);
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
  /**
   * If Group has "togglable" property enabled, render the toggle all checkbox.
   *
   * @returns React.Component
   * @memberof LayerGroup
   */
  renderToggleAll() {
    const { classes } = this.props;

    // The property below should be renamed to "togglable" or something…
    if (this.props.group.toggled) {
      return (
        <div
          className={classes.caption}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            if (this.isToggled()) {
              this.toggleGroups(false, this.props.group.groups);
              this.toggleLayers(false, this.props.group.layers);
            } else {
              this.toggleGroups(true, this.props.group.groups);
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
                        const informativeWindow = this.props.app.windows.find(
                          window => window.type === "informative"
                        );
                        informativeWindow.props.custom.open(chapter);
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
