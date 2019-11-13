import React from "react";
// import LinearProgress from "@material-ui/core/LinearProgress";
import { withStyles } from "@material-ui/core/styles";
import Observer from "react-event-observer";
// import SearchWithTextInput from "./components/searchviews/SearchWithTextInput";
import SpatialSearchMenu from "./components/startview/SpatialSearchMenu.js";
import SearchResultList from "./components/resultlist/SearchResultList.js";
// import SearchBarStart from "./components/startview/SearchBarStart";
// import SearchSettingsButton from "./components/shared/SearchSettingsButton";
import SearchWithRadiusInput from "./components/searchviews/SearchWithRadiusInput";
import SearchWithSelectionInput from "./components/searchviews/SearchWithSelectionInput";
import SearchWithPolygonInput from "./components/searchviews/SearchWithPolygonInput";
import SearchModel from "./SearchModel.js";
// import PanelHeader from "./../../components/PanelHeader.js";
// import { isMobile } from "../../utils/IsMobile.js";

import { Tooltip } from "@material-ui/core";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";

import { CircularProgress, InputBase, Paper } from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import ClearIcon from "@material-ui/icons/Clear";

const styles = theme => {
  return {
    center: {
      background: "white",
      borderRadius: "10px",
      margin: "0px 10px 10px 10px",
      // TODO - Component card should be used instead
      boxShadow:
        "0px 1px 3px 0px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 2px 1px -1px rgba(0, 0, 0, 0)",
      minWidth: "360px",
      pointerEvents: "all",
      [theme.breakpoints.up("sm")]: {
        maxWidth: "200px"
      },
      [theme.breakpoints.down("xs")]: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: "0 !important",
        border: "none",
        margin: 0,
        padding: 0,
        borderRadius: 0,
        boxShadow: "none"
      }
    },
    button: {
      margin: "4px"
    },
    panelHeader: {
      [theme.breakpoints.up("sm")]: {
        display: "none"
      }
    },
    panelBody: {
      padding: "8px",
      [theme.breakpoints.down("xs")]: {
        padding: "10px",
        overflowY: "auto !important",
        position: "absolute",
        bottom: 0,
        top: "46px",
        left: 0,
        right: 0
      }
    },

    searchContainer: {
      [theme.breakpoints.up("xs")]: {
        display: "flex",
        flex: "auto",
        alignItems: "center",
        backgroundColor: "#eee",
        borderRadius: theme.shape.borderRadius
      }
    },
    mainContainerButton: {
      display: "flex"
    },
    searchToolsContainer: {
      minHeight: "48px",
      display: "flex"
    },
    searchContainerTop: {
      display: "block",
      width: "330px",
      marginRight: "5px",
      [theme.breakpoints.down("sm")]: {
        display: "none",
        padding: "10px",
        position: "fixed",
        width: "calc(100vw - 20px)",
        left: 0,
        right: 0,
        top: 0,
        background: "white",
        bottom: 0,
        zIndex: 1,
        overflow: "auto"
      }
    },
    loader: {
      height: "4px",
      marginTop: "-5px",
      marginBottom: "4px",
      borderRadius: "4px",
      overflow: "hidden"
    },
    // searchResults: {
    //   overflow: "visible",
    //   height: 0,
    //   [theme.breakpoints.down("xs")]: {
    //     height: "inherit"
    //   }
    // },
    iconButtonHeader: {
      color: "black",
      padding: "3px",
      overflow: "visible",
      cursor: "pointer",
      [theme.breakpoints.up("md")]: {
        display: "none"
      }
    },
    // iconButton: {
    //   color: "black",
    //   padding: "3px",
    //   overflow: "visible",
    //   cursor: "pointer",
    //   display: "none"
    // },
    backIcon: {
      [theme.breakpoints.up("md")]: {
        display: "none"
      }
    },
    // New styles
    root: {
      padding: "2px 4px",
      display: "flex",
      alignItems: "center",
      minWidth: 200,
      [theme.breakpoints.up("sm")]: {
        maxWidth: 520
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
  resolve = data => {
    this.setState({
      result: data
    });
  };

  constructor(props) {
    super(props);
    this.type = "Search"; // Special case - plugins that don't use BaseWindowPlugin must specify .type here
    this.localObserver = Observer();
    this.searchModel = new SearchModel(
      props.options,
      props.map,
      props.app,
      this.localObserver
    );
    this.state = {
      visible: true,
      loading: false,
      activeSearchView: STARTVIEW,
      searchboxPlaceholder: "Sök i Hajk"
    };

    this.activeSpatialTools = {
      radiusSearch: this.props.options.radiusSearch,
      selectionSearch: this.props.options.selectionSearch,
      polygonSearch: this.props.options.polygonSearch
    };

    this.tooltip = props.options.tooltip;
    this.searchWithinButtonText = props.options.searchWithinButtonText;
    this.searchWithPolygonButtonText =
      props.options.searchWithPolygonButtonText;
    this.searchWithSelectionButtonText =
      props.options.searchWithSelectionButtonText;
    this.searchSettings = props.options.searchSettings;
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
    this.localObserver.subscribe("toolchanged", placeholderText => {
      this.setState({
        result: false,
        searchboxPlaceholder: placeholderText ? placeholderText : "Sök i Hajk"
      });
    });
    this.localObserver.subscribe("searchComplete", () => {
      this.setState({
        loading: false
      });
    });

    this.localObserver.subscribe("minimizeWindow", () => {
      if (props.options.target === "header" && window.innerWidth < 960) {
        this.setState({
          visible: false
        });
      }
    });

    // window.addEventListener("resize", e => {
    //   if (!isMobile) {
    //     this.setState({
    //       visible: true
    //     });
    //   }
    // });
  }

  renderSearchResultList(target) {
    // const { classes } = this.props;
    const { result } = this.state;
    if (!result || this.state.activeSearchView === STARTVIEW) return null;
    return (
      // <div className={classes.searchResults}>
      <SearchResultList
        result={result}
        renderAffectButton={this.activeSpatialTools.radiusSearch}
        model={this.searchModel}
        target={target}
      />
      // </div>
    );
  }

  // renderLoader() {
  //   const { classes } = this.props;
  //   if (this.state.loading) {
  //     console.log("this.state.loading: ", this.state.loading);
  //     return (
  //       <div className={classes.loader}>
  //         <LinearProgress variant="query" />
  //       </div>
  //     );
  //   } else {
  //     return <div className={classes.loader} />;
  //   }
  // }

  // toggleSearch = () => {
  //   this.setState({
  //     visible: true
  //   });
  //   this.props.app.invokeCloseOnAllWindowPlugins();
  // };

  // renderCenter2() {
  //   const { classes } = this.props;
  //   var searchBar;

  //   if (this.state.activeSearchView === STARTVIEW) {
  //     searchBar = this.renderSearchBarStart();
  //   } else if (this.state.activeSearchView === TEXTSEARCH) {
  //     searchBar = this.renderSearchWithText();
  //   }

  //   return (
  //     <>
  //       <div>{this.renderLoader()}</div>
  //       <div className={classes.searchToolsContainer}>
  //         <div className={classes.searchContainer}>
  //           {this.state.activeSearchView ? this.renderSpatialBar() : null}
  //           {searchBar}
  //         </div>
  //         {/* {this.searchSettings ? this.renderSearchSettingButton() : null} */}
  //         <Tooltip title="Visa verktygspanelen">
  //           <IconButton
  //             onClick={this.props.onMenuClick}
  //             className={classes.iconButton2}
  //             disabled={this.props.menuButtonDisabled}
  //             aria-label="menu"
  //           >
  //             <MenuIcon />
  //           </IconButton>
  //         </Tooltip>
  //       </div>
  //       {this.renderSearchResultList("center")}
  //     </>
  //   );
  // }

  doSearch(v) {
    if (v.length <= 3) return null;
    this.localObserver.publish("toolchanged");
    this.searchModel.search(v, true, d => {
      this.resolve(d);
    });
  }

  renderCenter() {
    const { classes, onMenuClick, menuButtonDisabled } = this.props;

    const tooltipText = menuButtonDisabled
      ? "Du måste först låsa upp verktygspanelen för kunna klicka på den här knappen. Tryck på hänglåset till vänster."
      : "Visa verktygspanelen";

    return (
      <>
        <Paper className={classes.root}>
          <Tooltip title={tooltipText}>
            <span>
              <IconButton
                onClick={onMenuClick}
                className={classes.iconButton}
                disabled={menuButtonDisabled}
                aria-label="menu"
              >
                <MenuIcon />
              </IconButton>
            </span>
          </Tooltip>
          <InputBase
            className={classes.input}
            placeholder={this.state.searchboxPlaceholder}
            inputProps={{
              "aria-label": "search hajk maps",
              id: "searchbox"
            }}
            onChange={e => {
              const v = e.target.value;
              if (v.length <= 3) {
                return;
              }
              this.doSearch(v);
            }}
            onKeyPress={e => {
              if (e.key === "Enter") {
                this.doSearch(e.target.value);
              }
            }}
          />
          <Tooltip
            title={
              this.state.activeSearchView === STARTVIEW
                ? "Sök i Hajk"
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
          {/* {this.searchSettings ? this.renderSearchSettingButton() : null} */}
        </Paper>
        {this.renderSearchResultList("center")}
      </>
    );
  }

  // renderSearchSettingButton() {
  //   const { classes } = this.props;
  //   return (
  //     <div className={classes.mainContainerButton}>
  //       <SearchSettingsButton />
  //     </div>
  //   );
  // }

  resetToStartView() {
    document.getElementById("searchbox").value = "";
    this.localObserver.publish("toolchanged");
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

  // renderSearchBarStart() {
  //   return (
  //     <SearchBarStart
  //       localObserver={this.localObserver}
  //       activeSpatialTools={this.activeSpatialTools}
  //       onToolChanged={toolType => {
  //         this.setState({
  //           activeSearchView: toolType
  //         });
  //       }}
  //       onTextFieldClick={() => {
  //         this.setState({
  //           activeSearchView: TEXTSEARCH
  //         });
  //       }}
  //     />
  //   );
  // }

  // renderSearchWithText() {
  //   return (
  //     <SearchWithTextInput
  //       model={this.searchModel}
  //       forceSearch={this.searchModel.search}
  //       onClear={() => {
  //         this.searchModel.clear();
  //         this.localObserver.publish("clearInput");
  //         this.setState({
  //           result: false
  //         });
  //       }}
  //       resetToStartView={() => {
  //         this.resetToStartView();
  //       }}
  //       onChange={this.searchModel.search}
  //       loading={this.state.loading}
  //       localObserver={this.localObserver}
  //       onComplete={this.resolve}
  //       tooltip={this.tooltip}
  //       activeTool={this.state.activeSearchView}
  //     />
  //   );
  // }

  /**
   * Renders the search plugin.
   * Search is a bit special as it can be render to:
   * a) AppBar (when "target==='header'"), or
   * b) a div with ID "center", (when "target==='center'")
   * In both cases, we need to take care of rendering a
   * search toggle button. The button will be visible in AppBar
   * on small viewports.
   *
   * @returns React.Component
   * @memberof Search
   */
  render() {
    // If clean===true, some components won't be rendered below
    const clean = this.props.app.config.mapConfig.map.clean;

    return clean === false && this.renderCenter();
  }
}

export default withStyles(styles)(Search);
