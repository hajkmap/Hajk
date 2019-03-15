import React, { Component } from "react";
import LinearProgress from "@material-ui/core/LinearProgress";
import { withStyles } from "@material-ui/core/styles";
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
      padding: "10px",
      border: "1px solid " + theme.palette.secondary.main,
      maxWidth: "600px"
    },
    panelHeader: {
      [theme.breakpoints.up("xs")]: {
        display: "none"
      }
    },
    panelBody: {
      padding: 0
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
      height: 0
    }
  };
};

class Search extends Component {
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
    this.state = {};
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
  }

  renderSearchResultList() {
    const { classes } = this.props;
    const { result } = this.state;
    if (!result) return null;
    return (
      <div className={classes.searchResults}>
        <SearchResultList
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

  render() {
    const { classes, app } = this.props;
    return (
      <div
        className={classes.center}
        style={{ display: this.props.visible ? "block" : "none" }}
      >
        <div className={classes.panelHeader}>
          <PanelHeader
            title="Sök"
            onClose={() => {
              app.globalObserver.publish("hideSearchPanel", true);
            }}
            onMinimize={() => {
              console.log("Max");
            }}
            onMaximize={() => {
              console.log("Min");
            }}
          />
        </div>
        <div className={classes.panelBody}>
          <div>{this.renderLoader()}</div>
          <div>{this.renderDescription()}</div>
          <div className={classes.searchContainer}>
            <SearchWithinButton
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
}

export default withStyles(styles)(Search);
