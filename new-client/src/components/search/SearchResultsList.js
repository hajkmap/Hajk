import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { Grid, withWidth } from "@material-ui/core";
import SearchResultsDataset from "./SearchResultsDataset";

const styles = (theme) => ({
  searchResultDatasetWrapper: {
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
});

class SearchResultsList extends React.PureComponent {
  state = {
    selectedItems: [],
  };

  showClickResultInMap = (feature) => {
    const { localObserver } = this.props;
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
        if (this.props.width === "xs" || this.props.width === "sm") {
          localObserver.publish("minimize-search-result-list");
        }
        localObserver.publish("highlight-features", this.state.selectedItems);
        localObserver.publish("zoom-to-features", this.state.selectedItems);
      }
    );
  };

  handleOnFeatureClick = (feature) => {
    const { app, setActiveFeature } = this.props;
    if (feature.onClickName) {
      app.globalObserver.publish(feature.onClickName, feature);
    } else {
      setActiveFeature(feature);
      if (this.state.selectedItems.indexOf(feature.id) === -1) {
        this.showClickResultInMap(feature);
      }
    }
  };

  render() {
    const {
      featureCollections,
      sumOfResults,
      getOriginBasedIcon,
      app,
      classes,
      setActiveFeatureCollection,
      activeFeatureCollection,
      activeFeature,
      setActiveFeature,
      resetFeatureAndCollection,
    } = this.props;

    return (
      <Grid container alignItems="center" justify="center">
        <Grid container item>
          {featureCollections.map((featureCollection) => (
            <Grid
              key={featureCollection.source.id}
              role="button"
              xs={12}
              className={classes.searchResultDatasetWrapper}
              item
            >
              <SearchResultsDataset
                app={app}
                featureCollection={featureCollection}
                getOriginBasedIcon={getOriginBasedIcon}
                sumOfResults={sumOfResults}
                selectedItems={this.state.selectedItems}
                showClickResultInMap={this.showClickResultInMap}
                activeFeatureCollection={activeFeatureCollection}
                activeFeature={activeFeature}
                setActiveFeatureCollection={setActiveFeatureCollection}
                setActiveFeature={setActiveFeature}
                handleOnFeatureClick={this.handleOnFeatureClick}
                resetFeatureAndCollection={resetFeatureAndCollection}
              />
            </Grid>
          ))}
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(withWidth()(SearchResultsList));
