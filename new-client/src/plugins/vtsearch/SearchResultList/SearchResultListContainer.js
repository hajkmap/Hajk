// Generic imports – all plugins need these
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
      marginLeft: "30%"
    },
    tabWrapper: {
      display: "inline-block"
    },
    toolbar: {
      minHeight: 0
    },
    appbar: {
      height: 30
    }
  };
};

const getWindowContainerWidth = () => {
  return document.getElementById("windows-container").getClientRects()[0].width;
};

const getWindowContainerHeight = () => {
  return document.getElementById("windows-container").getClientRects()[0]
    .height;
};

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

  handleSearchResult = result => {
    const { localObserver } = this.props;
    var searchResultId = this.addSearchResult(result);
    localObserver.publish("add-search-result", {
      searchResultId: searchResultId,
      olFeatures: this.convertResultToOlFeatures(result)
    });
  };

  convertResultToOlFeatures = result => {
    return new GeoJSON().readFeatures(result.featureCollection);
  };

  removeSearchResult = () => {};

  addSearchResult = result => {
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

  bindSubscriptions = () => {
    const { localObserver } = this.props;

    localObserver.subscribe("vtsearch-result-done", result => {
      this.handleSearchResult(result);
    });

    localObserver.subscribe("attribute-table-row-clicked", payload => {
      localObserver.publish("highlight-search-result-feature", payload);
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

  getSearchResults = () => {
    return this.state.searchResultIds.map(id => {
      return this.searchResults.find(result => result.id === id);
    });
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

  removeResult = searchResultId => {
    const nextActiveTab = this.getNextTabActive(searchResultId);
    this.removeSearchResult(searchResultId).then(() => {
      this.setState({ activeTab: nextActiveTab });
    });
  };

  renderTabs = searchResult => {
    const { classes } = this.props;
    var searchResultId = searchResult.id;
    return (
      <Tab
        classes={{ wrapper: classes.tabWrapper }}
        label={
          <>
            {searchResult.label}

            <ClearIcon
              onClick={e => {
                e.stopPropagation();
                this.removeResult(searchResultId);
              }}
              className={classes.customIcon}
              fontSize="inherit"
            />
          </>
        }
        value={searchResultId}
        key={`simple-tabpanel-${searchResultId}`}
        id={`simple-tabpanel-${searchResultId}`}
        aria-controls={`simple-tabpanel-${searchResultId}`}
      ></Tab>
    );
  };

  renderTabsSection = searchResults => {
    console.log(this.state.activeTab, "activeTab");
    return (
      <Tabs
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

  renderSearchResultContainer = () => {
    const { classes, windowContainerId, localObserver } = this.props;
    let searchResults = this.getSearchResults();

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
        <AppBar
          ref={appbar => {
            if (this.appbarHeight === null) {
              this.appbarHeight = appbar.offsetHeight;
            }
          }}
          classes={{ positionStatic: classes.appbar }}
          position="static"
        >
          <Toolbar classes={{ regular: classes.toolbar }}>
            <Grid
              justify="space-between"
              alignItems="center"
              container
              spacing={10}
            >
              <Grid item>
                {searchResults.length > 0 &&
                  this.renderTabsSection(searchResults)}
              </Grid>

              <Grid item>
                <PanelToolbox localObserver={localObserver}></PanelToolbox>
              </Grid>
            </Grid>
          </Toolbar>
        </AppBar>
        {searchResults.map(searchResult => {
          return (
            <TabPanel
              key={searchResult.id}
              value={this.state.activeTab}
              index={searchResult.id}
              resultListHeight={this.state.resultListHeight}
              windowWidth={this.state.windowWidth}
              localObserver={localObserver}
              searchResult={searchResult}
            ></TabPanel>
          );
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
