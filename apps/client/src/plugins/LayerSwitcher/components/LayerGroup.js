import React from "react";
import propTypes from "prop-types";
import LayerItem from "./LayerItem";
import GroupLayer from "./GroupLayer";
import LayerGroupAccordion from "./LayerGroupAccordion.js";
import {
  Box,
  Typography,
  Divider,
  IconButton,
  ListItemText,
  Link,
} from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import InfoIcon from "@mui/icons-material/Info";
import HajkToolTip from "components/HajkToolTip";

class LayerGroup extends React.PureComponent {
  state = {
    expanded: false,
    groups: [],
    layers: [],
    name: "",
    parent: "-1",
    toggled: false,

    chapters: [],
    infogrouptitle: "",
    infogrouptext: "",
    infogroupurl: "",
    infogroupurltext: "",
    infogroupopendatalink: "",
    infogroupowner: "",
    infoVisible: false,
  };

  static defaultProps = {
    child: false,
    expanded: false,
  };

  static propTypes = {
    app: propTypes.object.isRequired,
    child: propTypes.bool.isRequired,
    expanded: propTypes.bool.isRequired,
    group: propTypes.object.isRequired,
    handleChange: propTypes.func,
    localObserver: propTypes.object.isRequired,
    layerMap: propTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.bindVisibleChangeForLayersInGroup();
  }

  componentDidMount() {
    this.setState({
      ...this.props.group,
      expanded: this.props.group.isExpanded,
    });
    this.allLayers = this.props.app.getMap().getAllLayers();
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

  handleChange = (panel) => (event, isExpanded) => {
    this.setState({
      expanded: isExpanded ? panel : false,
      isExpanded: isExpanded,
    });
  };

  renderLayerGroups() {
    let { expanded } = this.state;
    if (this.state.groups.length === 1 && this.state.groups[0].expanded) {
      expanded = this.state.groups[0].id;
    }
    return this.state.groups.map((group, i) => {
      return (
        <LayerGroup
          filterChangeIndicator={group.changeIndicator}
          expanded={expanded === group.id}
          key={i}
          group={group}
          localObserver={this.localObserver}
          layerMap={this.props.layerMap}
          handleChange={this.handleChange}
          app={this.props.app}
          child={true}
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
    this.allLayers
      .filter((mapLayer) => {
        return layers.some((layer) => layer.id === mapLayer.get("name"));
      })
      .forEach((mapLayer) => {
        if (mapLayer.get("layerType") === "group") {
          if (visibility === true) {
            this.props.localObserver.publish("showLayer", mapLayer);
          } else {
            this.props.localObserver.publish("hideLayer", mapLayer);
          }
        } else {
          mapLayer.setVisible(visibility);
        }
      });
  }

  getCheckbox = () => {
    if (this.isToggled()) {
      return <CheckBoxIcon />;
    }
    if (this.isSemiToggled()) {
      return <CheckBoxIcon sx={{ color: "gray" }} />;
    }
    return <CheckBoxOutlineBlankIcon />;
  };

  toggleInfo = () => {
    this.setState({
      infoVisible: !this.state.infoVisible,
    });
  };

  renderGroupInfo() {
    const {
      infogrouptitle,
      infogrouptext,
      infogroupurl,
      infogroupurltext,
      infogroupopendatalink,
      infogroupowner,
      name,
    } = this.state;

    return (
      <>
        {infogrouptitle && (
          <Typography variant="subtitle2">{infogrouptitle}</Typography>
        )}
        {infogrouptext && (
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{ __html: infogrouptext }}
          ></Typography>
        )}
        {infogroupurl && (
          <Typography variant="body2" sx={{ fontWeight: 500, mt: 1, mb: 1 }}>
            <Link href={infogroupurl} target="_blank" rel="noreferrer">
              {infogroupurltext}
            </Link>
          </Typography>
        )}
        {infogroupopendatalink && (
          <Typography variant="body2" sx={{ fontWeight: 500, mt: 1, mb: 1 }}>
            <Link href={infogroupopendatalink} target="_blank" rel="noreferrer">
              Öppna data: {name}
            </Link>
          </Typography>
        )}
        {infogroupowner && (
          <Typography
            variant="body2"
            dangerouslySetInnerHTML={{ __html: infogroupowner }}
          ></Typography>
        )}
      </>
    );
  }

  renderGroupInfoToggler = () => {
    const {
      infogrouptitle,
      infogrouptext,
      infogroupurl,
      infogroupurltext,
      infogroupopendatalink,
      infogroupowner,
      infoVisible,
    } = this.state;

    // Render icons only if one of the states above has a value
    return (
      (infogrouptitle ||
        infogrouptext ||
        infogroupurl ||
        infogroupurltext ||
        infogroupopendatalink ||
        infogroupowner) && (
        <HajkToolTip title="Mer information om gruppen">
          {infoVisible ? (
            <IconButton
              sx={{
                padding: "0px",
                "& .MuiTouchRipple-root": { display: "none" },
              }}
              onClick={(e) => {
                e.stopPropagation();
                this.toggleInfo();
              }}
            >
              <RemoveCircleIcon />
            </IconButton>
          ) : (
            <IconButton
              sx={{
                padding: "0px",
                "& .MuiTouchRipple-root": { display: "none" },
              }}
              onClick={(e) => {
                e.stopPropagation();
                this.toggleInfo();
              }}
            >
              <InfoIcon
                style={{
                  boxShadow: infoVisible
                    ? "rgb(204, 204, 204) 2px 3px 1px"
                    : "inherit",
                  borderRadius: "100%",
                }}
              />
            </IconButton>
          )}
        </HajkToolTip>
      )
    );
  };

  renderGroupInfoDetails() {
    const { infoVisible } = this.state;

    if (infoVisible) {
      return (
        <Box
          sx={{
            ml: 6,
            p: 2,
          }}
          component="div"
        >
          {this.renderGroupInfo()}
          <Divider sx={{ mt: 1 }} />
        </Box>
      );
    } else {
      return null;
    }
  }

  /**
   * If Group has "toggleable" property enabled, render the toggle all checkbox.
   *
   * @returns React.Component
   * @memberof LayerGroup
   */
  renderToggleAll() {
    // TODO: Rename props.group.toggled to "toggleable" or something…

    if (this.props.group.toggled) {
      return (
        <div
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
          <IconButton sx={{ pl: 0 }} disableRipple size="small">
            {this.getCheckbox()}
          </IconButton>
        </div>
      );
    }
    return;
  }

  renderChildren() {
    // const { expanded } = this.state;
    return (
      <div>
        {this.props.group.layers.map((layer, i) => {
          const mapLayer = this.props.layerMap[layer.id];
          // If mapLayer doesn't exist, the layer shouldn't be displayed
          if (!mapLayer) {
            return null;
          }

          // Check if it's a group or a regular layer
          const isGroup = mapLayer.get("layerType") === "group";
          const Component = isGroup ? GroupLayer : LayerItem;

          // Render the component with the appropriate attributes
          return (
            <Component
              display={!layer.isFiltered ? "none" : "block"}
              key={mapLayer.get("name")}
              layer={mapLayer}
              draggable={false}
              toggleable={true}
              app={this.props.app}
              observer={this.props.localObserver}
              groupLayer={layer}
            />
          );
        })}
        {this.renderLayerGroups()}
      </div>
    );
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    // Check if the isExpanded property has changed
    if (nextProps.group.isExpanded !== prevState.isExpanded) {
      return {
        expanded: nextProps.group.isExpanded,
        isExpanded: nextProps.group.isExpanded, // Keep a copy of isExpanded in state for comparison
      };
    }
    return null;
  }

  render() {
    const { expanded } = this.state;
    return (
      <LayerGroupAccordion
        display={!this.props.group.isFiltered ? "none" : "block"}
        toggleable={this.props.group.toggled}
        expanded={expanded}
        toggleDetails={this.renderToggleAll()}
        layerGroupTitle={
          <ListItemText
            primaryTypographyProps={{
              py: this.props.group.toggled ? 0 : "3px",
              pl: this.props.group.toggled ? 0 : "3px",
              fontWeight:
                this.isToggled() || this.isSemiToggled() ? "bold" : "inherit",
            }}
            primary={this.state.name}
          />
        }
        children={this.renderChildren()}
      ></LayerGroupAccordion>
    );
  }
}

export default LayerGroup;
