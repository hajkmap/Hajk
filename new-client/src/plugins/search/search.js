import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import SearchBar from "./components/SearchBar.js";
import SearchResultList from "./components/SearchResultList.js";
import SearchModel from "./SearchModel.js";

const styles = theme => ({
  searchContainer: {
    right: "15px",
    width: "100%",
    position: "relative",
    marginLeft: theme.spacing.unit,
    [theme.breakpoints.up("sm")]: {
      position: "absolute",
      marginLeft: theme.spacing.unit,
      width: "auto"
    }
  }
});

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

  componentWillMount() {}

  renderSearchResultList() {
    const { result } = this.state;
    if (!result) return null;
    return <SearchResultList result={result} />;
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.searchContainer}>
        <SearchBar
          onChange={this.searchModel.search}
          onComplete={this.resolve}
        />
        {this.renderSearchResultList()}
      </div>
    );
  }
}

export default withStyles(styles)(Search);
