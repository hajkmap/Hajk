import React from "react";
import { createPortal } from "react-dom";
import propTypes from "prop-types";

import { styled } from "@mui/material/styles";
import { AppBar, Tab, Tabs, Box } from "@mui/material";

import BackgroundSwitcher from "./components/BackgroundSwitcher.js";
import LayerGroup from "./components/LayerGroup.js";
import BreadCrumbs from "./components/BreadCrumbs.js";
import DrawOrder from "./components/DrawOrder.js";
import QuickAccessPresets from "./components/QuickAccessPresets.js";
import QuickAccessView from "./components/QuickAccessView.js";
import LayerItemDetails from "./components/LayerItemDetails.js";
import LayerListFilter from "./components/LayerListFilter.js";
import { debounce } from "utils/debounce";

const StyledAppBar = styled(AppBar)(() => ({
  top: -10,
}));

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

// ---------------------------------------------------------------------------
// TODO
// - DONE Break out filter to own component
// - DONE Break out QuickAccess to own Component
// - DONE Break out layer list to own Component - mayebe not
// - DONE Remove LayerSwitcherModel and pass around `map`, `app`, `localObserver`
// and `globalObserver` as needed.
// - DONE remove quickaccess from LayerGroupAccordinon
// - DONE Remove layerCount
// - DONE Test the "Theme/quickAccessPresets" functionality
// - DONE Fix the bug sometimes click layer in the quick access don't update
//
// - DONE Move `addLayerNames` to pure fn
// - Update state managemetn and keeep in sync with OpenLayers
//
// - Refactor the observers to use a provider instead of prop-drilling
// - The layer pagage dialogs should use ConfirmationDialog component
// - Remove `show` prop from quickAccess layers
//
// - DONE Clean upp render* methods in BackgroundSwitcher.
//   Should make it faster as well. - Did not make it faster,
//   but there is still more to do. More indirection to remove
//
// - Refactor LayerItem into 3 separate components for each tab
//     At least 3. Clean it up and remove indirection
//
// - Move ZoomCheck into core code
//
//
// - Maybe reconsider the "window-management"
//      Redo
//      Maybe this isn't important right now. Would be nice to fix, but it work
//      as it is. I could move it to a own component though.
//
//

// {
//    id: string
//    name: string
//    isFiltered:
//    isExpanded:
//    expanded: boolean
//    toggled: boolean
//    type: "group" | "layer" | "subLayer" | "base"
//    infogroupvisible: boolean
//    subLayers: ???
//    parent: string
//    changeIndicator: Date
// }
const getOlLayerInfo = (olLayer) => {
  if (!olLayer) {
    return null;
  }
  return {
    id: olLayer.get("name"),
    name: olLayer.get("caption"),
    visible: olLayer.get("visible"),
    opacity: olLayer.get("opacity"),
    layerType: olLayer.get("layerType"),
    quickAccess: olLayer.get("quickAccess"),
    subLayers: olLayer.get("subLayers"),
    layerInfo: olLayer.get("layerInfo"),
    url: olLayer.get("url"),
    zIndex: olLayer.get("zIndex"),
    maxZoom: olLayer.get("maxZoom"),
    minZoom: olLayer.get("minZoom"),
    minMaxZoomAlertOnToggleOnly: olLayer.get("minMaxZoomAlertOnToggleOnly"),
  };
};

const getLayerNodes = (groups, olLayerMap) =>
  groups?.flatMap((node) => {
    if (!node) {
      return undefined;
    }
    const layers = getLayerNodes(node.layers, olLayerMap);
    const subgroups = getLayerNodes(node.groups, olLayerMap);

    const children = [...(layers ?? []), ...(subgroups ?? [])];

    // A group should have both defined
    const isGroup = !!(node.groups && node.layers);

    return [
      {
        id: node.id,
        name: olLayerMap[node.id]?.get("caption") ?? node.name,
        isFiltered: true,
        isExpanded: false,
        expanded: node.expanded,
        toggled: node.toggled,
        drawOrder: node.drawOrder,
        infobox: node.infobox,
        isGroup,
        layerType: isGroup ? "group" : node.layerType,
        visible: olLayerMap[node.id]?.get("visible"),
        quickAccess: olLayerMap[node.id]?.get("quickAccess"),
        visibleAtStart: node.visibleAtStart,
        visibleForGroups: node.visibleForGroups,
        changeIndicator: new Date(),
        infogroupvisible: node.infogroupvisible,
        infogrouptitle: node.infogrouptitle,
        infogrouptext: node.infogrouptext,
        infogroupurl: node.infogroupurl,
        infogroupurltext: node.infogroupurltext,
        infogroupopendatalink: node.infogroupopendatalink,
        infogroupowner: node.infofnodeowner,
      },
      ...(children?.length === 0 ? [] : children),
    ];
  });

const buildLayerMap = (groups, olLayerMap) => {
  const nodes = getLayerNodes(groups, olLayerMap);

  return nodes?.reduce((a, b) => {
    a[b.id] = b;
    return a;
  }, {});
};

// Prepare tree data for filtering
const addLayerNames = (data, olLayerMap) => {
  const node = data.map((item) => {
    const layers = item.layers?.map((layer) => {
      const mapLayer = olLayerMap[layer.id];
      if (!mapLayer) {
        console.warn(`Maplayer with id ${layer.id} not found`);
        return undefined;
      }

      const subLayers =
        mapLayer.get("layerType") === "group" &&
        mapLayer
          .get("subLayers")
          .map((subLayer) => {
            // If the `layerInfo` is missing from a sublayer we ignore it
            // completely.
            const subLayerInfo = mapLayer.layersInfo[subLayer];
            if (!subLayerInfo) {
              return null;
            }

            return {
              id: subLayer,
              name: subLayerInfo.caption,
              isFiltered: true,
              changeIndicator: new Date(),
            };
          })
          .filter((sl) => !!sl);

      return {
        drawOrder: layer.drawOrder,
        infobox: layer.infobox,
        layerType: layer.layerType,
        visibleAtStart: layer.visibleAtStart,
        visibleForGroups: layer.visibleForGroups,
        id: layer.id,
        name: mapLayer.get("caption"),
        isFiltered: true,
        subLayers: subLayers,
      };
    });

    return {
      id: item.id,
      name: item.name,
      expanded: item.expanded,
      toggled: item.toggled,
      type: item.type,
      layers,
      infogroupvisible: item.infogroupvisible,
      infogrouptitle: item.infogrouptitle,
      infogrouptext: item.infogrouptext,
      infogroupurl: item.infogroupurl,
      infogroupurltext: item.infogroupurltext,
      infogroupopendatalink: item.infogroupopendatalink,
      infogroupowner: item.infofitemowner,
      subLayers: item.sublayers,
      parent: item.parent,
      isFiltered: true,
      isExpanded: false,
      changeIndicator: new Date(),
      groups: item.groups ? addLayerNames(item.groups, olLayerMap) : undefined,
    };
  });
  return node;
};

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
    this.layerTree = addLayerNames(this.options.groups, this.olLayerMap);
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
      treeData: this.layerTree,
      scrollPositions: {
        tab0: 0,
        tab1: 0,
        tab2: 0,
      },
      // layerMap:
    };

    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.globalObserver;

    this.layerMap = buildLayerMap(this.options.groups, this.olLayerMap);

    // console.log(this.layerTreeData);
    // console.log(this.layerMap);
    // console.log(this.olLayerMap);

    // this.backgroundLayerMap = Object.fromEntries(
    //   Object.entries(this.layerMap).filter(([_, v]) => v.layerType !== "base")
    // );

    this.backgroundLayerMap = this.baseLayers.map((l) => ({
      id: l["name"],
      name: l["caption"],
      visible: l["visible"],
      zIndex: l["zIndex"],
    }));

    // TODO Unsubscribe
    // props.map.getAllLayers().forEach((l) => {
    //   l.on("propertychange", (e) => {
    //     this.setState({
    //       layerMap: buildLayerMap(this.options.groups, this.olLayerMap),
    //     });

    //     console.log(
    //       "layer:change",
    //       l.get("caption"),
    //       e,
    //       getOlLayerInfo(e.target),
    //       this.layerMap
    //     );
    //   });
    // });

    props.app.globalObserver.subscribe("informativeLoaded", (chapters) => {
      if (Array.isArray(chapters)) {
        this.setState({
          chapters: chapters,
        });
      }
    });

    props.app.globalObserver.subscribe("setLayerDetails", (details) => {
      if (details) {
        // Set scroll position state when layer details is opened
        const currentScrollPosition = this.getScrollPosition();
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

    // TODO This is a work around for showing/hideing group layers which are
    // collapsed. It's also the GroupLayer component that listens for this.
    // That should be refactored.
    // TODO Unsubscribe
    this.localHideLayerSubscription = this.localObserver.subscribe(
      "hideLayer",
      (la) => {
        // TODO Make sure QuickAccess updates
        // Send some event
        la.setVisible(false);
        // this.setState({ treeData: [...this.layerTree] });
      }
    );
    this.localShowLayerSubscription = this.localObserver.subscribe(
      "showLayer",
      (la) => {
        la.setVisible(true);
        // TODO Make sure QuickAccess updates
        // Send some event
        // this.setState({ treeData: [...this.layerTree] });
      }
    );
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

  // Filter tree data
  filterTree = (node, filterText, parentMatch = false) => {
    let foundInChild = false;

    // Determine if the current node matches the filter
    const selfMatch =
      filterText === "" ||
      node.name.toLocaleLowerCase().includes(filterText.toLocaleLowerCase());

    // If the current node matches the filter criteria or if there is a parent match, mark it as filtered
    if (parentMatch || selfMatch) {
      this.updateNode(node, true, true); // Update node to be visible
      foundInChild = true;
    }

    // Process child layers
    if (node.layers) {
      node.layers.forEach((layer) => {
        // Pass true if either parent matches, or this node itself matches
        foundInChild =
          this.filterTree(layer, filterText, parentMatch || selfMatch) ||
          foundInChild;
      });
    }

    // Process child groups
    if (node.groups) {
      node.groups.forEach((group) => {
        // Pass true if either parent matches, or this node itself matches
        foundInChild =
          this.filterTree(group, filterText, parentMatch || selfMatch) ||
          foundInChild;
      });
    }

    // Update the current node based on child findings or its own match status
    this.updateNode(node, foundInChild || selfMatch, false);

    // If a parentMatch exists or the current node itself is a match, check the expandFilteredResults setting to determine if the node should be expanded
    if (foundInChild || selfMatch) {
      if (this.options.expandFilteredResults) {
        node.isExpanded = true; // Expand the node if expandFilteredResults is true
      }
    }

    return foundInChild || selfMatch;
  };

  updateNode = (node, isFiltered, compare) => {
    if (!compare) {
      // Indicate that node has changed
      node.changeIndicator = new Date();
    } else if (node.isFiltered !== isFiltered) {
      // Indicate that node has changed
      node.changeIndicator = new Date();
    }
    node.isFiltered = isFiltered;
  };

  setChildrenFiltered = (node, value) => {
    if (node.layers) {
      node.layers.forEach((layer) => {
        this.updateNode(layer, value, true);
        this.setChildrenFiltered(layer, value);
      });
    }

    if (node.groups) {
      node.groups.forEach((group) => {
        this.updateNode(group, value, true);
        this.setChildrenFiltered(group, value);
      });
    }

    if (node.subLayers) {
      node.subLayers.forEach((subLayer) => {
        this.updateNode(subLayer, value, true);
        subLayer.isFiltered = value;
      });
    }
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

  collapseAllGroups = () => {
    const collapseGroups = (groups) => {
      groups.forEach((group) => {
        group.isExpanded = false;
        if (group.groups && group.groups.length > 0) {
          collapseGroups(group.groups);
        }
      });
    };

    collapseGroups(this.layerTree);
  };

  // Call this method for each root node in the tree when the filter is cleared
  resetFilterStatus = (node) => {
    node.isFiltered = true; // Mark node as filtered
    node.isExpanded = false; // Collapse all groups by default
    node.changeIndicator = new Date(); // Update change indicator

    // Recursively reset status for layers, groups, and subLayers
    if (node.layers) {
      node.layers.forEach((layer) => this.resetFilterStatus(layer));
    }
    if (node.groups) {
      node.groups.forEach((group) => this.resetFilterStatus(group));
    }
    if (node.subLayers) {
      node.subLayers.forEach((subLayer) => this.resetFilterStatus(subLayer));
    }
  };

  // Handles filter functionality
  handleFilterValueChange = debounce((value) => {
    const filterCleared = value === "" && this.state.filterValue !== "";
    this.setState({ filterValue: value });

    if (filterCleared) {
      // Reset filter status when filter is cleared
      this.layerTree.forEach((node) => this.resetFilterStatus(node));
    } else {
      // Apply filter and propagate matches
      this.layerTree.forEach((node) => this.filterTree(node, value));
    }

    // Trigger re-render
    this.setState({ treeData: [...this.layerTree] });
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
                handleFilterValueChange={(value) =>
                  this.handleFilterValueChange(value)
                }
              />
            )}
            <QuickAccessView
              show={this.props.options.showQuickAccess}
              map={this.props.map}
              app={this.props.app}
              localObserver={this.localObserver}
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
              favoritesInfoText={this.options.userQuickAccessFavoritesInfoText}
              treeData={this.state.treeData}
              filterValue={this.state.filterValue}
              layersState={layersState}
            />
            {this.state.treeData.map((group, i) => (
              <LayerGroup
                key={i}
                group={group}
                localObserver={this.localObserver}
                layerMap={this.olLayerMap}
                app={this.props.app}
                globalObserver={this.globalObserver}
                options={this.props.options}
              />
            ))}
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
