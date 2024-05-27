import React from "react";
import propTypes from "prop-types";
import LayerItem from "./LayerItem.js";
import { styled } from "@mui/material/styles";
import { Accordion, AccordionDetails, AccordionSummary } from "@mui/material";
import { Box, Typography, Divider, IconButton, Link } from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import InfoIcon from "@mui/icons-material/Info";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import HajkToolTip from "components/HajkToolTip.js";

const StyledAccordion = styled(Accordion)(() => ({
  borderRadius: 0,
  boxShadow: "none",
  backgroundImage: "none",
}));

const StyledAccordionSummary = styled(AccordionSummary)(() => ({
  minHeight: 35,
  padding: "0px",
  overflow: "hidden",
  "&.MuiAccordionSummary-root.Mui-expanded": {
    minHeight: 35,
  },
  "& .MuiAccordionSummary-content": {
    transition: "inherit",
    marginTop: 0,
    marginBottom: 0,
    "&.Mui-expanded": {
      marginTop: 0,
      marginBottom: 0,
    },
  },
}));

const StyledAccordionDetails = styled(AccordionDetails)(() => ({
  width: "100%",
  display: "block",
  padding: "0",
}));

const SummaryContainer = styled("div")(({ theme }) => ({
  display: "flex",
  flexBasis: "100%",
  borderBottom: `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
}));

const HeadingTypography = styled(Typography)(({ theme }) => ({
  fontSize: theme.typography.pxToRem(15),
  flexBasis: "100%",
}));

const ExpandButtonWrapper = styled("div")(() => ({
  float: "left",
}));

const checkBoxIconStyle = {
  cursor: "pointer",
  float: "left",
  marginRight: "5px",
  padding: "0",
};

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
    chapters: propTypes.array.isRequired,
    child: propTypes.bool.isRequired,
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
    this.props.app
      .getMap()
      .getAllLayers()
      .filter((mapLayer) => {
        return layers.some((layer) => layer.id === mapLayer.get("name"));
      })
      .forEach((mapLayer) => {
        if (mapLayer.get("layerType") === "group") {
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
    if (this.isToggled()) {
      return <CheckBoxIcon sx={checkBoxIconStyle} />;
    }
    if (this.isSemiToggled()) {
      return <CheckBoxIcon sx={{ ...checkBoxIconStyle, color: "gray" }} />;
    }
    return <CheckBoxOutlineBlankIcon sx={checkBoxIconStyle} />;
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
          <Typography variant="body2">{infogrouptext}</Typography>
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
          <Typography variant="body2">{infogroupowner}</Typography>
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
        <SummaryContainer
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
          <HeadingTypography
            sx={{
              fontWeight:
                this.isToggled() || this.isSemiToggled() ? "bold" : "normal",
            }}
          >
            {this.state.name}
          </HeadingTypography>
          {this.renderGroupInfoToggler()}
        </SummaryContainer>
      );
    } else {
      return (
        <SummaryContainer>
          <HeadingTypography
            sx={{
              fontWeight:
                this.isToggled() || this.isSemiToggled() ? "bold" : "normal",
            }}
          >
            {this.state.name}
          </HeadingTypography>
          {this.renderGroupInfoToggler()}
        </SummaryContainer>
      );
    }
  }

  render() {
    const { expanded } = this.state;
    return (
      // If the layerItem is a child, it should be rendered a tad to the
      // right. Apparently 21px.
      <Box sx={{ marginLeft: this.props.child ? "21px" : "0px" }}>
        <StyledAccordion
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
          <Box>
            <StyledAccordionSummary>
              <ExpandButtonWrapper>
                {expanded ? (
                  <KeyboardArrowDownIcon
                    onClick={() => this.toggleExpanded()}
                  />
                ) : (
                  <KeyboardArrowRightIcon
                    onClick={() => this.toggleExpanded()}
                  />
                )}
              </ExpandButtonWrapper>
              {this.renderToggleAll()}
            </StyledAccordionSummary>
            {this.renderGroupInfoDetails()}
          </Box>

          <StyledAccordionDetails>
            <div>
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
          </StyledAccordionDetails>
        </StyledAccordion>
      </Box>
    );
  }
}

export default LayerGroup;
