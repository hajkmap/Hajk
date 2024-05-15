import React from "react";
import { createPortal } from "react-dom";
import propTypes from "prop-types";

import { styled } from "@mui/material/styles";
import { AppBar, Tab, Tabs } from "@mui/material";

import BackgroundSwitcher from "./components/BackgroundSwitcher.js";
import LayerGroup from "./components/LayerGroup.js";
import BreadCrumbs from "./components/BreadCrumbs.js";
import DrawOrder from "./components/DrawOrder.js";

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

const ContentWrapper = styled("div")(() => ({
  padding: 10,
}));

class LayersSwitcherView extends React.PureComponent {
  static propTypes = {
    app: propTypes.object.isRequired,
    map: propTypes.object.isRequired,
    model: propTypes.object.isRequired,
    observer: propTypes.object.isRequired,
    options: propTypes.object.isRequired,
  };

  // Static members to determine which Tabs should be rendered.
  #renderRegularLayersView;
  #renderBackgroundLayersView;
  #renderActiveLayersView;

  constructor(props) {
    super(props);
    this.options = props.options;

    // Let's prepare some constants that will be used to determine which
    // tabs should be rendered.

    // Regular layers are straightforward.
    this.#renderRegularLayersView = this.options.groups.length > 0;

    // The Backgrounds tab should be visible if there are baselayers in
    // config or if any of the special layers is enabled.
    this.#renderBackgroundLayersView =
      this.options.baselayers.length > 0 ||
      this.options.enableOSM === true ||
      this.options.backgroundSwitcherBlack ||
      this.options.backgroundSwitcherWhite;

    // The Active layers tab is straightforward too.
    this.#renderActiveLayersView = this.options.showActiveLayersView ?? false;

    this.state = {
      chapters: [],
      baseLayers: props.model.getBaseLayers(),
      activeTab: this.#renderRegularLayersView // Let's calculate which
        ? "regularLayers" // view should be visible on start, given
        : this.#renderBackgroundLayersView // that we must find out which
          ? "backgroundLayers" // tabs are available.
          : false,
    };

    props.app.globalObserver.subscribe("informativeLoaded", (chapters) => {
      if (Array.isArray(chapters)) {
        this.setState({
          chapters: chapters,
        });
      }
    });
  }

  /**
   * LayerSwitcher consists of one to three Tabs:
   * - one shows regular layers (as checkboxes, multi select)
   * - one show the background layers (as radio buttons, one-at-at-time)
   * - there's also an option to show a tab with active layers only.
   *
   * This method handles switching to the selected tab's content.
   *
   * @memberof LayersSwitcherView
   */
  handleChangeTabs = (event, activeTab) => {
    this.setState({ activeTab });
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
      <div
        style={{
          display: shouldRender === true ? "block" : "none",
        }}
      >
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
      </div>
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
          >
            {this.#renderRegularLayersView && (
              <Tab label="Kartlager" value="regularLayers" />
            )}
            {this.#renderBackgroundLayersView && (
              <Tab label="Bakgrund" value="backgroundLayers" />
            )}
            {this.#renderActiveLayersView && (
              <Tab label="Aktiva lager" value="activeLayers" />
            )}
          </Tabs>
        </StyledAppBar>
        <ContentWrapper>
          {this.#renderRegularLayersView &&
            this.renderLayerGroups(this.state.activeTab === "regularLayers")}
          {this.#renderBackgroundLayersView && (
            <BackgroundSwitcher
              display={this.state.activeTab === "backgroundLayers"}
              layers={this.state.baseLayers}
              layerMap={this.props.model.layerMap}
              backgroundSwitcherBlack={this.options.backgroundSwitcherBlack}
              backgroundSwitcherWhite={this.options.backgroundSwitcherWhite}
              enableOSM={this.options.enableOSM}
              map={this.props.map}
              app={this.props.app}
            />
          )}
          {this.#renderActiveLayersView &&
            this.state.activeTab === "activeLayers" && (
              <DrawOrder map={this.props.map} app={this.props.app} />
            )}
        </ContentWrapper>
        {this.renderBreadCrumbs()}
      </Root>
    );
  }
}

export default LayersSwitcherView;
