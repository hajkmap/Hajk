import React from "react";
import propTypes from "prop-types";
import LayerItem from "./LayerItem";
import GroupLayer from "./GroupLayer";
import LayerGroupAccordion from "./LayerGroupAccordion.js";
import { Typography, IconButton, ListItemText, Link } from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import InfoIcon from "@mui/icons-material/Info";
import HajkToolTip from "components/HajkToolTip";

/**
 * If Group has "toggleable" property enabled, render the toggle all checkbox.
 */
const ToggleAllComponent = ({
  toggleable,
  toggled,
  semiToggled,
  clickHandler,
}) => {
  if (!toggleable) {
    return null;
  }
  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        clickHandler();
      }}
    >
      <IconButton sx={{ pl: 0 }} disableRipple size="small">
        {toggled ? (
          <CheckBoxIcon />
        ) : semiToggled ? (
          <CheckBoxIcon sx={{ color: "gray" }} />
        ) : (
          <CheckBoxOutlineBlankIcon />
        )}
      </IconButton>
    </div>
  );
};

const GroupInfoDetails = ({
  name,
  infoVisible,
  infogrouptitle = "",
  infogrouptext = "",
  infogroupurl = "",
  infogroupurltext = "",
  infogroupopendatalink = "",
  infogroupowner = "",
}) => {
  if (!infoVisible) {
    return null;
  }
  return (
    <div>
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
    </div>
  );
};

const GroupInfoToggler = ({
  clickHandler,
  infoVisible,
  infogrouptitle = "",
  infogrouptext = "",
  infogroupurl = "",
  infogroupurltext = "",
  infogroupopendatalink = "",
  infogroupowner = "",
}) => {
  if (
    !(
      infogrouptitle ||
      infogrouptext ||
      infogroupurl ||
      infogroupurltext ||
      infogroupopendatalink ||
      infogroupowner
    )
  ) {
    return null;
  }
  // Render icons only if one of the states above has a value
  return (
    <HajkToolTip title="Mer information om gruppen">
      <IconButton
        sx={{
          padding: "0px",
          "& .MuiTouchRipple-root": { display: "none" },
        }}
        onClick={(e) => {
          e.stopPropagation();
          clickHandler();
        }}
      >
        {infoVisible ? <RemoveCircleIcon /> : <InfoIcon />}
      </IconButton>
    </HajkToolTip>
  );
};

class LayerGroup extends React.PureComponent {
  // expanded
  // isExpanded
  // infoVisible
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
    expanded: false,
  };

  static propTypes = {
    app: propTypes.object.isRequired,
    expanded: propTypes.bool.isRequired,
    group: propTypes.object.isRequired,
    localObserver: propTypes.object.isRequired,
    layerMap: propTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.bindVisibleChangeForLayersInGroup();
    console.log(this.props.group);
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
  layerVisibilityChanged = (_) => {
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

  handleChange = (panel) => (_, isExpanded) => {
    this.setState({
      expanded: isExpanded ? panel : false,
      isExpanded: isExpanded,
    });
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

  toggleInfo = () => {
    this.setState({
      infoVisible: !this.state.infoVisible,
    });
  };

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
    let groupsExpanded = expanded;
    if (this.state.groups.length === 1 && this.state.groups[0].expanded) {
      groupsExpanded = this.state.groups[0].id;
    }
    return (
      <LayerGroupAccordion
        display={!this.props.group.isFiltered ? "none" : "block"}
        toggleable={this.props.group.toggled}
        expanded={expanded}
        toggleDetails={
          <ToggleAllComponent
            toggleable={this.props.group.toggled}
            toggled={this.isToggled()}
            semiToggled={this.isSemiToggled()}
            clickHandler={() => {
              if (this.isToggled()) {
                this.toggleGroups(false, this.props.group.groups);
                this.toggleLayers(false, this.props.group.layers);
              } else {
                this.toggleGroups(true, this.props.group.groups);
                this.toggleLayers(true, this.props.group.layers);
              }
            }}
          />
        }
        layerGroupTitle={
          <div>
            <div style={{ display: "flex", flexDirection: "row" }}>
              <GroupInfoToggler
                clickHandler={() => this.toggleInfo()}
                infoVisible={this.state.infoVisible}
                infogrouptitle={this.state.infogrouptitle}
                infogrouptext={this.state.infogrouptext}
                infogroupurl={this.state.infogroupurl}
                infogroupurltext={this.state.infogroupurltext}
                infogroupopendatalink={this.state.infogroupopendatalink}
                infogroupowner={this.state.infogroupowner}
              />
              <ListItemText
                primaryTypographyProps={{
                  py: this.props.group.toggled ? 0 : "3px",
                  pl: this.props.group.toggled ? 0 : "3px",
                  variant: "body1",
                  fontWeight:
                    this.isToggled() || this.isSemiToggled()
                      ? "bold"
                      : "inherit",
                }}
                primary={this.state.name}
              />
            </div>
            <GroupInfoDetails
              name={this.props.group.name}
              infoVisible={this.state.infoVisible}
              infogrouptitle={this.state.infogrouptitle}
              infogrouptext={this.state.infogrouptext}
              infogroupurl={this.state.infogroupurl}
              infogroupurltext={this.state.infogroupurltext}
              infogroupopendatalink={this.state.infogroupopendatalink}
              infogroupowner={this.state.infogroupowner}
            />
          </div>
        }
      >
        <div>
          {this.props.group.layers.map((layer) => {
            const mapLayer = this.props.layerMap[layer.id];
            // If mapLayer doesn't exist, the layer shouldn't be displayed
            if (!mapLayer) {
              return null;
            }

            return mapLayer.get("layerType") === "group" ? (
              <GroupLayer
                display={!layer.isFiltered ? "none" : "block"}
                key={mapLayer.get("name")}
                layer={mapLayer}
                draggable={false}
                toggleable={true}
                app={this.props.app}
                localObserver={this.props.localObserver}
                groupLayer={layer}
              />
            ) : (
              <LayerItem
                display={!layer.isFiltered ? "none" : "block"}
                key={mapLayer.get("name")}
                layer={mapLayer}
                draggable={false}
                toggleable={true}
                app={this.props.app}
                localObserver={this.props.localObserver}
                groupLayer={layer}
              />
            );
          })}
          {this.state.groups.map((group, i) => (
            <LayerGroup
              filterChangeIndicator={group.changeIndicator}
              expanded={groupsExpanded === group.id}
              key={i}
              group={group}
              localObserver={this.props.localObserver}
              layerMap={this.props.layerMap}
              handleChange={this.handleChange}
              app={this.props.app}
              options={this.props.options}
            />
          ))}
        </div>
      </LayerGroupAccordion>
    );
  }
}

export default LayerGroup;
