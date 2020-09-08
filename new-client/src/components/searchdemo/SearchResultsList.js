import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";

import { boundingExtent } from "ol/extent";
import { Stroke, Style, Circle, Fill } from "ol/style";

import { Button, IconButton } from "@material-ui/core";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";

import SearchResultsDataset from "./SearchResultsDataset";

var highlightedStyle = new Style({
  stroke: new Stroke({
    color: [200, 0, 0, 0.7],
    width: 4,
  }),
  fill: new Fill({
    color: [255, 0, 0, 0.1],
  }),
  image: new Circle({
    radius: 6,
    stroke: new Stroke({
      color: [200, 0, 0, 0.7],
      width: 4,
    }),
  }),
});

const styles = (theme) => ({});

class SearchResultsList extends React.PureComponent {
  state = {
    checkedItems: [],
  };

  handleCheckedToggle = (value) => () => {
    console.log("hejhej");
    const currentIndex = this.state.checkedItems.indexOf(value);
    const newChecked = [...this.state.checkedItems];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    //this.setCheckedItems(newChecked); // Set state so our checkboxes are up-to-date
    this.setState(
      {
        checkedItems: newChecked,
      },
      () => {
        this.changeStyleOnCheckedItems(this.state.checkedItems); // Set another OpenLayers Style so we can distinguish checked items
        this.zoomToCheckedItems(this.state.checkedItems); // Ensure we zoom out so all checked features fit
      }
    );
  };

  changeStyleOnCheckedItems = (items) => {
    // First unset style on ALL features (user might have UNCHECKED a feature)
    this.props.resultsSource.getFeatures().map((f) => f.setStyle(null));

    // Now, set the style only on currently selected features
    items.map((fid) =>
      this.props.resultsSource.getFeatureById(fid).setStyle(highlightedStyle)
    );
  };

  zoomToCheckedItems = (items) => {
    // Try to grab extents for each of the selected items
    const extentsFromCheckedItems = items.map((fid) =>
      this.props.resultsSource.getFeatureById(fid).getGeometry().getExtent()
    );

    // If there were no selected items, use extent for the OL source itself,
    // else create a boundary that will fit all selected items
    const extentToZoomTo =
      extentsFromCheckedItems.length < 1
        ? this.props.resultsSource.getExtent()
        : boundingExtent(extentsFromCheckedItems);

    this.props.map.getView().fit(extentToZoomTo, {
      size: this.props.map.getSize(),
      maxZoom: 7,
    });
  };

  render() {
    const {
      featureCollections,
      setSelectedFeatureAndSource,
      sumOfResults,
    } = this.props;
    console.log("featureCollections: ", featureCollections);
    featureCollections.map((fc) => {
      console.log("fc", fc);
    });
    const { checkedItems } = this.state;
    return (
      <>
        <Grid container alignItems={"center"} justify={"center"}>
          <Button>Filtrera</Button>
          <Button>Sortera</Button>
          <IconButton>
            <MoreHorizIcon />
          </IconButton>
        </Grid>
        {featureCollections.map((fc) => (
          <SearchResultsDataset
            key={fc.source.id}
            featureCollection={fc}
            sumOfResults={sumOfResults}
            checkedItems={checkedItems}
            handleCheckedToggle={this.handleCheckedToggle}
            setSelectedFeatureAndSource={setSelectedFeatureAndSource}
          />
        ))}
      </>
    );
  }
}

export default withStyles(styles)(SearchResultsList);
