// Generic imports â€“ all plugins need these
import React from "react";
import PropTypes from "prop-types";
import { Rnd } from "react-rnd";
import withStyles from "@mui/styles/withStyles";
import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Grid from "@mui/material/Grid";
import Toolbar from "@mui/material/Toolbar";
import PanelToolbox from "./PanelToolbox";
import TabPanel from "./TabPanel";
import ClearIcon from "@mui/icons-material/Clear";
import GeoJSON from "ol/format/GeoJSON";
import { Typography } from "@mui/material";

/**
 * @summary Base in the search result list
 * @description This component is the base in the search result list in vtsearch.
 * there is a one-to-one relation between a searchresult, searchResultLayer and a tab and the key is searchResultId
 * This means that for every new searchResult, we will create one new tab and one new searchresultlayer
 * @class SearchResultListContainer
 * @extends {React.PureComponent}
 */

const styles = (theme) => {
  return {
    window: {
      zIndex: theme.zIndex.appBar,
      background: theme.palette.common.white,
      boxShadow: theme.shadows[24],
      overflow: "hidden",
      pointerEvents: "all",
    },
    tabsRoot: {
      minHeight: 0,
    },
    tabRoot: {
      minHeight: 0,
      height: theme.spacing(4),
      padding: theme.spacing(0),
      marginLeft: theme.spacing(0.5),
      backgroundColor: theme.palette.primary.light,
    },
    toolbar: {
      minHeight: 0,
      backgroundColor: theme.palette.primary.dark,
    },
  };
};

const windowsContainer = document.getElementById("windows-container");

const getWindowContainerWidth = () => {
  return windowsContainer.getClientRects()[0].width;
};

const getWindowContainerHeight = () => {
  return windowsContainer.getClientRects()[0].height;
};

const initialResultListHeight = 520;

/**
 * @summary SearchResultListContainer is the core container for the GUI used for showing search results
 * @description GUI-component that wraps all the other GUI-components used to show search results in vtsearch
 * @class SearchResultListContainer
 * @extends {React.Component}
 */
class SearchResultListContainer extends React.Component {
  state = {
    resultListHeight: initialResultListHeight,
    windowWidth: getWindowContainerWidth(),
    windowHeight: getWindowContainerHeight(),
    value: 0,
    activeTabId: 0,
    searchResultIds: [],
    maximized: false,
    minimized: false,
  };

  searchResults = [];

  appbarHeight = null;

  static propTypes = {
    options: PropTypes.object.isRequired,
    model: PropTypes.object.isRequired,
  };

  static defaultProps = {
    options: {},
  };

  constructor(props) {
    super(props);

    window.addEventListener("resize", (e) => {
      this.setState({
        windowWidth: getWindowContainerWidth(),
        windowHeight: getWindowContainerHeight(),
      });
    });

    this.#init();
    this.#bindSubscriptions();
  }

  #resetHeightOfResultList = () => {
    const { localObserver } = this.props;
    localObserver.publish("vt-search-result-list-normal");
  };

  #setActiveTabId = (searchResultId) => {
    const { localObserver } = this.props;
    if (searchResultId !== this.state.activeTabId) {
      localObserver.publish("vt-clear-highlight");
    }

    localObserver.publish("vt-hide-all-layers");
    localObserver.publish("vt-toggle-visibility", searchResultId);
    localObserver.publish("vt-active-tab-change", this.state.activeTabId);

    this.setState({ activeTabId: searchResultId });
  };

  #onSearchDone = (result) => {
    const { localObserver } = this.props;
    this.#applyFilterFunction(result);
    var searchResultId = this.#addResultToSearchResultList(result);

    localObserver.publish("vt-add-search-result-to-map", {
      searchResultId: searchResultId,
      olFeatures: this.#getFeaturesFromResult(result),
    });
    this.#setActiveTabId(searchResultId);

    if (result.type === "journeys") {
      this.#resetHeightOfResultList();
    }
  };

  /**
   * Applies a filter function that adds filter parameters to a result if needed, i.e. showStopPoints in Lines.
   * @param {object} result The result from the search model in either core or vtsearch.
   *
   * @memberof SearchResultListContainer
   */
  #applyFilterFunction = (result) => {
    if (!this.filterFunctions[result.type]) return;
    this.filterFunctions[result.type](result, true);
  };

  /**
   * Gets all features from a search result. If the search result comes from the search module in the core,
   * the data is already converted. If the result comes from the vtsearch plugin, data must be converted.
   * @param {object} result The result from the core search module or the vtsearch search module.
   * @returns {array} Returns an array of features.
   *
   * @memberof SearchResultListContainer
   */
  #getFeaturesFromResult = (result) => {
    if (this.#isResultFromPluginvtsearch(result))
      return this.#convertToGeoJson(result?.featureCollection);

    return result?.value?.features;
  };

  /**
   * Determines if the result comes from the vtsearch plugin.
   * @param {object} result The result from the core search module or the vtsearch search module.
   * @returns {bool} Returns true if the result comes from the vtsearch plugin.
   */
  #isResultFromPluginvtsearch = (result) => {
    return result.featureCollection;
  };

  /**
   * Read all features and converts them into an array. Works with both a single feature and a feature collection.
   * @param {object} featureCollection A feature collection from GeoServer.
   * @returns {array} Returns an array of features.s
   */
  #convertToGeoJson = (featureCollection) => {
    return new GeoJSON().readFeatures(featureCollection);
  };

  #init = () => {
    this.filterFunctions = { routes: this.#routesFilterFunction };
  };

  #routesFilterFunction = (result, showStopPoints) => {
    result.filterParams = { showStopPoints: showStopPoints };
  };

  #bindSubscriptions = () => {
    const { localObserver, app } = this.props;

    app.globalObserver.subscribe("core.drawerToggled", () => {
      this.setState({
        windowWidth: getWindowContainerWidth(),
        windowHeight: getWindowContainerHeight(),
      });
    });

    app.globalObserver.subscribe("core.hideDrawer", () => {
      this.setState({
        windowWidth: getWindowContainerWidth(),
        windowHeight: getWindowContainerHeight(),
      });
    });

    localObserver.subscribe("vt-clicked", () => {
      this.#sendToBackSearchResultContainer();
    });

    localObserver.subscribe("vt-result-done", (result) => {
      this.#bringToFrontSearchResultContainer();
      this.setState({
        windowWidth: getWindowContainerWidth(),
        windowHeight: getWindowContainerHeight(),
      });
      this.#onSearchDone(result);
    });

    localObserver.subscribe("vt-attribute-table-row-clicked", (payload) => {
      localObserver.publish("vt-highlight-search-result-feature", payload);
    });

    localObserver.subscribe("vt-set-active-tab", (searchResultId) => {
      this.#handleTabChange(null, searchResultId);
    });

    localObserver.subscribe("vt-features-clicked-in-map", (features) => {
      this.#bringToFrontSearchResultContainer();
      localObserver.publish("vt-highlight-attribute-row", features[0].getId());
    });

    localObserver.subscribe("vt-search-result-list-minimized", () => {
      this.setState((state) => {
        return {
          minimized: true,
          maximized: false,
          resultListHeight: this.appbarHeight,
        };
      });
    });
    localObserver.subscribe("vt-search-result-list-maximized", () => {
      this.setState((state) => {
        return {
          minimized: false,
          maximized: true,
          resultListHeight: getWindowContainerHeight(),
        };
      });
    });

    localObserver.subscribe("vt-search-result-list-normal", () => {
      this.setState({
        minimized: false,
        maximized: false,
        resultListHeight: initialResultListHeight,
      });
    });

    localObserver.subscribe("vt-search-result-list-close", () => {
      localObserver.publish("vt-hide-all-layers");
      localObserver.publish("vt-close-all-Layer");
      localObserver.publish("vt-clear-highlight");
      localObserver.publish("vt-resize-map", 0);
      this.searchResults.length = 0;
      this.setState({
        minimized: false,
        maximized: false,
        resultListHeight: 300,
        searchResultIds: [],
      });
    });
    localObserver.subscribe("vt-export-search-result-clicked", () => {
      localObserver.publish(
        "vt-export-search-result-for-active-tab",
        this.state.activeTabId
      );
    });
  };

  #handleTabChange = (_event, newValue) => {
    const { localObserver } = this.props;
    if (newValue !== this.state.activeTabId) {
      localObserver.publish("vt-remove-highlight-attribute-row");
    }
    this.#setActiveTabId(newValue);
  };

  #getNextTabActive = (searchResultId) => {
    const { searchResultIds } = this.state;
    var index = searchResultIds.indexOf(searchResultId);
    if (searchResultIds[index + 1]) {
      return searchResultIds[index + 1];
    } else {
      return searchResultIds[index - 1] ? searchResultIds[index - 1] : 0;
    }
  };

  #onTabClose = (searchResultId) => {
    const { localObserver } = this.props;
    localObserver.publish("vt-hide-all-layers");
    localObserver.publish("vt-clear-highlight");
    const nextactiveTabId = this.#getNextTabActive(searchResultId);
    console.log(nextactiveTabId, "nextActiveTabId");
    this.setState({ activeTabId: nextactiveTabId });
    localObserver.publish("vt-toggle-visibility", nextactiveTabId);
    this.#removeSearchResult(searchResultId);
    localObserver.publish("vt-resize-map", 0);
  };

  #addResultToSearchResultList = (result) => {
    var newId = 0;

    if (this.state.searchResultIds.length > 0) {
      newId =
        this.state.searchResultIds[this.state.searchResultIds.length - 1] + 1;
    }

    this.searchResults.push({
      ...result,
      ...{ id: newId },
    });

    var searchResultIds = this.state.searchResultIds.concat(newId);
    this.setState({ searchResultIds: searchResultIds });
    return newId;
  };

  #removeSearchResult = (searchResultId) => {
    const { searchResultIds } = this.state;
    const { localObserver } = this.props;
    const newSearchResultIds = searchResultIds.filter(
      (result) => result !== searchResultId
    );
    return new Promise((resolve, reject) => {
      this.setState(
        () => {
          return {
            searchResultIds: newSearchResultIds,
          };
        },
        () => {
          this.searchResults = this.searchResults.filter((searchResult) => {
            return searchResult.id !== searchResultId;
          });
          localObserver.publish("vt-clear-search-result", searchResultId);
          resolve();
        }
      );
    });
  };

  #getSearchResults = () => {
    return this.state.searchResultIds.map((id) => {
      return this.searchResults.find((result) => result.id === id);
    });
  };

  #renderTabs = (searchResult) => {
    const { classes, toolConfig } = this.props;
    var searchResultId = searchResult.id;

    if (
      !searchResult?.label &&
      toolConfig.geoServer[searchResult.type]?.searchLabel
    )
      searchResult.label = toolConfig.geoServer[searchResult.type].searchLabel;

    return (
      <Tab
        classes={{ root: classes.tabRoot }}
        label={
          <Grid container>
            <Grid item xs={10}>
              <Typography variant="subtitle2">{searchResult.label}</Typography>
            </Grid>
            <Grid item xs={2}>
              <ClearIcon
                onClick={(e) => {
                  e.stopPropagation();
                  this.#onTabClose(searchResultId);
                }}
                fontSize="inherit"
              />
            </Grid>
          </Grid>
        }
        value={searchResultId}
        key={`simple-tabpanel-${searchResultId}`}
        aria-controls={`simple-tabpanel-${searchResultId}`}
      ></Tab>
    );
  };

  renderTabsController = (searchResults) => {
    const { classes, windowVisible } = this.props;
    return (
      <Tabs
        classes={{
          root: classes.tabsRoot,
        }}
        value={windowVisible ? this.state.activeTabId : false} // If the window is not visible,
        // we cannot send a proper value to the tabs-component. If we do, mui will throw an error.
        // false is OK though, apparently.
        onChange={this.handleTabChange}
        aria-label="search-result-tabs"
      >
        {searchResults.map((searchResult) => {
          return this.#renderTabs(searchResult);
        })}
      </Tabs>
    );
  };

  #renderTabsHeader = (searchResults) => {
    const { classes, localObserver } = this.props;
    return (
      <AppBar
        ref={(appbar) => {
          if (this.appbarHeight === null) {
            this.appbarHeight = appbar.offsetHeight;
          }
        }}
        position="static"
      >
        <Toolbar classes={{ regular: classes.toolbar }}>
          <Grid justifyContent="space-between" alignItems="center" container>
            <Grid style={{ paddingLeft: 10 }} item>
              {searchResults.length > 0 &&
                this.#renderTabsController(searchResults)}
            </Grid>

            <Grid style={{ paddingLeft: 0 }} item>
              <PanelToolbox localObserver={localObserver}></PanelToolbox>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
    );
  };

  #renderSearchResultAsTabContent = (searchResult) => {
    const { toolConfig, localObserver } = this.props;
    return (
      <TabPanel
        key={searchResult.id}
        toolConfig={toolConfig}
        activeTabId={this.state.activeTabId}
        tabId={searchResult.id}
        attributeTableContainerHeight={
          this.state.resultListHeight - this.appbarHeight
        }
        windowWidth={this.state.windowWidth}
        localObserver={localObserver}
        searchResult={searchResult}
      ></TabPanel>
    );
  };

  #handleMapResizeWhenRendering = () => {
    const { localObserver } = this.props;
    localObserver.publish("vt-resize-map", this.state.resultListHeight);
  };

  #bringToFrontSearchResultContainer = () => {
    this.setState({ zIndex: 1100 });
  };

  #sendToBackSearchResultContainer = () => {
    this.setState({ zIndex: 800 });
  };

  #onClickSearchResultContainer = () => {
    this.#bringToFrontSearchResultContainer();
  };

  #renderSearchResultContainer = () => {
    const { classes, windowContainerId } = this.props;
    let searchResults = this.#getSearchResults();
    this.#handleMapResizeWhenRendering();
    return (
      <Rnd
        style={{
          zIndex: this.state.zIndex,
        }}
        onClick={this.#onClickSearchResultContainer}
        className={classes.window}
        size={{
          width: this.state.windowWidth,
          height: this.state.maximized
            ? this.state.windowHeight
            : this.state.minimized
            ? this.appbarHeight
            : this.state.resultListHeight,
        }}
        position={{
          x: 0,
          y: this.state.maximized
            ? 0
            : this.state.minimized
            ? this.state.windowHeight - this.appbarHeight
            : this.state.windowHeight - this.state.resultListHeight,
        }}
        ref={(container) => {
          this.rnd = container;
        }}
        onResizeStop={(e, direction, ref, delta, position) => {
          var height = ref.style.height.substring(
            0,
            ref.style.height.length - 2
          );

          this.setState({
            resultListHeight: parseInt(height),
            maximized: false,
            minimized: false,
          });
        }}
        bounds={`#${windowContainerId}`}
        disableDragging
        enableResizing={{
          bottom: false,
          bottomLeft: false,
          bottomRight: false,
          left: false,
          right: false,
          top: true,
          topLeft: false,
          topRight: false,
        }}
      >
        <section>
          {this.#renderTabsHeader(searchResults)}
          {searchResults.map((searchResult) => {
            return this.#renderSearchResultAsTabContent(searchResult);
          })}
        </section>
      </Rnd>
    );
  };

  render() {
    return this.state.searchResultIds.length > 0
      ? this.#renderSearchResultContainer()
      : null;
  }
}

export default withStyles(styles)(SearchResultListContainer);
