import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import Typography from "@material-ui/core/Typography";
import Observer from "react-event-observer";
import SearchBar from "./components/SearchBar.js";
import SearchResultList from "./components/SearchResultList.js";
import SearchWithinButton from "./components/SearchWithinButton.js";
import ClearButton from "./components/ClearButton.js";
import SearchModel from "./SearchModel.js";

const styles = theme => {
  return {
    searchContainer: {
      display: "flex",
      alignItems: "center",
      [theme.breakpoints.down("xs")]: {
        top: "0",
        width: "100%",
        position: "relative",
        marginLeft: theme.spacing.unit,
        display: "inline"
      }
    }
  };
};

class Search extends Component {
  state = {};

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
    const { classes } = this.props;
    return (
      <>
        <div>
          <Typography variant="h5" align="center">
            Vad händer i dina kvarter?
          </Typography>
          <Typography>
            Sök efter en fastighet eller adress för att visa information från
            översiktsplanen som påverkar dig. Du kan också markera ett område i
            kartan för att söka inom ett valfritt område.
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
      </>
    );
  }
}

export default withStyles(styles)(Search);
