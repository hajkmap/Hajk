// Generic imports â€“ all plugins need these
import React from "react";
import PropTypes from "prop-types";
import { Rnd } from "react-rnd";
import { withStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Grid from "@material-ui/core/Grid";
import Toolbar from "@material-ui/core/Toolbar";
import PanelToolbox from "./PanelToolbox";
import TabPanel from "./TabPanel";
import ClearIcon from "@material-ui/icons/Clear";
import GeoJSON from "ol/format/GeoJSON";
import { Typography } from "@material-ui/core";

/**
 * @summary Base in the search result list
 * @description This component is the base in the search result list in vtsearch.
 * there is a one-to-one relation between a searchresult, searchResultLayer and a tab and the key is searchResultId
 * This means that for every new searchResult, we will create one new tab and one new searchresultlayer
 * @class SearchResultListContainer
 * @extends {React.PureComponent}
 */

const styles = theme => {
  return {
    window: {
      zIndex: 100,
      background: "white",
      boxShadow:
        "2px 2px 2px rgba(0, 0, 0, 0.4), 0px 0px 4px rgba(0, 0, 0, 0.4)",
      borderRadius: "5px",
      overflow: "hidden",
      pointerEvents: "all"
    },
    customIcon: {
      flex: "0 auto",
      marginLeft: "2%"
    },
    flexItem: {
      flex: "auto"
    },
    typography: {
      flex: "auto",
      color: "white"
    },
    tabRoot: {
      padding: 0,
      minHeight: 0,
      textTransform: "none"
    },
    tabsRoot: {
      minHeight: 0
    },
    tabWrapper: {
      display: "flex",
      flexDirection: "row",
      borderRadius: "5px",
      backgroundColor: "rgba(0,150,237,1)"
    },
    tabsFlexContainer: {
      flexWrap: "wrap"
    },
    toolbar: {
      minHeight: 0,
      padding: 0
    }
  };
};

const windowsContainer = document.getElementById("windows-container");

const getWindowContainerWidth = () => {
  return windowsContainer.getClientRects()[0].width;
};

const getWindowContainerHeight = () => {
  return windowsContainer.getClientRects()[0].height;
};

/**
 * @summary SearchResultListContainer is the core container for the GUI used for showing search results
 * @description GUI-component that wraps all the other GUI-components used to show search results in vtsearch
 * @class SearchResultListContainer
 * @extends {React.Component}
 */
class SearchResultListContainer extends React.Component {
  state = {
    resultListHeight: 300,
    previousResultListHeight: 300,
    windowWidth: getWindowContainerWidth(),
    windowHeight: getWindowContainerHeight(),
    value: 0,
    activeTab: 0,
    searchResultIds: [],
    maximized: false,
    minimized: false
  };

  searchResults = [];

  appbarHeight = null;

  static propTypes = {
    options: PropTypes.object.isRequired,
    model: PropTypes.object.isRequired
  };

  static defaultProps = {
    options: {}
  };

  constructor(props) {
    super(props);

    window.addEventListener("resize", e => {
      this.setState({
        windowWidth: getWindowContainerWidth(),
        windowHeight: getWindowContainerHeight()
      });
    });

    this.bindSubscriptions();
  }

  onSearchDone = result => {
    const { localObserver } = this.props;
    var searchResultId = this.addResultToSearchResultList(result);
    localObserver.publish("add-search-result-to-map", {
      searchResultId: searchResultId,
      olFeatures: this.convertToGeoJson(result.featureCollection)
    });
  };

  convertToGeoJson = featureCollectionAsString => {
    return new GeoJSON().readFeatures(featureCollectionAsString);
  };

  bindSubscriptions = () => {
    const { localObserver, app } = this.props;

    app.globalObserver.subscribe("drawerToggled", () => {
      this.setState({
        windowWidth: getWindowContainerWidth(),
        windowHeight: getWindowContainerHeight()
      });
    });

    localObserver.subscribe("vtsearch-result-done", result => {
      this.onSearchDone(result);
    });

    localObserver.subscribe("attribute-table-row-clicked", payload => {
      localObserver.publish("highlight-search-result-feature", payload);
    });

    localObserver.subscribe("set-active-tab", searchResultId => {
      this.handleTabChange(null, searchResultId);
    });

    localObserver.subscribe("features-clicked-in-map", features => {
      localObserver.publish("highlight-attribute-row", features[0].getId());
    });

    localObserver.subscribe("search-result-list-minimized", () => {
      this.setState(state => {
        return {
          minimized: true,
          maximized: false,
          resultListHeight: getWindowContainerHeight(),
          previousResultListHeight:
            !state.minimized && !state.minimized
              ? this.state.resultListHeight
              : this.state.previousResultListHeight
        };
      });
    });
    localObserver.subscribe("search-result-list-maximized", () => {
      this.setState(state => {
        return {
          minimized: false,
          maximized: true,
          resultListHeight: getWindowContainerHeight(),
          previousResultListHeight:
            !state.minimized && !state.minimized
              ? this.state.resultListHeight
              : this.state.previousResultListHeight
        };
      });
    });

    localObserver.subscribe("search-result-list-normal", () => {
      this.setState({
        minimized: false,
        maximized: false,
        resultListHeight: this.state.previousResultListHeight
      });
    });

    localObserver.subscribe("search-result-list-close", () => {
      this.searchResults.length = 0;
      this.setState({
        minimized: false,
        maximized: false,
        resultListHeight: 300,
        searchResultIds: []
      });
    });
  };

  handleTabChange = (event, newValue) => {
    this.setState({ activeTab: newValue });
  };

  getNextTabActive = searchResultId => {
    const { searchResultIds } = this.state;
    var index = searchResultIds.indexOf(searchResultId);
    if (searchResultIds[index + 1]) {
      return searchResultIds[index + 1];
    } else {
      return searchResultIds[index - 1] ? searchResultIds[index - 1] : 0;
    }
  };

  onTabClose = searchResultId => {
    const nextActiveTab = this.getNextTabActive(searchResultId);
    this.removeSearchResult(searchResultId).then(() => {
      this.setState({ activeTab: nextActiveTab });
    });
  };

  addResultToSearchResultList = result => {
    var newId = 0;

    if (this.state.searchResultIds.length > 0) {
      newId =
        this.state.searchResultIds[this.state.searchResultIds.length - 1] + 1;
    }

    this.searchResults.push({
      ...result,
      ...{ id: newId }
    });

    var searchResultIds = this.state.searchResultIds.concat(newId);
    this.setState({ searchResultIds: searchResultIds });
    return newId;
  };

  removeSearchResult = searchResultId => {
    const { searchResultIds } = this.state;
    const { localObserver } = this.props;
    const newSearchResultIds = searchResultIds.filter(
      result => result !== searchResultId
    );
    return new Promise((resolve, reject) => {
      this.setState(
        () => {
          return {
            searchResultIds: newSearchResultIds
          };
        },
        () => {
          this.searchResults = this.searchResults.filter(searchResult => {
            return searchResult.id !== searchResultId;
          });
          localObserver.publish("clear-search-result", searchResultId);
          resolve();
        }
      );
    });
  };

  getSearchResults = () => {
    return this.state.searchResultIds.map(id => {
      return this.searchResults.find(result => result.id === id);
    });
  };

  renderTabs = searchResult => {
    const { classes } = this.props;
    var searchResultId = searchResult.id;
    return (
      <Tab
        classes={{ root: classes.tabRoot, wrapper: classes.tabWrapper }}
        label={
          <>
            <Typography variant="subtitle2" className={classes.typography}>
              {searchResult.label}
            </Typography>

            <ClearIcon
              onClick={e => {
                e.stopPropagation();
                this.onTabClose(searchResultId);
              }}
              className={classes.customIcon}
              fontSize="inherit"
            />
          </>
        }
        value={searchResultId}
        key={`simple-tabpanel-${searchResultId}`}
        aria-controls={`simple-tabpanel-${searchResultId}`}
      ></Tab>
    );
  };

  renderTabsController = searchResults => {
    const { classes } = this.props;
    return (
      <Tabs
        classes={{
          root: classes.tabsRoot,
          flexContainer: classes.tabsFlexContainer
        }}
        value={this.state.activeTab}
        onChange={this.handleTabChange}
        aria-label="search-result-tabs"
      >
        {searchResults.map(searchResult => {
          return this.renderTabs(searchResult);
        })}
      </Tabs>
    );
  };

  renderTabsHeader = searchResults => {
    const { classes, localObserver } = this.props;
    return (
      <AppBar
        ref={appbar => {
          if (this.appbarHeight === null) {
            this.appbarHeight = appbar.offsetHeight;
          }
        }}
        position="static"
      >
        <Toolbar classes={{ regular: classes.toolbar }}>
          <Grid justify="space-between" alignItems="center" container>
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

  renderSearchResultAsTabContent = searchResult => {
    const { toolConfig, localObserver } = this.props;
    return (
      <TabPanel
        key={searchResult.id}
        toolConfig={toolConfig}
        activeTabId={this.state.activeTab}
        tabId={searchResult.id}
        resultListHeight={this.state.resultListHeight}
        windowWidth={this.state.windowWidth}
        localObserver={localObserver}
        searchResult={searchResult}
      ></TabPanel>
    );
  };

  handleMapSizeWhenAddingSearchResultList = () => {
    const { localObserver } = this.props;
    localObserver.publish("resize-map", this.state.resultListHeight);
  };

  renderSearchResultContainer = () => {
    const { classes, windowContainerId } = this.props;
    let searchResults = this.getSearchResults();
    this.handleMapSizeWhenAddingSearchResultList();

    return (
      <Rnd
        className={classes.window}
        size={{
          width: this.state.windowWidth,
          height: this.state.maximized
            ? this.state.windowHeight
            : this.state.minimized
            ? this.appbarHeight
            : this.state.resultListHeight
        }}
        position={{
          x: 0,
          y: this.state.maximized
            ? 0
            : this.state.minimized
            ? this.state.windowHeight - this.appbarHeight
            : this.state.windowHeight - this.state.resultListHeight
        }}
        ref={container => {
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
            previousResultListHeight: parseInt(height)
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
          topRight: false
        }}
      >
        {this.renderTabsHeader(searchResults)}
        {searchResults.map(searchResult => {
          return this.renderSearchResultAsTabContent(searchResult);
        })}
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
