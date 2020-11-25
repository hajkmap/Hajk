import React from "react";
import { withStyles } from "@material-ui/core/styles";
import clsx from "clsx";
import { Button, Divider, Paper, Typography } from "@material-ui/core";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Alert from "@material-ui/lab/Alert";
import PlaceIcon from "@material-ui/icons/Place";
import SearchResultGroup from "./SearchResultGroup.js";

const styles = theme => {
  return {
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
    searchResultTopBar: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: theme.spacing(1)
    },
    searchResultTopBarLeft: {
      display: "flex"
    },
    hidden: {
      display: "none"
    },
    // New styles
    root: {
      marginTop: 5,
      minWidth: 200,
      [theme.breakpoints.up("sm")]: {
        maxWidth: 520
      },
      [theme.breakpoints.down("xs")]: {
        minWidth: "100%",
        position: "absolute",
        left: 0
      }
    }
  };
};

class SearchResultList extends React.PureComponent {
  state = {
    minimized: false,
    highlightedFeatures: []
  };

  hide() {
    this.setState({
      minimized: true
    });
  }

  toggle = () => {
    this.setState({
      minimized: !this.state.minimized
    });
  };

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

    if (typeof result[0] === "string") {
      return (
        <Paper className={classes.root}>
          <Alert severity="success">
            Information hittades i {result.length} kartlager.
          </Alert>
        </Paper>
      );
    } else if (result.every(r => r.features.length === 0)) {
      return (
        <Paper className={classes.root}>
          <Alert severity="warning">Sökningen gav inget resultat.</Alert>
        </Paper>
      );
    } else {
      return (
        <Paper className={classes.root}>
          <div className={classes.searchResultTopBar}>
            <div className={classes.searchResultTopBarLeft}>
              <PlaceIcon />
              <Typography variant="button">
                {this.getNumberOfResults(result) + " sökträffar"}
              </Typography>
            </div>
            <div className={classes.searchResultTopBarRight}>
              <Button
                variant="text"
                onClick={this.toggle}
                color="default"
                className={classes.button}
                endIcon={minimized ? <ExpandMoreIcon /> : <ExpandLessIcon />}
              >
                {minimized ? "Visa" : "Dölj"}
              </Button>
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
