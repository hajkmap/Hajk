import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";

const styles = theme => ({
  searchResult: {
    position: "absolute",
    background: "white",
    color: "black",
    width: "100%",
    maxHeight: "500px",
    overflow: "auto",
    padding: "15px",
    border: "1px solid",
    borderTop: "none"
  }
});

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
              <h3>{featureType.source.caption}</h3>
              <div>
                {featureType.features.map((feature, j) => (
                  <div key={j}>
                    {feature.properties[featureType.source.displayFields[0]]}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}

export default withStyles(styles)(SearchResultList);
