import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import SearchResultGroup from "./SearchResultGroup.js";

const styles = theme => {
  return {
    searchResult: {
      position: "absolute",
      background: "white",
      color: "black",
      width: "100%",
      maxHeight: "500px",
      overflow: "auto",
      padding: "15px",
      border: "1px solid #ccc",
      borderTop: "none",
      top: "48px",
      right: 0,
      [theme.breakpoints.down("xs")]: {
        top: "56px",
        left: 0,
        right: 0,
        bottom: 0,
        position: "fixed",
        border: "none",
        maxHeight: "inherit"
      }
    }
  };
};

class SearchResultList extends Component {
  state = {
    visible: true
  };

  hide() {
    this.setState({
      visible: false
    });
  }

  componentWillReceiveProps(e) {
    this.setState({
      visible: this.props.visible
    });
  }

  render() {
    const { classes, result } = this.props;
    if (result.every(r => r.features.length === 0)) {
      return (
        <div className={classes.searchResult}>
          <div>Sökningen gav inget resultat</div>
        </div>
      );
    }
    if (!this.state.visible) {
      return null;
    } else {
      return (
        <div className={classes.searchResult}>
          {result.map((featureType, i) => {
            if (featureType.features.length === 0) return null;
            return (
              <SearchResultGroup
                parent={this}
                key={i}
                featureType={featureType}
                model={this.props.model}
                expanded={false}
              />
            );
          })}
        </div>
      );
    }
  }
}

export default withStyles(styles)(SearchResultList);
