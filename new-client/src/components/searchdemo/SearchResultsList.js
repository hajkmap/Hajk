import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import { boundingExtent } from "ol/extent";
import { Stroke, Style, Circle, Fill } from "ol/style";
import cslx from "clsx";

import { Button, IconButton } from "@material-ui/core";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";

import SearchResultsDataset from "./SearchResultsDataset";

let highlightedStyle = new Style({
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

const styles = (theme) => ({
  hide: {
    display: "none",
  },
  searchResultDatasetWrapper: {
    paddingTop: "8px",
    paddingBottom: "8px",
  },
});

class SearchResultsList extends React.PureComponent {
  state = {
    selectedItems: [],
  };

  showClickResultInMap = (feature) => {
    const currentIndex = this.state.selectedItems.indexOf(feature.id);
    const selectedItems = [...this.state.selectedItems];

    if (currentIndex === -1) {
      selectedItems.push(feature.id);
    } else {
      selectedItems.splice(currentIndex, 1);
    }

    this.setState(
      {
        selectedItems: selectedItems,
      },
      () => {
        this.changeStyleOnSelectedItems(this.state.selectedItems); // Set another OpenLayers Style so we can distinguish checked items
        this.zoomToSelectedItems(this.state.selectedItems); // Ensure we zoom out so all checked features fit
      }
    );
  };

  handleOnResultClick = (feature) => () => {
    const { app } = this.props;
    if (feature.onClickName) {
      app.globalObserver.publish(feature.onClickName, feature);
    } else {
      this.showClickResultInMap(feature);
    }
  };

  changeStyleOnSelectedItems = (items) => {
    const { resultSource } = this.props;
    // First unset style on ALL features (user might have UNCHECKED a feature)
    resultSource.getFeatures().map((f) => f.setStyle(null));

    // Now, set the style only on currently selected features
    items.map((fid) =>
      resultSource.getFeatureById(fid).setStyle(highlightedStyle)
    );
  };

  zoomToSelectedItems = (items) => {
    const { resultSource, map } = this.props;
    const extentsFromSelectedItems = items.map((fid) =>
      resultSource.getFeatureById(fid).getGeometry().getExtent()
    );

    const extentToZoomTo =
      extentsFromSelectedItems.length < 1
        ? resultSource.getExtent()
        : boundingExtent(extentsFromSelectedItems);

    map.getView().fit(extentToZoomTo, {
      size: map.getSize(),
      maxZoom: 7,
    });
  };

  renderSearchResultListOptions = () => {
    const { classes } = this.props;
    return (
      <Grid className={classes.hide} item>
        <Button>Filtrera</Button>
        <Button>Sortera</Button>
        <IconButton>
          <MoreHorizIcon />
        </IconButton>
      </Grid>
    );
  };

  render() {
    const {
      featureCollections,
      setSelectedFeatureAndSource,
      sumOfResults,
      getOriginBasedIcon,
      classes,
    } = this.props;
    const featureCollectionsWithFeatures = featureCollections.filter(
      (featureCollection) => {
        return featureCollection.value.features.length > 0;
      }
    );

    return (
      <Grid container alignItems={"center"} justify={"center"}>
        {this.renderSearchResultListOptions()}
        <Grid container item>
          {featureCollectionsWithFeatures.map((fc) => (
            <Grid
              key={fc.source.id}
              xs={12}
              className={cslx(
                featureCollections.length !== 1 && fc,
                classes.searchResultDatasetWrapper
              )}
              item
            >
              <SearchResultsDataset
                featureCollection={fc}
                getOriginBasedIcon={getOriginBasedIcon}
                sumOfResults={sumOfResults}
                handleOnResultClick={this.handleOnResultClick}
                setSelectedFeatureAndSource={setSelectedFeatureAndSource}
              />
            </Grid>
          ))}
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(SearchResultsList);
