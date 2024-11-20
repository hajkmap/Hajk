import React, { createRef } from "react";
import { createPortal } from "react-dom";
import propTypes from "prop-types";

import { styled } from "@mui/material/styles";
import { withSnackbar } from "notistack";
import {
  AppBar,
  Tab,
  Tabs,
  Box,
  IconButton,
  InputAdornment,
  ListItemText,
  TextField,
  Tooltip,
} from "@mui/material";

import BackgroundSwitcher from "./components/BackgroundSwitcher.js";
import LayerGroup from "./components/LayerGroup.js";
import BreadCrumbs from "./components/BreadCrumbs.js";
import DrawOrder from "./components/DrawOrder.js";
import LayerPackage from "./components/LayerPackage";
import LayerGroupAccordion from "./components/LayerGroupAccordion.js";
import ConfirmationDialog from "../../components/ConfirmationDialog.js";
import QuickAccessLayers from "./components/QuickAccessLayers.js";
import QuickAccessOptions from "./components/QuickAccessOptions.js";
import LayerItemDetails from "./components/LayerItemDetails.js";
import Favorites from "./components/Favorites/Favorites.js";
import { debounce } from "utils/debounce";

import StarOutlineOutlinedIcon from "@mui/icons-material/StarOutlineOutlined";
import TopicOutlinedIcon from "@mui/icons-material/TopicOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";

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
const BreadCrumbsContainer = ({ map, model, app }) => {
  return createPortal(
    // We must wrap the component in a div, on which we can catch
    // events. This is done to prevent event bubbling to the
    // layerSwitcher component.
    <div onMouseDown={(e) => e.stopPropagation()}>
      <BreadCrumbs map={map} model={model} app={app} />
    </div>,
    document.getElementById("breadcrumbs-container")
  );
};

class LayersSwitcherView extends React.PureComponent {
  static propTypes = {
    app: propTypes.object.isRequired,
    map: propTypes.object.isRequired,
    model: propTypes.object.isRequired,
    observer: propTypes.object.isRequired,
    options: propTypes.object.isRequired,
    enqueueSnackbar: propTypes.func.isRequired,
  };

  constructor(props) {
    super(props);
    this.options = props.options;
    this.layerTree = this.addLayerNames(this.options.groups);
    // Create a ref to store a reference to the search layer input element
    this.inputRef = createRef();
    this.state = {
      chapters: [],
      baseLayers: props.model.getBaseLayers(),
      activeTab: 0,
      activeLayersCount: 0,
      displayContentOverlay: null, // 'layerPackage' | 'favorites' | 'layerItemDetails'
      layerItemDetails: null,
      quickAccessSectionExpanded: false,
      filterValue: "",
      treeData: this.layerTree,
      showDeleteConfirmation: false,
      scrollPositions: {
        tab0: 0,
        tab1: 0,
        tab2: 0,
      },
    };

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

    // this.globalHideLayerSubscription = props.app.globalObserver.subscribe(
    //   "layerswitcher.hideLayer",
    //   (la) => console.log("LSV: globalHideLayer", la.get("caption"))
    // );

    // this.globalShowLayerSubscription = props.app.globalObserver.subscribe(
    //   "layerswitcher.showLayer",
    //   (la) => console.log("LSV: globalShowLayer", la.get("caption"))
    // );
    // TODO This is a work around for showing/hideing group layers which are
    // collapsed. It's also the GroupLayer component that listens for this.
    // That should be refactored.
    // TODO Unsubscribe
    this.localHideLayerSubscription = props.observer.subscribe(
      "hideLayer",
      (la) => {
        la.setVisible(false);
      }
    );
    this.localShowLayerSubscription = props.observer.subscribe(
      "showLayer",
      (la) => {
        la.setVisible(true);
      }
    );
  }

  // Prepare tree data for filtering
  addLayerNames = (data) => {
    data.forEach((item) => {
      item.isFiltered = true;
      item.isExpanded = false;
      item.changeIndicator = new Date();
      if (item.layers) {
        item.layers.forEach((layer) => {
          const mapLayer = this.props.model.layerMap[layer.id];
          if (!mapLayer) {
            console.warn(`Maplayer with id ${layer.id} not found`);
            return;
          }
          layer.name = mapLayer.get("caption");
          layer.isFiltered = true;
          item.changeIndicator = new Date();
          // Check if layer is a group
          if (mapLayer.get("layerType") === "group") {
            layer.subLayers = [];
            const subLayers = mapLayer.get("subLayers");
            subLayers.forEach((subLayer) => {
              const subLayerMapLayer = mapLayer.layersInfo[subLayer].caption;
              layer.subLayers.push({
                id: subLayer,
                name: subLayerMapLayer,
                isFiltered: true,
                changeIndicator: new Date(),
              });
            });
          }
        });
      }

      if (item.groups) {
        // Call recursevly for subgroups
        this.addLayerNames(item.groups);
      }
    });
    return data;
  };

  // Handles click on Layerpackage button and backbutton
  handleLayerPackageToggle = (layerPackageState) => {
    layerPackageState?.event?.stopPropagation();
    // Set scroll position state when layer package is opened
    const currentScrollPosition = this.getScrollPosition();
    this.setState((prevState) => ({
      displayContentOverlay:
        this.state.displayContentOverlay === "layerPackage"
          ? null
          : "layerPackage",
      scrollPositions: {
        ...prevState.scrollPositions,
        [`tab${prevState.activeTab}`]: currentScrollPosition,
      },
    }));
    if (layerPackageState?.setQuickAccessSectionExpanded) {
      this.setState({
        quickAccessSectionExpanded: true,
      });
    }
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
  handleFavoritesViewToggle = (layerPackageState) => {
    layerPackageState?.event?.stopPropagation();
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
    if (layerPackageState?.setQuickAccessSectionExpanded) {
      this.setState({
        quickAccessSectionExpanded: true,
      });
    }
  };

  // Handles click on AddLayersToQuickAccess menu item
  handleAddLayersToQuickAccess = (e) => {
    e.stopPropagation();
    // Add visible layers to quickAccess section
    this.props.map
      .getAllLayers()
      .filter(
        (l) =>
          l.get("visible") === true &&
          l.get("layerType") !== "base" &&
          l.get("layerType") !== "system"
      )
      .map((l) => l.set("quickAccess", true));
    // Force update
    this.forceUpdate();
    // Show snackbar
    this.props.enqueueSnackbar(
      `Tända lager har nu lagts till i snabbåtkomst.`,
      {
        variant: "success",
        anchorOrigin: { vertical: "bottom", horizontal: "center" },
      }
    );
    // Expand quickAccess section
    this.setState({
      quickAccessSectionExpanded: true,
    });
  };

  // Handles click on clear quickAccess menu item
  handleShowDeleteConfirmation = (e) => {
    e.stopPropagation();
    this.setState({ showDeleteConfirmation: true });
  };

  // Handles click on confirm clear quickAccess button
  handleClearQuickAccessLayers = () => {
    this.setState({ showDeleteConfirmation: false });
    this.props.map
      .getAllLayers()
      .filter((l) => l.get("quickAccess") === true)
      .map((l) => l.set("quickAccess", false));
  };

  // Checks if quickAccess section has visible layers
  hasVisibleLayers = () => {
    return (
      this.props.map
        .getAllLayers()
        .filter(
          (l) => l.get("quickAccess") === true && l.get("visible") === true
        ).length > 0
    );
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
  }, 200);

  // Reset input value
  resetInput = () => {
    // Access the input element using the ref and set its value to an empty string
    if (this.inputRef.current) {
      this.inputRef.current.value = "";
      this.handleFilterValueChange("");
    }
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
  componentDidUpdate(prevProps, prevState) {
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
            shouldRender === true && this.state.displayContentOverlay === null
              ? "block"
              : "none",
        }}
      >
        {this.props.options.showFilter && (
          <Box
            sx={{
              p: 1,
              backgroundColor: (theme) =>
                theme.palette.mode === "dark"
                  ? "#373737"
                  : theme.palette.grey[100],
              borderBottom: (theme) =>
                `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
            }}
          >
            <Box
              sx={{
                width: 500,
                maxWidth: "100%",
                p: 1,
              }}
            >
              <TextField
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      {this.state.filterValue && (
                        <IconButton
                          onClick={() => this.resetInput()}
                          size="small"
                        >
                          <ClearIcon />
                        </IconButton>
                      )}
                    </InputAdornment>
                  ),
                }}
                size="small"
                onChange={(event) =>
                  this.handleFilterValueChange(event.target.value)
                }
                fullWidth
                placeholder="Sök lager och grupper"
                inputRef={this.inputRef}
                variant="outlined"
                sx={{
                  background: (theme) =>
                    theme.palette.mode === "dark" ? "inherit" : "#fff",
                }}
              />
            </Box>
          </Box>
        )}
        {this.props.options.showQuickAccess && (
          <Box
            sx={{
              borderBottom: (theme) =>
                `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
            }}
          >
            <LayerGroupAccordion
              display={"block"}
              expanded={this.state.quickAccessSectionExpanded}
              setExpandedCallback={(value) => {
                this.setState({ quickAccessSectionExpanded: value });
              }}
              layerGroupTitle={
                <ListItemText
                  primaryTypographyProps={{
                    fontWeight: this.hasVisibleLayers() ? "bold" : "inherit",
                  }}
                  primary="Snabbåtkomst"
                />
              }
              quickAccess={
                <IconButton sx={{ pl: 0 }} disableRipple size="small">
                  <StarOutlineOutlinedIcon />
                </IconButton>
              }
              layerGroupDetails={
                <>
                  {this.props.options.enableQuickAccessTopics ? (
                    <Tooltip title="Teman">
                      <IconButton
                        onClick={(e) =>
                          this.handleLayerPackageToggle({ event: e })
                        }
                      >
                        <TopicOutlinedIcon fontSize="small"></TopicOutlinedIcon>
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <div style={{ display: "none" }}>
                      <IconButton>
                        <TopicOutlinedIcon fontSize="small"></TopicOutlinedIcon>
                      </IconButton>
                    </div>
                  )}
                  {this.props.options.enableUserQuickAccessFavorites && (
                    <Favorites
                      favoriteViewDisplay={
                        this.state.displayContentOverlay === "favorites"
                      }
                      app={this.props.app}
                      map={this.props.map}
                      handleFavoritesViewToggle={this.handleFavoritesViewToggle}
                      globalObserver={this.props.model.globalObserver}
                      favoritesInfoText={
                        this.options.userQuickAccessFavoritesInfoText
                      }
                      handleQuickAccessSectionExpanded={() =>
                        this.setState({ quickAccessSectionExpanded: true })
                      }
                    ></Favorites>
                  )}
                  <QuickAccessOptions
                    handleAddLayersToQuickAccess={
                      this.handleAddLayersToQuickAccess
                    }
                    handleClearQuickAccessLayers={
                      this.handleShowDeleteConfirmation
                    }
                  ></QuickAccessOptions>
                </>
              }
              children={
                <QuickAccessLayers
                  treeData={this.state.treeData}
                  filterValue={this.state.filterValue}
                  model={this.props.model}
                  map={this.props.map}
                  app={this.props.app}
                ></QuickAccessLayers>
              }
            ></LayerGroupAccordion>
          </Box>
        )}
        {this.state.treeData.map((group, i) => {
          return (
            <LayerGroup
              filterChangeIndicator={group.changeIndicator}
              key={i}
              group={group}
              model={this.props.model}
              app={this.props.app}
              options={this.props.options}
            />
          );
        })}
      </Box>
    );
  };

  render() {
    const { windowVisible } = this.props;
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
        <div
          id="scroll-container"
          style={{ position: "relative", height: "100%", overflowY: "auto" }}
        >
          {this.renderLayerGroups(this.state.activeTab === 0)}
          {this.props.options.enableQuickAccessTopics && (
            <LayerPackage
              quickLayerPresets={this.options.quickLayersPresets}
              display={this.state.displayContentOverlay === "layerPackage"}
              backButtonCallback={this.handleLayerPackageToggle}
              map={this.props.map}
              globalObserver={this.props.model.globalObserver}
              layerPackageInfoText={this.options.quickAccessTopicsInfoText}
            ></LayerPackage>
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
            layers={this.state.baseLayers}
            layerMap={this.props.model.layerMap}
            backgroundSwitcherBlack={this.options.backgroundSwitcherBlack}
            backgroundSwitcherWhite={this.options.backgroundSwitcherWhite}
            enableOSM={this.options.enableOSM}
            map={this.props.map}
            app={this.props.app}
          />
          {this.options.showDrawOrderView === true && (
            <DrawOrder
              model={this.props.model}
              display={
                this.state.activeTab === 2 &&
                this.state.displayContentOverlay === null
              }
              map={this.props.map}
              app={this.props.app}
              options={this.props.options}
              onLayerChange={this.handleLayerChange}
            ></DrawOrder>
          )}
          {this.options.showBreadcrumbs && (
            <BreadCrumbsContainer
              map={this.props.map}
              model={this.props.model}
              app={this.props.app}
            />
          )}
          <ConfirmationDialog
            open={this.state.showDeleteConfirmation === true}
            titleName={"Rensa allt"}
            contentDescription={
              "Alla lager i snabbåtkomst kommer nu att tas bort."
            }
            cancel={"Avbryt"}
            confirm={"Rensa"}
            handleConfirm={this.handleClearQuickAccessLayers}
            handleAbort={() => {
              this.setState({ showDeleteConfirmation: false });
            }}
          />
        </div>
      </div>
    );
  }
}

export default withSnackbar(LayersSwitcherView);
