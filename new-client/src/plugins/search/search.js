import React from "react";
import { createPortal } from "react-dom";
import LinearProgress from "@material-ui/core/LinearProgress";
import Button from "@material-ui/core/Button";
import { withStyles } from "@material-ui/core/styles";
import SearchIcon from "@material-ui/icons/Search";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import Observer from "react-event-observer";
import SearchBar from "./components/SearchBar.js";
import SearchResultList from "./components/SearchResultList.js";
import SpatialSearchMenu from "./components/SpatialSearchMenu";
//import ClearButton from "./components/ClearButton.js";
import SearchSettingsButton from "./components/SearchSettingsButton";
import SearchWithinBar from "./components/SearchWithinBar";
import SearchWithSelectionBar from "./components/SearchWithSelectionBar";
import SearchWithPolygonBar from "./components/SearchWithPolygonBar";
import SearchModel from "./SearchModel.js";
import PanelHeader from "./../../components/PanelHeader.js";
import { isMobile } from "../../utils/IsMobile.js";

const styles = theme => {
  return {
    center: {
      background: "white",
      borderBottomLeftRadius: "10px",
      borderBottomRightRadius: "10px",
      margin: "-10px 10px 10px 10px",
      border: "1px solid " + theme.palette.primary.main,
      maxWidth: "600px",
      pointerEvents: "all",
      [theme.breakpoints.down("md")]: {
        left: 0,
        right: 0,
        margin: "0 10px 10px 10px",
        position: "absolute",
        maxWidth: "inherit",
        border: "none",
        boxShadow:
          "0px 0px 3px rgba(0, 0, 0, 0.3), 2px 2px 6px rgba(0, 0, 0, 0.4)"
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
      [theme.breakpoints.up("lg")]: {
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
      [theme.breakpoints.up("lg")]: {
        display: "flex",
        flex: "auto",
        alignItems: "center",

        backgroundColor: "#eee",
        borderRadius: theme.shape.borderRadius
      }
    },
    mainContainerButton: {
      [theme.breakpoints.up("lg")]: {
        alignItems: "center",
        justifyContent: "center"
      }
    },
    searchToolsContainer: {
      [theme.breakpoints.up("lg")]: {
        display: "flex",
        alignItems: "center"
      }
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
      marginBottom: "4px",
      borderRadius: "4px",
      overflow: "hidden"
    },
    searchResults: {
      overflow: "visible",
      height: 0,
      [theme.breakpoints.down("xs")]: {
        height: "inherit"
      }
    },
    iconButtonHeader: {
      color: "black",
      padding: "3px",
      overflow: "visible",
      cursor: "pointer",
      [theme.breakpoints.up("md")]: {
        display: "none"
      }
    },
    iconButton: {
      color: "black",
      padding: "3px",
      overflow: "visible",
      cursor: "pointer",
      [theme.breakpoints.up("lg")]: {
        display: "none"
      }
    },
    backIcon: {
      [theme.breakpoints.up("md")]: {
        display: "none"
      }
    }
  };
};

const POLYGON = "polygon";
const WITHIN = "within";
const TEXTSEARCH = "textsearch";
const SELECTION = "selection";

class Search extends React.PureComponent {
  resolve = data => {
    this.setState({
      result: data
    });
  };

  constructor(props) {
    super(props);
    var b = props.options.target === "header" ? 960 : 1280;
    this.localObserver = Observer();
    this.searchModel = new SearchModel(
      props.options,
      props.map,
      props.app,
      this.localObserver
    );
    this.state = {
      visible: window.innerWidth > b,
      loading: false,
      activeToolType: "textsearch"
    };
    this.tooltip = props.options.tooltip;
    this.searchWithinButtonText = props.options.searchWithinButtonText;
    this.searchWithPolygonButtonText =
      props.options.searchWithPolygonButtonText;
    this.searchWithSelectionButtonText =
      props.options.searchWithSelectionButtonText;
    this.localObserver.on("searchStarted", () => {
      this.setState({
        loading: true
      });
    });
    this.localObserver.on("toolchanged", () => {
      this.setState({
        result: false
      });
    });
    this.localObserver.on("searchComplete", () => {
      this.setState({
        loading: false
      });
    });

    this.localObserver.on("minimizeWindow", () => {
      if (props.options.target === "header" && window.innerWidth < 960) {
        this.setState({
          visible: false
        });
      }
    });

    window.addEventListener("resize", e => {
      if (!isMobile) {
        this.setState({
          visible: window.innerWidth > b
        });
      }
    });
  }

  renderSearchResultList(target) {
    const { classes } = this.props;
    const { result } = this.state;
    if (!result) return null;
    return (
      <div className={classes.searchResults}>
        <SearchResultList
          localObserver={this.localObserver}
          result={result}
          model={this.searchModel}
          visible={true}
          target={target}
        />
      </div>
    );
  }

  renderLoader() {
    const { classes } = this.props;
    if (this.state.loading) {
      return (
        <div className={classes.loader}>
          <LinearProgress variant="query" />
        </div>
      );
    } else {
      return <div className={classes.loader} />;
    }
  }

  toggleSearch = () => {
    this.setState({
      visible: true
    });
    this.props.app.closePanels();
  };

  renderButton(target) {
    const { classes } = this.props;
    return (
      <SearchIcon
        className={
          target === "header" ? classes.iconButtonHeader : classes.iconButton
        }
        onClick={this.toggleSearch}
      />
    );
  }

  renderCenter() {
    const { classes } = this.props;
    return (
      <div
        className={classes.center}
        style={{
          display: this.state.visible ? "block" : "none",
          top: this.state.minimized ? "calc(100vh - 110px)" : "0"
        }}
      >
        <div className={classes.panelHeader}>
          <PanelHeader
            maximizable={false}
            localObserver={this.localObserver}
            title="Sök"
            onClose={() => {
              this.setState({
                visible: false
              });
            }}
            onMinimize={() => {
              this.setState({
                minimized: true
              });
            }}
            onMaximize={() => {
              this.setState({
                minimized: false
              });
            }}
          />
        </div>
        <div
          className={classes.panelBody}
          style={{
            height: this.state.minimized ? 0 : "auto",
            overflow: this.state.minimized ? "hidden" : "visible"
          }}
        >
          <div>{this.renderLoader()}</div>
          <div className={classes.searchToolsContainer}>
            <div className={classes.searchContainer}>
              {this.renderSpatialBar()}
              {this.renderSearchBar()}
              {this.renderSpatialSearchOptions()}
            </div>
            {this.renderMainContainerButton()}
          </div>
          {this.renderSearchResultList("center")}
        </div>
      </div>
    );
  }

  renderMainContainerButton() {
    const { classes } = this.props;
    if (this.state.activeToolType !== TEXTSEARCH) {
      return (
        <div className={classes.mainContainerButton}>
          <Button
            className={classes.button}
            onClick={() => {
              this.searchModel.clearRecentSpatialSearch();
              this.setState({ activeToolType: TEXTSEARCH });
            }}
          >
            Avbryt
          </Button>
        </div>
      );
    } else {
      return (
        <div className={classes.mainContainerButton}>
          <SearchSettingsButton />
        </div>
      );
    }
  }

  renderSpatialBar() {
    if (this.state.activeToolType !== TEXTSEARCH) {
      switch (this.state.activeToolType) {
        case POLYGON:
          return (
            <SearchWithPolygonBar
              model={this.searchModel}
              localObserver={this.localObserver}
              onSearchDone={featureCollections => {
                this.resolve(featureCollections);
              }}
            />
          );
        case WITHIN: {
          return (
            <SearchWithinBar
              localObserver={this.localObserver}
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
            <SearchWithSelectionBar
              localObserver={this.localObserver}
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
  }

  renderSpatialSearchOptions() {
    if (
      this.state.activeToolType === TEXTSEARCH &&
      this.props.options.activeSpatialTools
    ) {
      return (
        <SpatialSearchMenu
          onToolChanged={toolType => {
            this.setState({
              activeToolType: toolType
            });
          }}
          activeSpatialTools={this.props.options.activeSpatialTools}
        />
      );
    } else {
      return;
    }
  }

  renderSearchBar() {
    if (this.state.activeToolType === TEXTSEARCH) {
      return (
        <SearchBar
          model={this.searchModel}
          forceSearch={this.searchModel.search}
          onChange={this.searchModel.search}
          localObserver={this.localObserver}
          onComplete={this.resolve}
          tooltip={this.tooltip}
          activeTool={this.state.activeToolType}
        />
      );
    } else {
      return;
    }
  }

  renderTop() {
    const { classes } = this.props;
    return (
      <div
        className={classes.searchContainerTop}
        style={{ display: this.state.visible ? "block" : "none" }}
      >
        <ArrowBackIcon
          className={classes.backIcon}
          onClick={() => {
            this.setState({
              visible: false
            });
          }}
        />
        <SearchBar
          model={this.searchModel}
          onChange={this.searchModel.search}
          onComplete={this.resolve}
          tooltip={this.tooltip}
          target="top"
          loading={this.state.loading}
          onClear={() => {
            this.searchModel.clear();
            this.localObserver.publish("clearInput");
            this.setState({
              result: false
            });
          }}
        />
        <div>{this.renderSearchResultList("top")}</div>
      </div>
    );
  }

  render() {
    const { options } = this.props;
    const center = document.getElementById("center");
    if (options.target === "center" && center) {
      return (
        <div>
          {this.renderButton(options.target)}
          {createPortal(this.renderCenter(), center)}
        </div>
      );
    }
    if (options.target === "header") {
      return (
        <div>
          {this.renderButton(options.target)}
          {this.renderTop()}
        </div>
      );
    }
    return null;
  }
}

export default withStyles(styles)(Search);
