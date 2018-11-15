import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import SearchBar from "./components/SearchBar.js";
import SearchResultList from "./components/SearchResultList.js";
import SearchWithinButton from "./components/SearchWithinButton.js";
import ClearButton from "./components/ClearButton.js";
import SearchModel from "./SearchModel.js";

const styles = theme => {
  return {
    searchContainer: {
      position: "absolute",
      top: "12px",
      right: "15px",
      display: "flex",
      alignItems: "center",
      [theme.breakpoints.down("xs")]: {
        top: "0",
        width: "100%",
        position: "relative",
        marginLeft: theme.spacing.unit
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
    this.searchModel = new SearchModel(props.options, props.map);
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
      <div className={classes.searchContainer}>
        <SearchWithinButton model={this.searchModel} />
        <ClearButton
          model={this.searchModel}
          onClear={() => {
            this.searchModel.clear();
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
    );
  }
}

export default withStyles(styles)(Search);
