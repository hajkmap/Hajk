import React from "react";
import { withStyles } from "@material-ui/core/styles";
import clsx from "clsx";
import { Divider, IconButton, Paper, Typography } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";
import Place from "@material-ui/icons/Place";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import SearchResultGroup from "./SearchResultGroup.js";

const styles = theme => {
  return {
    searchResultEmpty: {
      marginTop: 5
    },
    searchResult: {
      overflow: "auto",
      padding: "5px",
      position: "relative",
      top: "9px",
      background: "white",
      border: "1px solid " + theme.palette.primary.main,
      borderTop: "none",
      [theme.breakpoints.down("xs")]: {
        border: "none",
        padding: 0
      }
    },
    searchResultTop: {
      overflow: "auto",
      padding: "10px",
      position: "relative",
      top: "-4px",
      background: "white",
      border: "1px solid " + theme.palette.primary.main,
      borderTop: "none",
      borderBottomLeftRadius: "5px",
      borderBottomRightRadius: "5px"
    },
    searchResultContainer: {
      maxHeight: "calc(100vh - 380px)",
      overflow: "auto",
      display: "flex",
      flexDirection: "column",
      marginTop: "10px",
      paddingBottom: "22px",
      [theme.breakpoints.down("xs")]: {
        maxHeight: "calc(100vh - 200px)"
      }
    },
    searchResultTopBarLeft: {
      display: "flex"
    },
    searchResultTopBarRight: {
      display: "flex",
      alignItems: "center"
    },
    searchResultTopBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      margin: "5px"
    },

    hidden: {
      display: "none"
    },
    // New styles
    root: {
      minWidth: 200,
      [theme.breakpoints.up("sm")]: {
        maxWidth: 520
      }
    }
  };
};

class SearchResultList extends React.PureComponent {
  state = {
    visible: true, //is this really used?
    minimized: false,
    highlightedFeatures: []
  };

  hide() {
    this.setState({
      minimized: true
    });
  }

  toggle() {
    this.setState({
      minimized: !this.state.minimized
    });
  }

  renderResult() {
    const { result, target } = this.props;
    //if (this.state.minimized) return null;

    return (
      <div>
        {result.map((featureType, i) => {
          if (featureType.features.length === 0) return null;
          return (
            <SearchResultGroup
              parent={this}
              key={i}
              setHighlightedFeatures={this.setHighlightedFeatures}
              highlightedFeatures={this.state.highlightedFeatures}
              featureType={featureType}
              renderAffectButton={this.props.renderAffectButton}
              model={this.props.model}
              expanded={false}
              target={target}
            />
          );
        })}
      </div>
    );
  }

  getNumberOfResults = result => {
    return result.reduce((accumulated, result) => {
      return accumulated + result.features.length;
    }, 0);
  };

  setHighlightedFeatures = (i, callback) => {
    this.setState({ highlightedFeatures: i }, callback);
  };

  render() {
    const { classes, result } = this.props;
    const { minimized } = this.state;
    let searchResultClass = classes.searchResult;
    if (this.props.target === "top") {
      searchResultClass = classes.searchResultTop;
    }

    if (typeof result[0] === "string") {
      return (
        <div className={searchResultClass}>
          <div className={classes.searchResultEmpty}>
            Information hittades i {result.length} kartlager.
          </div>
        </div>
      );
    } else {
      if (result.every(r => r.features.length === 0)) {
        return (
          <Paper className={clsx(classes.root, classes.searchResultEmpty)}>
            <Alert severity="warning">Sökningen gav inget resultat.</Alert>
          </Paper>
        );
      }
    }

    if (!this.state.visible) {
      return null;
    } else {
      return (
        <Paper className={classes.root}>
          <div className={classes.searchResultTopBar}>
            <div className={classes.searchResultTopBarLeft}>
              <Place />
              <Typography>
                {this.getNumberOfResults(result) + " sökträffar"}
              </Typography>
            </div>
            <div className={classes.searchResultTopBarRight}>
              {!minimized ? (
                <div>
                  <IconButton onClick={() => this.toggle()}>
                    <Typography color="primary">Dölj</Typography>
                    <ExpandLess />
                  </IconButton>
                </div>
              ) : (
                <div>
                  <IconButton onClick={() => this.toggle()}>
                    <Typography color="primary">Visa</Typography>
                    <ExpandMore />
                  </IconButton>
                </div>
              )}
            </div>
          </div>
          <Divider
            className={this.state.minimized ? classes.hidden : null}
            variant="fullWidth"
          />
          <div
            className={clsx(
              classes.searchResultContainer,
              this.state.minimized ? classes.hidden : null
            )}
          >
            <div className={this.state.minimized ? classes.hidden : null}>
              {this.renderResult()}
            </div>
          </div>
        </Paper>
      );
    }
  }
}

export default withStyles(styles)(SearchResultList);
