import React from "react";
import { withStyles } from "@material-ui/core/styles";
import SearchResultGroup from "./SearchResultGroup.js";
import IconButton from "@material-ui/core/IconButton";
import Divider from "@material-ui/core/Divider";
import Typography from "@material-ui/core/Typography";
import Place from "@material-ui/icons/Place";
import ExpandLess from "@material-ui/icons/ExpandLess";
import ExpandMore from "@material-ui/icons/ExpandMore";
import classNames from "classnames";

const styles = theme => {
  return {
    searchResultEmpty: {
      padding: "10px"
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
        maxHeight: "inherit"
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
    if (this.state.minimized) return null;
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

  setHighlightedFeatures = (i, callback) => {
    this.setState({ highlightedFeatures: i }, callback);
  };

  render() {
    const { classes, result, target } = this.props;
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
          <div className={searchResultClass}>
            <div className={classes.searchResultEmpty}>
              Sökningen gav inget resultat
            </div>
          </div>
        );
      }
    }

    if (!this.state.visible) {
      return null;
    } else {
      return (
        <div className={searchResultClass}>
          <div className={classes.searchResultTopBar}>
            <div className={classes.searchResultTopBarLeft}>
              <Place />
              <Typography className={classes.resultCount}>
                {result.reduce((x, t) => {
                  return x + t.features.length;
                }, 0) + " sökträffar"}
              </Typography>
            </div>
            <div className={classes.searchResultTopBarRight}>
              {!minimized ? (
                <div>
                  <IconButton
                    className={classes.button}
                    onClick={() => this.toggle()}
                  >
                    <Typography color="primary" className={classes.resultCount}>
                      Dölj
                    </Typography>
                    <ExpandLess />
                  </IconButton>
                </div>
              ) : (
                <div>
                  <IconButton
                    className={classes.button}
                    onClick={() => this.toggle()}
                  >
                    <Typography color="primary" className={classes.resultCount}>
                      Visa
                    </Typography>
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
            className={classNames(
              classes.searchResultContainer,
              this.state.minimized ? classes.hidden : null
            )}
          >
            {this.renderResult()}
          </div>
        </div>
      );
    }
  }
}

export default withStyles(styles)(SearchResultList);
