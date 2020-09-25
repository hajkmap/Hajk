import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";

import cslx from "clsx";

import { Button, IconButton } from "@material-ui/core";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";

import SearchResultsDataset from "./SearchResultsDataset";

const styles = (theme) => ({
  hide: {
    display: "none",
  },
  searchResultDatasetWrapper: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
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
        <Grid container direction="column" item>
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
