import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import GeoJSON from "ol/format/GeoJSON";

const styles = theme => ({
  item: {
    userSelect: "none",
    cursor: "pointer"
  }
});

class SearchResultGroup extends Component {
  state = {
    expanded: false
  };

  itemClick = feature => e => {
    var olFeature = new GeoJSON().readFeatures(feature)[0];
    this.props.model.searchWithinArea({
      feature: olFeature
    });
  };

  componentWillMount() {}

  createItem(feature, displayField, i) {
    const { classes } = this.props;
    return (
      <div onClick={this.itemClick(feature)} key={i} className={classes.item}>
        {feature.properties[displayField]}
      </div>
    );
  }

  render() {
    const { featureType } = this.props;
    return featureType.features.map((feature, i) =>
      this.createItem(
        featureType.features[i],
        featureType.source.displayFields[0],
        i
      )
    );
  }
}

export default withStyles(styles)(SearchResultGroup);
