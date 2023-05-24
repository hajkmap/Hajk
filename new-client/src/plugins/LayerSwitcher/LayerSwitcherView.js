import React from "react";
import { createPortal } from "react-dom";
import propTypes from "prop-types";

import { styled } from "@mui/material/styles";
import {
  AppBar,
  Divider,
  Tab,
  Tabs,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";

import BackgroundSwitcher from "./components/BackgroundSwitcher.js";
import LayerGroup from "./components/LayerGroup.js";
import BreadCrumbs from "./components/BreadCrumbs.js";
import DrawOrder from "./components/DrawOrder.js";
import LayerPackage from "./components/LayerPackage";
import PersonalLayerPackage from "./components/PersonalLayerPackage";
import LayerGroupAccordion from "./components/LayerGroupAccordion.js";

import StarOutlineOutlinedIcon from "@mui/icons-material/StarOutlineOutlined";
import CloudDownloadOutlinedIcon from "@mui/icons-material/CloudDownloadOutlined";
import QuickAccessLayers from "./components/QuickAccessLayers.js";
import QuickAccessOptions from "./components/QuickAccessOptions.js";

// The styled-component below might seem unnecessary since we are using the sx-prop
// on it as well. However, since we cannot use the sx-prop on a non-MUI-component
// (which would force us to change the <div> to a <Box>) this felt OK in this
// particular occasion.
const Root = styled("div")(() => ({
  margin: -10, // special case, we need to "unset" the padding for Window content that's set in Window.js
}));

const StyledAppBar = styled(AppBar)(() => ({
  top: -10,
}));

class LayersSwitcherView extends React.PureComponent {
  static propTypes = {
    app: propTypes.object.isRequired,
    map: propTypes.object.isRequired,
    model: propTypes.object.isRequired,
    observer: propTypes.object.isRequired,
    options: propTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.options = props.options;
    this.state = {
      chapters: [],
      baseLayers: props.model.getBaseLayers(),
      activeTab: 0,
      activeLayersCount: 0,
      displayLoadLayerPackage: false,
      displayPersonalLayerPackage: false,
      quickAccessSectionExpanded: false,
    };

    props.app.globalObserver.subscribe("informativeLoaded", (chapters) => {
      if (Array.isArray(chapters)) {
        this.setState({
          chapters: chapters,
        });
      }
    });
  }

  // Handles click on Layerpackage button and backbutton
  handleLayerPackageToggle = (layerPackageState) => {
    layerPackageState?.event?.stopPropagation();
    this.setState({
      displayLoadLayerPackage: !this.state.displayLoadLayerPackage,
    });
    if (layerPackageState?.setQuickAccessSectionExpanded) {
      this.setState({
        quickAccessSectionExpanded: true,
      });
    }
  };

  // Handles click on PersonalLayerpackage button and backbutton
  handlePersonalLayerPackageToggle = (layerPackageState) => {
    layerPackageState?.event?.stopPropagation();
    this.setState({
      displayPersonalLayerPackage: !this.state.displayPersonalLayerPackage,
    });
    if (layerPackageState?.setQuickAccessSectionExpanded) {
      this.setState({
        quickAccessSectionExpanded: true,
      });
    }
  };

  // Handles click on clear quickAccess button
  handleClearQuickAccessLayers = (e) => {
    e.stopPropagation();
    this.props.map
      .getAllLayers()
      .filter((l) => l.get("quickAccess") === true)
      .map((l) => l.set("quickAccess", false));
  };

  /**
   * This method handles layerupdates from DrawOrder component,
   * sets activeLayersCount state
   *
   * @memberof LayersSwitcherView
   */
  handleLayerChange = (activeLayers) => {
    this.setState({
      activeLayersCount: activeLayers,
    });
  };

  /**
   * LayerSwitcher consists of two Tabs: one shows
   * "regular" layers (as checkboxes, multi select), and the
   * other shows background layers (as radio buttons, one-at-at-time).
   *
   * This method controls which of the two Tabs is visible and hides LayerPackage view.
   *
   * @memberof LayersSwitcherView
   */
  handleChangeTabs = (event, activeTab) => {
    this.setState({
      activeTab,
      displayLoadLayerPackage: false,
      displayPersonalLayerPackage: false,
    });
  };

  /**
   * @summary Ensure that the selected Tab's indicator has correct width.
   * @description When Tabs are mounted, the indicator (below selected button)
   * can have incorrect width (based on calculations done prior complete render).
   * This function is called once, on mount of <Tabs> and ensures that the
   * indicator gets correct width.
   *
   * @memberof LayersSwitcherView
   */
  handleTabsMounted = (ref) => {
    // Not beautiful but it works - timeout is needed to ensure rendering is done
    // and parent's element are correct.
    setTimeout(() => {
      ref !== null && ref.updateIndicator();
    }, 1);
  };

  /**
   * @summary Loops through map configuration and
   * renders all groups. Visible only if @param shouldRender is true.
   *
   * @param {boolean} [shouldRender=true]
   * @returns {<div>}
   */
  renderLayerGroups = (shouldRender = true) => {
    return (
      <Box
        sx={{
          display:
            shouldRender === true &&
            this.state.displayLoadLayerPackage === false &&
            this.state.displayPersonalLayerPackage === false
              ? "block"
              : "none",
        }}
      >
        {/* TODO: configurable from admin */}
        {/* QuickAccess section */}
        <LayerGroupAccordion
          expanded={this.state.quickAccessSectionExpanded}
          name={"Snabblager"}
          quickAccess={
            <IconButton sx={{ pl: 0 }} disableRipple size="small">
              <StarOutlineOutlinedIcon />
            </IconButton>
          }
          layerGroupDetails={
            <>
              <IconButton
                onClick={(e) => this.handleLayerPackageToggle({ event: e })}
              >
                <Tooltip title="Ladda lagerpaket">
                  <CloudDownloadOutlinedIcon fontSize="small"></CloudDownloadOutlinedIcon>
                </Tooltip>
              </IconButton>
              <QuickAccessOptions
                handlePersonalLayerPackageToggle={
                  this.handlePersonalLayerPackageToggle
                }
                handleClearQuickAccessLayers={this.handleClearQuickAccessLayers}
              ></QuickAccessOptions>
            </>
          }
          children={
            <QuickAccessLayers
              model={this.props.model}
              options={this.props.options}
              map={this.props.map}
              app={this.props.app}
            ></QuickAccessLayers>
          }
        ></LayerGroupAccordion>
        <Divider></Divider>
        {this.options.groups.map((group, i) => {
          return (
            <LayerGroup
              key={i}
              group={group}
              model={this.props.model}
              chapters={this.state.chapters}
              app={this.props.app}
              options={this.props.options}
            />
          );
        })}
      </Box>
    );
  };

  /**
   * BreadCrumbs are a feature used to "link" content between LayerSwitcher
   * and Informative plugins. They get rendered directly to #map, as they
   * are not part of LayerSwitcher plugin, at least not visually. To achieve
   * that we use createPortal().
   *
   * @returns
   * @memberof LayersSwitcherView
   */
  renderBreadCrumbs = () => {
    return (
      this.options.showBreadcrumbs &&
      createPortal(
        // We must wrap the component in a div, on which we can catch
        // events. This is done to prevent event bubbling to the
        // layerSwitcher component.
        <div onMouseDown={(e) => e.stopPropagation()}>
          <BreadCrumbs
            map={this.props.map}
            model={this.props.model}
            app={this.props.app}
          />
        </div>,
        document.getElementById("breadcrumbs-container")
      )
    );
  };

  render() {
    const { windowVisible } = this.props;
    return (
      <Root sx={{ display: windowVisible ? "block" : "none" }}>
        <StyledAppBar
          position="sticky" // Does not work in IE11
          color="default"
        >
          <Tabs
            action={this.handleTabsMounted}
            onChange={this.handleChangeTabs}
            value={windowVisible ? this.state.activeTab : false} // If the window is not visible,
            // we cannot send a proper value to the tabs-component. If we do, mui will throw an error.
            // false is OK though, apparently.
            variant="fullWidth"
            textColor="inherit"
            sx={{ "& .MuiBadge-badge": { right: -16, top: 8 } }}
          >
            <Tab label="Kartlager" />
            <Tab label="Bakgrund" />
            {this.options.showActiveLayersView === true && (
              <Tab
                label={
                  // <Badge
                  //   badgeContent={this.state.activeLayersCount}
                  //   color="primary"
                  // >
                  "Ritordning"
                  // </Badge>
                }
              />
            )}
          </Tabs>
        </StyledAppBar>
        {this.renderLayerGroups(this.state.activeTab === 0)}
        <LayerPackage
          quickLayerPresets={this.options.quickLayersPresets}
          display={this.state.displayLoadLayerPackage}
          backButtonCallback={this.handleLayerPackageToggle}
          map={this.props.map}
          globalObserver={this.props.model.globalObserver}
        ></LayerPackage>
        <PersonalLayerPackage
          display={this.state.displayPersonalLayerPackage}
          backButtonCallback={this.handlePersonalLayerPackageToggle}
          map={this.props.map}
          app={this.props.app}
          globalObserver={this.props.model.globalObserver}
        ></PersonalLayerPackage>
        <BackgroundSwitcher
          display={this.state.activeTab === 1}
          layers={this.state.baseLayers}
          layerMap={this.props.model.layerMap}
          backgroundSwitcherBlack={this.options.backgroundSwitcherBlack}
          backgroundSwitcherWhite={this.options.backgroundSwitcherWhite}
          enableOSM={this.options.enableOSM}
          map={this.props.map}
          app={this.props.app}
        />
        {this.options.showActiveLayersView === true && (
          <DrawOrder
            model={this.props.model}
            display={this.state.activeTab === 2}
            map={this.props.map}
            app={this.props.app}
            options={this.props.options}
            onLayerChange={this.handleLayerChange}
          ></DrawOrder>
        )}
        {this.renderBreadCrumbs()}
      </Root>
    );
  }
}

export default LayersSwitcherView;
