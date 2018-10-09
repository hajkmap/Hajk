import React, { Component } from "react";
import { withStyles } from "@material-ui/core/styles";
import GeoJSON from 'ol/format/GeoJSON';

const styles = theme => ({
  item: {
    userSelect: 'none',
    cursor: 'pointer'
  }
});

class SearchResultGroup extends Component {
  state = {
    expanded: false
  };

  itemClick = (feature) => (e) =>  {
    var olFeature = (new GeoJSON()).readFeatures(feature)[0];
    this.props.model.searchWithinArea({
      feature: olFeature
    });
  };

  constructor(props) {
    super(props);
  }

  componentWillMount() {}

  createItem(feature, displayField, i) {
    const {classes} = this.props;
    return (
      <div
        onClick={this.itemClick(feature)}
        key={i}
        className={classes.item}>
        {feature.properties[displayField]}
      </div>
    );
  }


  render() {

    const {featureType} = this.props;
    var i = 0;
    var nodes = [];

    for (; i < 10; i++) {
      if (featureType.features[i]) {
        nodes.push(
          this.createItem(
            featureType.features[i],
            featureType.source.displayFields[0],
            i
          )
        );
      }
    }

    if (featureType.features.length > 10) {
      nodes.push(<div key="toggler" onClick={() => {
        this.setState({
          expanded: !this.state.expanded
        });
      }}><a href="javascript:;">{this.state.expanded ? "Dölj" : "Visa fler..."}</a></div>);
    }

    for (; i < featureType.features.length; i++) {
      if (this.state.expanded && featureType.features[i]) {
        nodes.push(
          this.createItem(
            featureType.features[i],
            featureType.source.displayFields[0],
            i
          )
        );
      }
    }

    return nodes;
  }
}

export default withStyles(styles)(SearchResultGroup);
