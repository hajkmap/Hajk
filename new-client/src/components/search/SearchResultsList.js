import React from "react";
import cslx from "clsx";
import { withStyles } from "@material-ui/core/styles";
import { Grid, withWidth } from "@material-ui/core";
import SearchResultsDataset from "./SearchResultsDataset";

const styles = (theme) => ({
  searchResultDatasetWrapper: {
    paddingBottom: theme.spacing(0),
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

  handleOnResultClick = (feature) => () => {
    const { app } = this.props;
    if (feature.onClickName) {
      app.globalObserver.publish(feature.onClickName, feature);
    } else {
      this.showClickResultInMap(feature);
    }
  };

  render() {
    const {
      featureCollections,
      sumOfResults,
      getOriginBasedIcon,
      app,
      classes,
    } = this.props;
    const featureCollectionsContainingFeatures = featureCollections.filter(
      (featureCollection) => {
        return featureCollection.value.features.length > 0;
      }
    );

    return (
      <Grid container alignItems="center" justify="center">
        <Grid container item>
          {featureCollectionsContainingFeatures.map(
            (featureCollection, index) => (
              <Grid
                key={featureCollection.source.id}
                xs={12}
                className={cslx({
                  [classes.searchResultDatasetWrapper]:
                    featureCollectionsContainingFeatures.length !== 1 &&
                    featureCollection &&
                    index !== featureCollectionsContainingFeatures.length - 1,
                })}
                item
              >
                <SearchResultsDataset
                  app={app}
                  featureCollection={featureCollection}
                  getOriginBasedIcon={getOriginBasedIcon}
                  sumOfResults={sumOfResults}
                  handleOnResultClick={this.handleOnResultClick}
                />
              </Grid>
            )
          )}
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(withWidth()(SearchResultsList));
