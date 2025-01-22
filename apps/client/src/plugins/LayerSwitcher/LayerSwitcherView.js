import React from "react";
import { createPortal } from "react-dom";
import propTypes from "prop-types";

import { styled } from "@mui/material/styles";
import { AppBar, Tab, Tabs, Box, ListItemText } from "@mui/material";

import BackgroundSwitcher from "./components/BackgroundSwitcher.js";
import LayerGroup from "./components/LayerGroup.js";
import BreadCrumbs from "./components/BreadCrumbs.js";
import DrawOrder from "./components/DrawOrder.js";
import QuickAccessPresets from "./components/QuickAccessPresets.js";
import QuickAccessView from "./components/QuickAccessView.js";
import LayerItemDetails from "./components/LayerItemDetails.js";
import LayerListFilter from "./components/LayerListFilter.js";
import { debounce } from "utils/debounce";
import { OSM_LAYER_ID } from "./components/BackgroundSwitcher";

const StyledAppBar = styled(AppBar)(() => ({
  top: -10,
}));

const DEFAULT_MIN_FILTER_LENGTH = 3;

/**
 * BreadCrumbs are a feature used to "link" content between LayerSwitcher
 * and Informative plugins. They get rendered directly to #map, as they
 * are not part of LayerSwitcher plugin, at least not visually. To achieve
 * that we use createPortal().
 *
 * @returns
 * @memberof LayersSwitcherView
 */
const BreadCrumbsContainer = ({ map, app }) => {
  return createPortal(
    // We must wrap the component in a div, on which we can catch
    // events. This is done to prevent event bubbling to the
    // layerSwitcher component.
    <div onMouseDown={(e) => e.stopPropagation()}>
      <BreadCrumbs map={map} app={app} />
    </div>,
    document.getElementById("breadcrumbs-container")
  );
};

// TODO Turn this to Functional component

class LayersSwitcherView extends React.PureComponent {
  static propTypes = {
    app: propTypes.object.isRequired,
    map: propTypes.object.isRequired,
    localObserver: propTypes.object.isRequired,
    globalObserver: propTypes.object.isRequired,
    options: propTypes.object.isRequired,
  };

  constructor(props) {
    super(props);
    this.options = props.options;
    this.olLayerMap = props.map
      .getLayers()
      .getArray()
      .reduce((a, b) => {
        a[b.get("name")] = b;
        return a;
      }, {});
    this.baseLayers = props.map
      .getLayers()
      .getArray()
      .filter((l) => l.get("layerType") === "base")
      .map((l) => l.getProperties());

    this.state = {
      chapters: [],
      activeTab: 0,
      displayContentOverlay: null, // 'quickAccessPresets' | 'favorites' | 'layerItemDetails'
      layerItemDetails: null,
      filterValue: "",
      scrollPositions: {
        tab0: 0,
        tab1: 0,
        tab2: 0,
      },
    };

    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.globalObserver;

    this.staticLayerConfig = this.props.staticLayerConfig;
    this.staticLayerTree = this.props.staticLayerTree;

    this.backgroundLayerMap = this.baseLayers.map((l) => ({
      id: l["name"],
      name: l["caption"],
      visible: l["visible"],
      zIndex: l["zIndex"],
    }));

    this.minFilterLength =
      this.options?.layerFilterMinLength ?? DEFAULT_MIN_FILTER_LENGTH;

    props.app.globalObserver.subscribe("informativeLoaded", (chapters) => {
      if (Array.isArray(chapters)) {
        this.setState({
          chapters: chapters,
        });
      }
    });

    props.app.globalObserver.subscribe("setLayerDetails", (payload) => {
      if (payload) {
        const currentScrollPosition = this.getScrollPosition();

        const layerId = payload.layerId;
        if (!layerId) {
          return;
        }

        let layer;

        if (layerId === OSM_LAYER_ID) {
          // The Open street map layer is set up by the `BackgroundSwitcher`
          // component. So it does not exist when the `olLayerMap` is created.
          // code below is an ugly workaround. The best solution would be if
          // the `LayerItemDetails` does not need the actual OpenLayers object
          // at all. Or if the OSM layer is configured in the actual map
          // config.
          layer = this.props.app.map
            .getLayers()
            .getArray()
            .find((layer) => layer.get("name") === OSM_LAYER_ID);
        } else {
          layer = this.olLayerMap[layerId];
        }

        // Set scroll position state when layer details is opened
        const details = {
          layer,
          subLayerIndex: payload.subLayerIndex,
        };
        this.setState((prevState) => ({
          layerItemDetails: details,
          displayContentOverlay: "layerItemDetails",
          scrollPositions: {
            ...prevState.scrollPositions,
            [`tab${prevState.activeTab}`]: currentScrollPosition,
          },
        }));
      } else {
        this.setState({
          displayContentOverlay: null,
        });
      }
    });
  }

  // Handles click on Layerpackage button and backbutton
  handleQuickAccessPresetsToggle = (quickAccessPresetsState) => {
    quickAccessPresetsState?.event?.stopPropagation();
    // Set scroll position state when layer package is opened
    const currentScrollPosition = this.getScrollPosition();
    this.setState((prevState) => ({
      displayContentOverlay:
        this.state.displayContentOverlay === "quickAccessPresets"
          ? null
          : "quickAccessPresets",
      scrollPositions: {
        ...prevState.scrollPositions,
        [`tab${prevState.activeTab}`]: currentScrollPosition,
      },
    }));
  };

  // Handles click on Favorites button and backbutton
  handleFavoritesViewToggle = (quickAccessPresetsState) => {
    quickAccessPresetsState?.event?.stopPropagation();
    // Set scroll position state when favorites view is opened
    const currentScrollPosition = this.getScrollPosition();
    this.setState((prevState) => ({
      displayContentOverlay:
        this.state.displayContentOverlay === "favorites" ? null : "favorites",
      scrollPositions: {
        ...prevState.scrollPositions,
        [`tab${prevState.activeTab}`]: currentScrollPosition,
      },
    }));
  };

  // TODO Use this function
  collapseAllGroups = () => {
    // const collapseGroups = (groups) => {
    //   groups.forEach((group) => {
    //     group.isExpanded = false;
    //     if (group.groups && group.groups.length > 0) {
    //       collapseGroups(group.groups);
    //     }
    //   });
    // };
    // collapseGroups(this.layerTree);
  };

  handleFilterSubmit = (value) => {
    const filterValue = value === "" ? null : value;
    if (filterValue?.length > 0) {
      this.setState({ filterValue });
    }
  };

  // Handles filter functionality
  handleFilterValueChange = debounce((value) => {
    const filterValue = value === "" ? null : value;

    if (value === "") {
      this.setState({ filterValue: null });
    } else if (filterValue.length >= this.minFilterLength) {
      this.setState({ filterValue });
    }
  }, 100);

  /**
   * LayerSwitcher consists of two Tabs: one shows
   * "regular" layers (as checkboxes, multi select), and the
   * other shows background layers (as radio buttons, one-at-at-time).
   * And the DrawOrder tab
   *
   * This method controls which of the two Tabs is visible and hides QuickAccessPresets view.
   *
   * @memberof LayersSwitcherView
   */
  handleChangeTabs = (_, activeTab) => {
    // Set scroll position state when tab is changed
    const currentScrollPosition = this.getScrollPosition();
    this.setState((prevState) => ({
      activeTab,
      displayContentOverlay: null,
      scrollPositions: {
        ...prevState.scrollPositions,
        [`tab${prevState.activeTab}`]: currentScrollPosition,
      },
    }));
  };

  /**
   * This method resets scrollposition when component updates,
   * but only when tab is changed or content overlay is opened.
   *
   * @memberof LayersSwitcherView
   */
  componentDidUpdate(_, prevState) {
    if (
      prevState.activeTab !== this.state.activeTab ||
      prevState.displayContentOverlay !== this.state.displayContentOverlay
    ) {
      // Reset scroll position when tab is changed, or when content overlay is opened
      const { scrollPositions } = this.state;
      const currentScrollPosition =
        scrollPositions[`tab${this.state.activeTab}`];
      if (currentScrollPosition !== undefined) {
        const scrollContainer = document.getElementById("scroll-container");
        scrollContainer.scrollTop = currentScrollPosition;
      }
    }
  }

  /**
   * This method gets scrollposition of container
   *
   * @memberof LayersSwitcherView
   */
  getScrollPosition = () => {
    const scrollContainer = document.getElementById("scroll-container"); // Byt ut mot din scroll-container ID
    return scrollContainer.scrollTop;
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

  render() {
    const { windowVisible, layersState } = this.props;

    const filterValue = this.state.filterValue;
    let filterHits = null;

    const searchIndex = Object.values(this.staticLayerConfig).flatMap((l) => {
      let subLayerIndex = [];
      if (l.allSubLayers?.length > 1) {
        subLayerIndex = l.allSubLayers.map((sl) => {
          const subLayerInfo = l.layerInfo.layersInfo[sl];
          return [subLayerInfo.caption, l.id];
        });
      }

      return [...subLayerIndex, [l.caption, l.id]];
    });

    if (filterValue) {
      const lowercaseFilterValue = filterValue.toLocaleLowerCase();
      const hits = searchIndex
        ?.filter(([name, _]) =>
          name.toLocaleLowerCase().includes(lowercaseFilterValue)
        )
        ?.map(([_, id]) => id);
      filterHits = new Set(hits);
    }

    return (
      <div
        style={{
          display: windowVisible ? "block" : "none",
        }}
      >
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
            {this.options.showDrawOrderView === true && (
              <Tab label={"Ritordning"} />
            )}
          </Tabs>
        </StyledAppBar>
        <div
          id="scroll-container"
          style={{ position: "relative", height: "100%", overflowY: "auto" }}
        >
          <Box
            style={{
              display:
                this.state.activeTab === 0 &&
                this.state.displayContentOverlay === null
                  ? "block"
                  : "none",
            }}
          >
            {this.props.options.showFilter && (
              <LayerListFilter
                minFilterLength={this.minFilterLength}
                handleFilterSubmit={(value) => this.handleFilterSubmit(value)}
                handleFilterValueChange={(value) =>
                  this.handleFilterValueChange(value)
                }
              />
            )}
            {filterHits === null && (
              <QuickAccessView
                show={this.props.options.showQuickAccess}
                map={this.props.map}
                app={this.props.app}
                globalObserver={this.globalObserver}
                enableQuickAccessPresets={
                  this.props.options.enableQuickAccessPresets
                }
                enableUserQuickAccessFavorites={
                  this.props.options.enableUserQuickAccessFavorites
                }
                handleQuickAccessPresetsToggle={(e) =>
                  this.handleQuickAccessPresetsToggle({ event: e })
                }
                favoritesViewDisplay={
                  this.state.displayContentOverlay === "favorites"
                }
                handleFavoritesViewToggle={this.handleFavoritesViewToggle}
                favoritesInfoText={
                  this.options.userQuickAccessFavoritesInfoText
                }
                filterValue={this.state.filterValue}
                layersState={layersState}
              />
            )}
            {this.staticLayerTree.map((group) => (
              <LayerGroup
                key={group.id}
                staticLayerConfig={this.staticLayerConfig}
                staticGroupTree={group}
                layersState={layersState}
                globalObserver={this.globalObserver}
                filterHits={filterHits}
                filterValue={this.state.filterValue}
              />
            ))}
            {filterHits !== null && filterHits.size === 0 && (
              <ListItemText
                sx={{
                  py: 1,
                  px: 4,
                }}
                primary="Inga resultat"
                primaryTypographyProps={{
                  pr: 5,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  variant: "body1",
                }}
              />
            )}
          </Box>
          {this.props.options.enableQuickAccessPresets && (
            <QuickAccessPresets
              quickAccessPresets={this.options.quickAccessPresets}
              display={
                this.state.displayContentOverlay === "quickAccessPresets"
              }
              backButtonCallback={this.handleQuickAccessPresetsToggle}
              map={this.props.map}
              globalObserver={this.globalObserver}
              quickAccessPresetsInfoText={
                this.options.quickAccessPresetsInfoText
              }
            ></QuickAccessPresets>
          )}
          <LayerItemDetails
            display={this.state.displayContentOverlay === "layerItemDetails"}
            layerItemDetails={this.state.layerItemDetails}
            app={this.props.app}
            chapters={this.state.chapters}
            showOpacitySlider={this.props.options.enableTransparencySlider}
            showQuickAccess={this.props.options.showQuickAccess}
          ></LayerItemDetails>
          <BackgroundSwitcher
            display={
              this.state.activeTab === 1 &&
              this.state.displayContentOverlay === null
            }
            layers={this.baseLayers}
            layerMap={this.olLayerMap}
            backgroundSwitcherBlack={this.options.backgroundSwitcherBlack}
            backgroundSwitcherWhite={this.options.backgroundSwitcherWhite}
            enableOSM={this.options.enableOSM}
            map={this.props.map}
            globalObserver={this.props.globalObserver}
          />
          {this.options.showDrawOrderView === true && (
            <DrawOrder
              localObserver={this.localObserver}
              display={
                this.state.activeTab === 2 &&
                this.state.displayContentOverlay === null
              }
              map={this.props.map}
              app={this.props.app}
              options={this.props.options}
            ></DrawOrder>
          )}
          {this.options.showBreadcrumbs && (
            <BreadCrumbsContainer map={this.props.map} app={this.props.app} />
          )}
        </div>
      </div>
    );
  }
}

export default LayersSwitcherView;
