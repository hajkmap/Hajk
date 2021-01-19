import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { isMobile } from "../../../utils/IsMobile";
import { List, ListItem } from "@material-ui/core";
import SearchResultsDatasetFeature from "./SearchResultsDatasetFeature";
import SearchResultsDatasetFeatureDetails from "./SearchResultsDatasetFeatureDetails";
import SearchResultsPreview from "./SearchResultsPreview";

const styles = () => ({
  featureList: {
    padding: 0,
    width: "100%",
    transition: "none",
  },
  featureListItem: {
    width: "100%",
    display: "flex",
    padding: 0,
    transition: "none",
  },
});

class SearchResultsDataset extends React.PureComponent {
  //Some sources does not return numberMatched and numberReturned, falling back on features.length
  state = {
    previewFeature: undefined, // Feature to show in preview
    popOverAnchorEl: undefined, // The element which the preview popper will anchor to
  };

  delayBeforeShowingPreview = 800; //Delay before showing preview popper in ms
  previewTimer = null; // Timer to keep track of when delay has passed

  setPreviewFeature = (e, feature) => {
    const target = e.currentTarget;
    clearTimeout(this.previewTimer);
    this.previewTimer = setTimeout(() => {
      this.setState({
        previewAnchorEl: target,
        previewFeature: feature,
      });
    }, this.delayBeforeShowingPreview);
  };

  resetPreview = () => {
    clearTimeout(this.previewTimer);
    if (this.state.previewFeature)
      this.setState({
        previewAnchorEl: undefined,
        previewFeature: undefined,
      });
  };

  getFilteredFeatures = () => {
    const { featureFilter, getFeatureTitle } = this.props;
    const featureCollection = { ...this.props.featureCollection };
    // If user has a value in the filter input...
    if (featureFilter.length > 0) {
      // Filter all features in the collection
      const filteredFeatures = featureCollection.value.features.filter(
        (feature) => {
          // Returning the features having a title including
          // the filter string
          const featureTitle = getFeatureTitle(feature);
          return featureTitle
            .toLowerCase()
            .includes(featureFilter.toLowerCase());
        }
      );
      return filteredFeatures;
    }
    // Filter length is zero? Return all features
    return featureCollection.value.features;
  };

  getSortedFeatures = (features) => {
    const { featureSortingStrategy, getFeatureTitle } = this.props;

    const featuresAtoZSorted = features.sort((a, b) =>
      getFeatureTitle(a).localeCompare(getFeatureTitle(b), "sv")
    );

    switch (featureSortingStrategy) {
      case "ZtoA":
        return featuresAtoZSorted.reverse();
      default:
        // AtoZ
        return featuresAtoZSorted;
    }
  };

  renderFeatureDetails = () => {
    const {
      featureCollection,
      app,
      activeFeatureCollection,
      activeFeature,
      getFeatureTitle,
      localObserver,
    } = this.props;
    return (
      <SearchResultsDatasetFeatureDetails
        feature={activeFeature}
        featureTitle={getFeatureTitle(activeFeature)}
        featureCollection={featureCollection}
        app={app}
        source={activeFeatureCollection.source}
        localObserver={localObserver}
      />
    );
  };

  renderFeatureList = () => {
    const {
      featureCollection,
      classes,
      app,
      selectedItems,
      showClickResultInMap,
      activeFeature,
      handleOnFeatureClick,
      handleOnFeatureKeyPress,
      getOriginBasedIcon,
      getFeatureTitle,
    } = this.props;

    const features = this.getFilteredFeatures();
    const sortedFeatures = this.getSortedFeatures(features);
    return (
      <>
        <List
          className={classes.featureList}
          id={`search-result-dataset-details-${featureCollection.source.id}`}
        >
          {sortedFeatures.map((f) => {
            const featureTitle = getFeatureTitle(f);
            return (
              <ListItem
                disableTouchRipple
                className={classes.featureListItem}
                key={f.id}
                divider
                button
                onClick={() => {
                  this.resetPreview();
                  handleOnFeatureClick(f);
                }}
                onKeyDown={(event) => handleOnFeatureKeyPress(event, f)}
                onMouseEnter={
                  !isMobile ? (e) => this.setPreviewFeature(e, f) : null
                }
                onMouseLeave={!isMobile ? this.resetPreview : null}
              >
                <SearchResultsDatasetFeature
                  feature={f}
                  featureTitle={
                    featureTitle.length > 0
                      ? featureTitle
                      : "Visningsfält saknas"
                  }
                  app={app}
                  source={featureCollection.source}
                  origin={featureCollection.origin}
                  visibleInMap={
                    selectedItems.findIndex((item) => item.featureId === f.id) >
                    -1
                  }
                  showClickResultInMap={showClickResultInMap}
                  activeFeature={activeFeature}
                  getOriginBasedIcon={getOriginBasedIcon}
                />
              </ListItem>
            );
          })}
        </List>
        {this.renderSearchResultPreview()}
      </>
    );
  };

  renderDatasetDetails = () => {
    const { activeFeature } = this.props;

    const shouldRenderFeatureDetails =
      // If the user has selected a feature, we should show it's details
      // IF the feature does not have a onClickName, if it does, the details
      // will be taken care of somewhere else.
      activeFeature && !activeFeature.onClickName;

    return shouldRenderFeatureDetails
      ? this.renderFeatureDetails()
      : this.renderFeatureList();
  };

  renderSearchResultPreview = () => {
    const { previewFeature, previewAnchorEl } = this.state;
    const {
      activeFeatureCollection,
      getFeatureTitle,
      showFeaturePreview,
    } = this.props;
    const shouldShowPreview =
      showFeaturePreview && !isMobile && !previewFeature?.onClickName
        ? true
        : false;

    if (shouldShowPreview) {
      return (
        <SearchResultsPreview
          previewFeature={previewFeature}
          activeFeatureCollection={activeFeatureCollection}
          app={this.props.app}
          anchorEl={previewAnchorEl}
          getFeatureTitle={getFeatureTitle}
        />
      );
    } else {
      return null;
    }
  };

  render() {
    return this.renderDatasetDetails();
  }
}

export default withStyles(styles)(SearchResultsDataset);
