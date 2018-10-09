import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import SearchResultGroup from "./SearchResultGroup.js";
import Badge from "@material-ui/core/Badge";
import Typography from "@material-ui/core/Typography";

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
      border: "1px solid",
      borderTop: "none",
      top: "49px",
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
    badge: {},
    heading: {
      padding: 0,
      paddingRight: "14px",
      fontSize: "14pt",
      fontWeight: "500",
      marginBottom: "5px"
    },
    header: {
      padding: "10px 0"
    }
  };
};

class SearchResultList extends Component {
  state = {};

  constructor(props) {
    super(props);
  }

  componentWillMount() {}

  render() {
    const { classes, result } = this.props;
    if (result.every(r => r.features.length === 0)) {
      return (
        <div className={classes.searchResult}>
          <div>Sökningen gav inget resultat</div>
        </div>
      );
    }
    return (
      <div className={classes.searchResult}>
        {result.map((featureType, i) => {
          if (featureType.features.length === 0) return null;
          return (
            <div key={i}>
              <div className={classes.header}>
                <Badge
                  color="primary"
                  className={classes.badge}
                  badgeContent={featureType.features.length}
                  classes={{
                    badge: classes.badge
                  }}
                >
                  <Typography className={classes.heading}>
                    {featureType.source.caption}
                  </Typography>
                </Badge>
              </div>
              <SearchResultGroup
                featureType={featureType}
                model={this.props.model}
              />
            </div>
          );
        })}
      </div>
    );
  }
}

export default withStyles(styles)(SearchResultList);
