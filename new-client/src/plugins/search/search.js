import React from "react";
import PropTypes from "prop-types";
import Observer from "react-event-observer";
import { withStyles } from "@material-ui/core/styles";

import SearchModel from "../../models/SearchModel";

import SpatialSearchMenu from "./components/startview/SpatialSearchMenu.js";
import SearchResultList from "./components/resultlist/SearchResultList.js";
import SearchWithRadiusInput from "./components/searchviews/SearchWithRadiusInput";
import SearchWithSelectionInput from "./components/searchviews/SearchWithSelectionInput";
import SearchWithPolygonInput from "./components/searchviews/SearchWithPolygonInput";

import {
  CircularProgress,
  IconButton,
  InputBase,
  Paper,
  Tooltip
} from "@material-ui/core";

import ClearIcon from "@material-ui/icons/Clear";
import SearchIcon from "@material-ui/icons/Search";

const styles = theme => {
  return {
    root: {
      display: "flex",
      alignItems: "center",
      border: "1px solid rgba(0, 0, 0, 0.12)",
      minWidth: 200,
      [theme.breakpoints.down("xs")]: {
        minWidth: 100,
        border: "none",
        boxShadow: "none"
      },
      [theme.breakpoints.up("sm")]: {
        maxWidth: 520
      }
    },
    flexItemContainerForSearch: {
      [theme.breakpoints.down("xs")]: {
        flexGrow: 1
      }
    },
    input: {
      marginLeft: theme.spacing(1),
      flex: 1
    },
    iconButton: {
      padding: 10
    }
  };
};

const POLYGON = "polygon";
const RADIUS = "radius";
const TEXTSEARCH = "textsearch";
const SELECTION = "selection";
const STARTVIEW = "startview";

class Search extends React.PureComponent {
  static propTypes = {
    app: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    map: PropTypes.object.isRequired,
    options: PropTypes.object.isRequired
  };

  // Define initial state
  state = {
    visible: true,
    loading: false,
    activeSearchView: STARTVIEW,
    searchboxPlaceholder: this.props.options.tooltip || "Sök i Hajk"
  };

  // Define some public class fields
  type = "Search"; // Special case - plugins that don't use BaseWindowPlugin must specify .type here

  tooltip = this.props.options.tooltip;

  // Used for setTimeout/clearTimeout, in order to delay auto-search when user is typing
  timer = null;
  delayBeforeAutoSearch =
    Number.isNaN(this.props.options.delayBeforeAutoSearch) === false
      ? this.props.options.delayBeforeAutoSearch
      : 500;

  activeSpatialTools = {
    radiusSearch: this.props.options.radiusSearch,
    selectionSearch: this.props.options.selectionSearch,
    polygonSearch: this.props.options.polygonSearch
  };

  localObserver = new Observer();
  searchModel = new SearchModel(
    this.props.options,
    this.props.map,
    this.props.app,
    this.localObserver
  );

  componentDidMount() {
    /**
     * When appLoaded is triggered, we want to look see if automatic
     * search has been requested. If query param contains values for v,
     * as well as s or t, it means that user wants to do a search on load.
     * In that case, AppModel has already given us a searchOnStart object.
     *
     * If searchOnStart exists, grab the value for v (the search value string),
     * put the value in search box and do the search.
     *
     * TODO: Limit WFS sources (if "s" query param is present, called "ds" below).
     */

    this.props.app.globalObserver.subscribe("core.appLoaded", () => {
      const { searchOnStart } = this.props.app.config.mapConfig.map;
      // Hence this plugin (src/plugins/search) is the default Search plugin, act on both t="search" and t=undefined
      if (
        searchOnStart?.t === undefined ||
        searchOnStart?.t.toLowerCase() === this.type.toLowerCase()
      ) {
        const { v, s } = searchOnStart;

        //eslint-disable-next-line
        const { dv, ds } = {
          dv: v && window.decodeURI(v),
          ds: s && window.decodeURI(s)
        };

        // Put decoded search phrase into the search box
        document.getElementById("searchbox").value = dv;

        // Invoke search for search phrase
        this.searchModel.search(dv, true, d => {
          this.resolve(d);
          this.selectFirstFeatureInResultsList();
        });
      }
    });

    this.localObserver.subscribe("searchStarted", () => {
      this.setState({
        loading: true,
        activeSearchView: TEXTSEARCH
      });
    });

    this.localObserver.subscribe("spatialSearchStarted", () => {
      this.setState({
        loading: true
      });
    });

    this.localObserver.subscribe("searchToolChanged", placeholderText => {
      this.setState({
        result: false,
        searchboxPlaceholder: placeholderText
          ? placeholderText
          : this.props.options.tooltip
      });
    });

    this.localObserver.subscribe("searchComplete", () => {
      this.setState({
        loading: false
      });
    });
  }
  /**
   * @summary Selects the first element in results list and zooms in into the feature in map.
   * @description This is a horrible example of how things SHOULD NOT BE DONE. I invoke click()
   * on a couple of elements I get by running querySelector(). This is bad because of so many
   * reasons… TODO: FIX FIX FIX.
   * @memberof Search
   */
  selectFirstFeatureInResultsList() {
    // I'm not proud of this solution, but here we go:
    // trigger "click()" on the first result, which results
    // in two things: 1) row is marked as "selected" in results list,
    // and 2) the feature is selected and zoomed in.

    // First, expand the first group in search result list
    document.querySelector(".MuiExpansionPanelSummary-content").click();
    // Next, click on the first element in the first group of results
    document
      .querySelector(
        ".MuiExpansionPanelDetails-root .MuiExpansionPanelSummary-content"
      )
      .click();
  }

  resolve = result => {
    this.setState({
      result
    });
  };

  renderSearchResultList(target) {
    const { result } = this.state;
    if (!result || this.state.activeSearchView === STARTVIEW) return null;
    return (
      <SearchResultList
        result={result}
        renderAffectButton={this.activeSpatialTools.radiusSearch}
        model={this.searchModel}
        target={target}
      />
    );
  }

  doSearch(v) {
    if (v.length < 1) return null;
    this.localObserver.publish("searchToolChanged");
    this.searchModel.search(v, true, d => {
      this.resolve(d);
    });
  }

  handleSearchBoxInputChange = e => {
    const v = e.target.value;
    if (v.length <= 3) {
      return;
    }
    if (this.delayBeforeAutoSearch > 0) {
      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        this.doSearch(v);
      }, this.delayBeforeAutoSearch);
    } else {
      this.doSearch(v);
    }
  };

  handleSearchBoxKeyPress = e => {
    e.key === "Enter" && this.doSearch(e.target.value);
  };

  renderSearchBox() {
    const { classes } = this.props;

    return (
      <div className={classes.flexItemContainerForSearch}>
        <Paper className={classes.root}>
          <InputBase
            autoFocus={true}
            className={classes.input}
            placeholder={this.state.searchboxPlaceholder}
            inputProps={{
              "aria-label": "search hajk maps",
              id: "searchbox"
            }}
            onChange={this.handleSearchBoxInputChange}
            onKeyPress={this.handleSearchBoxKeyPress}
          />
          <Tooltip
            title={
              this.state.activeSearchView === STARTVIEW
                ? this.state.searchboxPlaceholder
                : "Återställ sökruta"
            }
          >
            <IconButton
              className={classes.iconButton}
              aria-label="search"
              onClick={e => {
                if (this.state.activeSearchView === STARTVIEW) {
                  const v = document.getElementById("searchbox").value;
                  this.doSearch(v);
                } else {
                  this.resetToStartView();
                }
              }}
            >
              {this.state.activeSearchView === STARTVIEW && <SearchIcon />}
              {this.state.activeSearchView !== STARTVIEW &&
                (this.state.loading ? (
                  <CircularProgress size={20} />
                ) : (
                  <ClearIcon />
                ))}
            </IconButton>
          </Tooltip>
          <SpatialSearchMenu
            onToolChanged={toolType => {
              this.setState({
                activeSearchView: toolType
              });
            }}
            activeSpatialTools={this.activeSpatialTools}
          />
          {this.state.activeSearchView && this.renderSpatialBar()}
        </Paper>
        {this.renderSearchResultList("center")}
      </div>
    );
  }

  resetToStartView() {
    document.getElementById("searchbox").value = "";
    this.localObserver.publish("searchToolChanged");
    this.searchModel.abortSearches();
    this.searchModel.clearRecentSpatialSearch();
    this.setState({ activeSearchView: STARTVIEW });
  }

  renderSpatialBar() {
    switch (this.state.activeSearchView) {
      case POLYGON:
        return (
          <SearchWithPolygonInput
            model={this.searchModel}
            resetToStartView={() => {
              this.resetToStartView();
            }}
            localObserver={this.localObserver}
            onSearchDone={featureCollections => {
              this.resolve(featureCollections);
            }}
          />
        );
      case RADIUS: {
        return (
          <SearchWithRadiusInput
            localObserver={this.localObserver}
            resetToStartView={() => {
              this.resetToStartView();
            }}
            onSearchWithin={layerIds => {
              this.setState({
                result: layerIds
              });
              this.searchModel.clearRecentSpatialSearch();
            }}
            model={this.searchModel}
          />
        );
      }
      case SELECTION: {
        return (
          <SearchWithSelectionInput
            localObserver={this.localObserver}
            resetToStartView={() => {
              this.resetToStartView();
            }}
            model={this.searchModel}
            onSearchDone={featureCollections => {
              this.resolve(featureCollections);
            }}
          />
        );
      }

      default:
        return;
    }
  }

  /**
   * @summary Renders the search plugin.
   *
   * @returns React.Component
   * @memberof Search
   */
  render() {
    // If clean===true, some components won't be rendered below
    const clean = this.props.app.config.mapConfig.map.clean;

    return clean === false && this.renderSearchBox();
  }
}

export default withStyles(styles)(Search);
