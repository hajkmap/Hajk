import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
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
        top: "unset",
        bottom: "unset",
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
      padding: "10px",
      [theme.breakpoints.up("lg")]: {
        padding: 0
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
      this.localObserver,
      this.props.mobile
    );
    this.state = {};
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
          />
        </div>
        <div className={classes.panelBody}>
          <div>
            <Typography variant="h5" align="center">
              Vad händer i dina kvarter?
            </Typography>
            <Typography>
              Sök efter en fastighet eller adress för att visa information från
              översiktsplanen som påverkar dig. Du kan också markera ett område
              i kartan för att söka inom ett valfritt område.
            </Typography>
          </div>
          <div className={classes.searchContainer}>
            <SearchWithinButton model={this.searchModel} />
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
            />
            {this.renderSearchResultList()}
          </div>
        </div>
      </div>
    );
  }
}

export default withStyles(styles)(Search);
