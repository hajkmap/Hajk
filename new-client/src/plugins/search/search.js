import React, { Component } from "react";
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
      position: "fixed",
      zIndex: 1200,
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      width: "auto",
      background: "white",
      [theme.breakpoints.up("lg")]: {
        zIndex: 1000,
        top: "inherit",
        bottom: "inherit",
        left: 0,
        right: 0,
        padding: "10px",
        margin: "auto",
        width: "618px",
        borderBottomLeftRadius: "10px",
        borderBottomRightRadius: "10px",
        border: "1px solid " + theme.palette.secondary.main
      }
    },
    panelHeader: {
      [theme.breakpoints.up("lg")]: {
        display: "none"
      }
    },
    panelBody: {
      padding: 0,
      [theme.breakpoints.down("md")]: {
        padding: "10px",
        position: "absolute",
        top: "46px",
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "auto"
      }
    },
    searchContainer: {
      [theme.breakpoints.up("lg")]: {
        display: "flex",
        alignItems: "center"
      }
    }
  };
};

var isMobile = window.innerWidth < 1280;

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
  }

  renderSearchResultList() {
    const { result } = this.state;
    if (!result) return null;
    return (
      <SearchResultList
        result={result}
        model={this.searchModel}
        visible={true}
      />
    );
  }

  renderDescription() {
    return <div dangerouslySetInnerHTML={{ __html: this.toolDescription }} />;
  }
  renderDesktop() {
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
          <div>{this.renderDescription()}</div>
          <div className={classes.searchContainer}>
            <SearchWithinButton
              buttonText={this.searchWithinButtonText}
              model={this.searchModel}
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

  renderMobile() {
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
          <div>{this.renderDescription()}</div>
          <div className={classes.searchContainer}>
            <SearchWithinButton
              buttonText={this.searchWithinButtonText}
              model={this.searchModel}
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
    return isMobile ? this.renderMobile() : this.renderDesktop();
  }
}

export default withStyles(styles)(Search);
