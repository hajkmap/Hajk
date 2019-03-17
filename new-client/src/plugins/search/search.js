import React from "react";
import { createPortal } from "react-dom";
import LinearProgress from "@material-ui/core/LinearProgress";
import { withStyles } from "@material-ui/core/styles";
import SearchIcon from "@material-ui/icons/Search";
import Observer from "react-event-observer";
import SearchBar from "./components/SearchBar.js";
import SearchResultList from "./components/SearchResultList.js";
import SearchWithinButton from "./components/SearchWithinButton.js";
import ClearButton from "./components/ClearButton.js";
import SearchModel from "./SearchModel.js";
import PanelHeader from "./../../components/PanelHeader.js";

const styles = theme => {
  return {
    center: {
      background: "white",
      borderBottomLeftRadius: "10px",
      borderBottomRightRadius: "10px",
      margin: "-10px 10px 10px 10px",
      border: "1px solid " + theme.palette.secondary.main,
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
        alignItems: "center"
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
    iconButton: {
      color: "black",
      padding: "3px",
      overflow: "visible",
      cursor: "pointer",
      [theme.breakpoints.up("lg")]: {
        display: "none"
      }
    }
  };
};

class Search extends React.PureComponent {
  resolve = data => {
    this.setState({
      result: data
    });
  };

  constructor(props) {
    super(props);
    this.localObserver = Observer();
    this.searchModel = new SearchModel(
      props.options,
      props.map,
      props.app,
      this.localObserver
    );
    this.state = {
      visible: window.innerWidth > 1280
    };
    this.toolDescription = props.options.toolDescription;
    this.tooltip = props.options.tooltip;
    this.searchWithinButtonText = props.options.searchWithinButtonText;
    this.localObserver.on("searchStarted", () => {
      this.setState({
        loading: true
      });
    });
    this.localObserver.on("searchComplete", () => {
      this.setState({
        loading: false
      });
    });
    window.addEventListener("resize", () => {
      this.setState({
        visible: window.innerWidth > 1280
      });
    });
  }

  renderSearchResultList() {
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
        />
      </div>
    );
  }

  renderDescription() {
    return <div dangerouslySetInnerHTML={{ __html: this.toolDescription }} />;
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

  renderButton() {
    const { classes } = this.props;
    return (
      <SearchIcon className={classes.iconButton} onClick={this.toggleSearch} />
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
          <div>{this.renderDescription()}</div>
          <div className={classes.searchContainer}>
            <SearchWithinButton
              localObserver={this.localObserver}
              buttonText={this.searchWithinButtonText}
              model={this.searchModel}
              onSearchWithin={layerIds => {
                if (layerIds.length === 0) {
                  this.setState({
                    result: []
                  });
                } else {
                  this.setState({
                    result: layerIds
                  });
                }
              }}
            />
            <ClearButton
              model={this.searchModel}
              onClear={() => {
                this.searchModel.clear();
                this.localObserver.publish("clearInput");
                this.setState({
                  result: false
                });
              }}
            />
            <SearchBar
              model={this.searchModel}
              onChange={this.searchModel.search}
              onComplete={this.resolve}
              tooltip={this.tooltip}
            />
          </div>
          {this.renderSearchResultList()}
        </div>
      </div>
    );
  }

  render() {
    const { options } = this.props;
    const center = document.getElementById("center");
    if (options.target === "center" && center) {
      return (
        <div>
          {this.renderButton()}
          {createPortal(this.renderCenter(), center)}
        </div>
      );
    } else {
      return <div>Sök..</div>;
    }
  }
}

export default withStyles(styles)(Search);
