import React from "react";
import { withStyles } from "@material-ui/core/styles";
import SearchResultGroup from "./SearchResultGroup.js";
import IconButton from "@material-ui/core/IconButton";
import AddCircleIcon from "@material-ui/icons/AddCircle";
import RemoveCircleIcon from "@material-ui/icons/RemoveCircle";
import classNames from "classnames";

const styles = theme => {
  return {
    searchResultEmpty: {
      padding: "10px"
    },
    searchResult: {
      overflow: "auto",
      padding: "10px",
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
      padding: "5px",
      paddingBottom: "22px",
      [theme.breakpoints.down("xs")]: {
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

class SearchResultList extends React.PureComponent {
  state = {
    visible: true,
    minimized: false
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
    const { result, localObserver, target, model } = this.props;
    if (this.state.minimized) return null;
    return (
      <div>
        {result.map((featureType, i) => {
          if (featureType.features.length === 0) return null;
          return (
            <SearchResultGroup
              localObserver={localObserver}
              parent={this}
              key={i}
              featureType={featureType}
              model={model}
              expanded={false}
              target={target}
            />
          );
        })}
      </div>
    );
  }

  render() {
    const { classes, result, localObserver, target } = this.props;
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
            className={classNames(
              classes.searchResultContainer,
              this.state.minimized ? classes.hidden : classes.visible
            )}
          >
            {result.map((featureType, i) => {
              if (featureType.features.length === 0) return null;
              return (
                <SearchResultGroup
                  localObserver={localObserver}
                  parent={this}
                  key={i}
                  featureType={featureType}
                  renderAffectButton={this.props.renderAffectButton}
                  model={this.props.model}
                  expanded={false}
                  target={target}
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
