import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import SearchResultGroup from "./SearchResultGroup.js";
import Button from "@material-ui/core/Button";
import IconButton from "@material-ui/core/IconButton";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import RemoveCircleIcon from "@material-ui/icons/RemoveCircle";

const styles = theme => {
  return {
    searchResult: {
      position: "absolute",
      background: "white",
      color: "black",
      width: "100%",
      maxWidth: "350px",
      maxHeight: "500px",
      overflow: "auto",
      padding: "15px",
      border: "1px solid #ccc",
      borderTop: "none",
      top: "49px",
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
    },
    searchResultTopBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      margin: "5px"
    },
    visible: {
      display: "block"
    },
    hidden: {
      display: "none"
    }
  };
};

class SearchResultList extends Component {
  state = {
    visible: true,
    minimized: false
  };

  componentWillMount() {}

  hide() {
    this.setState({
      minimized: true
    });
  }

  componentWillReceiveProps(e) {
    // this.setState({
    //   visible: this.props.visible
    // });
    // this.setState({
    //   minimized: this.props.minimized
    // });
  }

  toggle() {
    this.setState({
      minimized: !this.state.minimized
    });
  }

  renderResult() {
    const { classes, result } = this.props;
    if (this.state.minimized) return null;
    return (
      <div>
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

  render() {
    const { classes, result } = this.props;
    const { minimized } = this.state;
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
          <div className={classes.searchResultTopBar}>
            <div>SÖKRESULTAT</div>
            <div>
              {!minimized ? (
                <IconButton
                  className={classes.button}
                  onClick={() => this.toggle()}
                >
                  <RemoveCircleIcon />
                </IconButton>
              ) : (
                <IconButton
                  className={classes.button}
                  onClick={() => this.toggle()}
                >
                  <AddCircleIcon />
                </IconButton>
              )}
            </div>
          </div>
          <div
            className={this.state.minimized ? classes.hidden : classes.visible}
          >
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
        </div>
      );
    }
  }
}

export default withStyles(styles)(SearchResultList);
