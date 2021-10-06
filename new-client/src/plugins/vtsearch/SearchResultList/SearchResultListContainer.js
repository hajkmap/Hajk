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

    this.bindSubscriptions();
  }
  resetHeightOfResultList = () => {
    const { localObserver } = this.props;
    localObserver.publish("search-result-list-normal");
  };

  setActiveTabId = (searchResultId) => {
    const { localObserver } = this.props;
    if (searchResultId !== this.state.activeTabId) {
      localObserver.publish("clear-highlight");
    }

    localObserver.publish("hide-all-layers");
    localObserver.publish("toggle-visibility", searchResultId);

    this.setState({ activeTabId: searchResultId });
  };

  onSearchDone = (result) => {
    const { localObserver } = this.props;
    var searchResultId = this.addResultToSearchResultList(result);
    localObserver.publish("add-search-result-to-map", {
      searchResultId: searchResultId,
      olFeatures: this.convertToGeoJson(
        result?.featureCollection || result?.value
      ),
    });
    this.setActiveTabId(searchResultId);

    if (result.type === "journeys") {
      this.resetHeightOfResultList();
    }
  };

  convertToGeoJson = (featureCollectionAsString) => {
    return new GeoJSON().readFeatures(featureCollectionAsString);
  };

  bindSubscriptions = () => {
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

    localObserver.subscribe("vtsearch-clicked", () => {
      this.sendToBackSearchResultContainer();
    });

    localObserver.subscribe("vtsearch-result-done", (result) => {
      this.bringToFrontSearchResultContainer();
      this.setState({
        windowWidth: getWindowContainerWidth(),
        windowHeight: getWindowContainerHeight(),
      });
      this.onSearchDone(result);
    });

    localObserver.subscribe("attribute-table-row-clicked", (payload) => {
      localObserver.publish("highlight-search-result-feature", payload);
    });

    localObserver.subscribe("set-active-tab", (searchResultId) => {
      this.handleTabChange(null, searchResultId);
    });

    localObserver.subscribe("features-clicked-in-map", (features) => {
      this.bringToFrontSearchResultContainer();
      localObserver.publish("highlight-attribute-row", features[0].getId());
    });

    localObserver.subscribe("search-result-list-minimized", () => {
      this.setState((state) => {
        return {
          minimized: true,
          maximized: false,
          resultListHeight: this.appbarHeight,
        };
      });
    });
    localObserver.subscribe("search-result-list-maximized", () => {
      this.setState((state) => {
        return {
          minimized: false,
          maximized: true,
          resultListHeight: getWindowContainerHeight(),
        };
      });
    });

    localObserver.subscribe("search-result-list-normal", () => {
      this.setState({
        minimized: false,
        maximized: false,
        resultListHeight: initialResultListHeight,
      });
    });

    localObserver.subscribe("search-result-list-close", () => {
      localObserver.publish("hide-all-layers");
      localObserver.publish("close-all-vt-searchLayer");
      localObserver.publish("clear-highlight");
      localObserver.publish("resize-map", 0);
      this.searchResults.length = 0;
      this.setState({
        minimized: false,
        maximized: false,
        resultListHeight: 300,
        searchResultIds: [],
      });
    });
  };

  handleTabChange = (event, newValue) => {
    const { localObserver } = this.props;
    if (newValue !== this.state.activeTabId) {
      localObserver.publish("remove-highlight-attribute-row");
    }
    this.setActiveTabId(newValue);
  };

  getNextTabActive = (searchResultId) => {
    const { searchResultIds } = this.state;
    var index = searchResultIds.indexOf(searchResultId);
    if (searchResultIds[index + 1]) {
      return searchResultIds[index + 1];
    } else {
      return searchResultIds[index - 1] ? searchResultIds[index - 1] : 0;
    }
  };

  onTabClose = (searchResultId) => {
    const { localObserver } = this.props;
    localObserver.publish("hide-all-layers");
    localObserver.publish("clear-highlight");
    const nextactiveTabId = this.getNextTabActive(searchResultId);
    console.log(nextactiveTabId, "nextActiveTabId");
    this.setState({ activeTabId: nextactiveTabId });
    localObserver.publish("toggle-visibility", nextactiveTabId);
    this.removeSearchResult(searchResultId);
    localObserver.publish("resize-map", 0);
  };

  addResultToSearchResultList = (result) => {
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

  removeSearchResult = (searchResultId) => {
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
          localObserver.publish("clear-search-result", searchResultId);
          resolve();
        }
      );
    });
  };

  getSearchResults = () => {
    return this.state.searchResultIds.map((id) => {
      return this.searchResults.find((result) => result.id === id);
    });
  };

  renderTabs = (searchResult) => {
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
                  this.onTabClose(searchResultId);
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
          return this.renderTabs(searchResult);
        })}
      </Tabs>
    );
  };

  renderTabsHeader = (searchResults) => {
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
                this.renderTabsController(searchResults)}
            </Grid>

            <Grid style={{ paddingLeft: 0 }} item>
              <PanelToolbox localObserver={localObserver}></PanelToolbox>
            </Grid>
          </Grid>
        </Toolbar>
      </AppBar>
    );
  };

  renderSearchResultAsTabContent = (searchResult) => {
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

  handleMapResizeWhenRendering = () => {
    const { localObserver } = this.props;
    localObserver.publish("resize-map", this.state.resultListHeight);
  };

  bringToFrontSearchResultContainer = () => {
    this.setState({ zIndex: 1100 });
  };

  sendToBackSearchResultContainer = () => {
    this.setState({ zIndex: 800 });
  };

  onClickSearchResultContainer = () => {
    this.bringToFrontSearchResultContainer();
  };

  renderSearchResultContainer = () => {
    const { classes, windowContainerId } = this.props;
    let searchResults = this.getSearchResults();
    this.handleMapResizeWhenRendering();
    return (
      <Rnd
        style={{
          zIndex: this.state.zIndex,
        }}
        onClick={this.onClickSearchResultContainer}
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
          {this.renderTabsHeader(searchResults)}
          {searchResults.map((searchResult) => {
            return this.renderSearchResultAsTabContent(searchResult);
          })}
        </section>
      </Rnd>
    );
  };

  render() {
    return this.state.searchResultIds.length > 0
      ? this.renderSearchResultContainer()
      : null;
  }
}

export default withStyles(styles)(SearchResultListContainer);
