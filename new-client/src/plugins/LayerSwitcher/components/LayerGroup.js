import React from "react";
import propTypes from "prop-types";
import LayerItem from "./LayerItem.js";
import { withStyles } from "@material-ui/core/styles";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from "@material-ui/core";
import CheckBoxIcon from "@material-ui/icons/CheckBox";
import CheckBoxOutlineBlankIcon from "@material-ui/icons/CheckBoxOutlineBlank";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";

const styles = (theme) => ({
  root: {
    width: "100%",
    display: "block",
    padding: "0",
  },
  heading: {
    fontSize: theme.typography.pxToRem(15),
    flexBasis: "100%",
  },
  secondaryHeading: {
    fontSize: theme.typography.pxToRem(15),
    color: theme.palette.text.secondary,
  },
  disableTransition: {
    borderRadius: "0 !important",
    boxShadow: "none",
  },
  panel: {
    marginLeft: "21px",
  },
  /*groupCheckbox: {
    marginRight: "5px"
  },*/
  caption: {
    display: "flex",
    flexBasis: "100%",
    borderBottom: "1px solid #ccc",
  },
  panelSummary: {
    padding: "0px",
    overflow: "hidden",
  },
  checkBoxIcon: {
    cursor: "pointer",
    float: "left",
    marginRight: "5px",
    padding: "0",
  },
  arrowIcon: {
    float: "left",
  },
  Accordion: {},
});

const StyledAccordionSummary = withStyles({
  root: {
    minHeight: 35,
    "&$expanded": {
      minHeight: 35,
    },
  },
  content: {
    transition: "inherit !important",
    marginTop: "0",
    marginBottom: "0",
    "&$expanded": {
      marginTop: "0",
      marginBottom: "0",
    },
  },
  expanded: {},
})(AccordionSummary);

class LayerGroup extends React.PureComponent {
  state = {
    expanded: false,
    groups: [],
    layers: [],
    name: "",
    parent: "-1",
    toggled: false,
    chapters: [],
  };

  static defaultProps = {
    child: false,
    expanded: false,
  };

  static propTypes = {
    app: propTypes.object.isRequired,
    chapters: propTypes.array.isRequired,
    child: propTypes.bool.isRequired,
    classes: propTypes.object.isRequired,
    expanded: propTypes.bool.isRequired,
    group: propTypes.object.isRequired,
    handleChange: propTypes.func,
    model: propTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.model = this.props.model;
    this.bindVisibleChangeForLayersInGroup();
  }

  componentDidMount() {
    this.setState({
      ...this.props.group,
    });
  }

  componentWillUnmount() {
    //LayerGroup is never unmounted atm but we remove listener in case this changes in the future
    this.unbindVisibleChangeForLayersInGroup();
  }

  //We force update when a layer in this group has changed visibility to
  //be able to sync togglebuttons in GUI
  layerVisibilityChanged = (e) => {
    this.forceUpdate();
  };

  getAllLayersInGroupAndSubGroups = (groups) => {
    return groups.reduce((layers, group) => {
      if (this.hasSubGroups(group)) {
        layers = [
          ...layers,
          ...this.getAllLayersInGroupAndSubGroups(group.groups),
        ];
      }
      return [...layers, ...group.layers];
    }, []);
  };

  getAllMapLayersReferencedByGroup = () => {
    const { app, group } = this.props;
    const allLayersInGroup = this.getAllLayersInGroupAndSubGroups([group]);
    return app
      .getMap()
      .getLayers()
      .getArray()
      .filter((mapLayer) => {
        return allLayersInGroup.find((layer) => {
          return layer.id === mapLayer.get("name");
        });
      });
  };

  bindVisibleChangeForLayersInGroup = () => {
    this.getAllMapLayersReferencedByGroup().forEach((layer) => {
      layer.on("change:visible", this.layerVisibilityChanged);
    });
  };

  unbindVisibleChangeForLayersInGroup = () => {
    this.getAllMapLayersReferencedByGroup().forEach((layer) => {
      layer.un("change:visible", this.layerVisibilityChanged);
    });
  };

  handleChange = (panel) => (event, expanded) => {
    this.setState({
      expanded: expanded ? panel : false,
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
          options={this.props.options}
        />
      );
    });
  }

  toggleExpanded = () => {
    this.setState({ expanded: !this.state.expanded });
  };

  isToggled() {
    const { group } = this.props;
    return this.areAllGroupsAndSubGroupsToggled(group);
  }

  isSemiToggled() {
    const { group } = this.props;
    return this.areSubGroupsAndLayersSemiToggled(group);
  }

  layerInMap = (layer) => {
    const layers = this.props.app.getMap().getLayers().getArray();
    let foundMapLayer = layers.find((mapLayer) => {
      return mapLayer.get("name") === layer.id;
    });

    if (foundMapLayer && foundMapLayer.getVisible()) {
      return true;
    } else {
      return false;
    }
  };

  areSubGroupsAndLayersSemiToggled = (group) => {
    let someSubItemToggled = false;
    if (this.hasLayers(group)) {
      someSubItemToggled = group.layers.some((layer) => {
        return this.layerInMap(layer);
      });
    }

    if (this.hasSubGroups(group) && !someSubItemToggled) {
      someSubItemToggled = group.groups.some((g) => {
        return this.areSubGroupsAndLayersSemiToggled(g);
      });
    }
    return someSubItemToggled;
  };

  areAllGroupsAndSubGroupsToggled = (group) => {
    let allGroupsToggled = true;
    let allLayersToggled = true;
    if (this.hasSubGroups(group)) {
      allGroupsToggled = group.groups.every((g) => {
        return this.areAllGroupsAndSubGroupsToggled(g);
      });
    }
    if (this.hasLayers(group)) {
      allLayersToggled = group.layers.every((layer) => {
        return this.layerInMap(layer);
      });
    }
    return allGroupsToggled && allLayersToggled;
  };

  hasLayers = (group) => {
    return group.layers && group.layers.length > 0;
  };

  hasSubGroups = (group) => {
    return group.groups && group.groups.length > 0;
  };
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
      groupsArray.forEach((group) => {
        // First call this function on all groups that might be inside this group
        group.groups.length &&
          group.groups.forEach((g) => {
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
    var mapLayers = this.props.app.getMap().getLayers().getArray();

    mapLayers
      .filter((mapLayer) => {
        return layers.some((layer) => layer.id === mapLayer.get("name"));
      })
      .forEach((mapLayer) => {
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

  getCheckbox = () => {
    const { classes } = this.props;
    if (this.isToggled()) {
      return <CheckBoxIcon className={classes.checkBoxIcon} />;
    }
    if (this.isSemiToggled()) {
      return (
        <CheckBoxIcon
          style={{ color: "gray" }}
          className={classes.checkBoxIcon}
        />
      );
    }
    return <CheckBoxOutlineBlankIcon className={classes.checkBoxIcon} />;
  };
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
          onClick={(e) => {
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
          <div>{this.getCheckbox()}</div>
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
        <Accordion
          className={classes.disableTransition}
          expanded={this.state.expanded}
          TransitionProps={{
            timeout: 0,
          }}
          onChange={() => {
            this.setState({
              expanded: !this.state.expanded,
            });
          }}
        >
          <StyledAccordionSummary className={classes.panelSummary}>
            <div className={classes.arrowIcon}>
              {expanded ? (
                <ArrowDropDownIcon onClick={() => this.toggleExpanded()} />
              ) : (
                <ArrowRightIcon onClick={() => this.toggleExpanded()} />
              )}
            </div>
            {this.renderToggleAll()}
          </StyledAccordionSummary>
          <AccordionDetails classes={{ root: classes.root }}>
            <div className={classes.Accordion}>
              {this.state.layers.map((layer, i) => {
                const mapLayer = this.model.layerMap[layer.id];

                if (mapLayer) {
                  return (
                    <LayerItem
                      key={mapLayer.get("name")}
                      layer={mapLayer}
                      model={this.props.model}
                      options={this.props.options}
                      chapters={this.props.chapters}
                      app={this.props.app}
                      onOpenChapter={(chapter) => {
                        const informativeWindow = this.props.app.windows.find(
                          (window) => window.type === "informative"
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
          </AccordionDetails>
        </Accordion>
      </div>
    );
  }
}

export default withStyles(styles)(LayerGroup);
