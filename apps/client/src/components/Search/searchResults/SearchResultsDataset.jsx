import React from "react";
import { isMobile } from "../../../utils/IsMobile";
import { List, ListItem } from "@mui/material";
import SearchResultsDatasetFeature from "./SearchResultsDatasetFeature";
import SearchResultsDatasetFeatureDetails from "./SearchResultsDatasetFeatureDetails";
import SearchResultsPreview from "./SearchResultsPreview";
import { styled } from "@mui/material/styles";

const StyledList = styled(List)(() => ({
  padding: 0,
  width: "100%",
  transition: "none",
}));

const StyledListItem = styled(ListItem)(() => ({
  width: "100%",
  display: "flex",
  padding: 0,
  transition: "none",
}));

class SearchResultsDataset extends React.Component {
  //Some sources does not return numberMatched and numberReturned, falling back on features.length
  state = {
    previewFeature: null, // Feature to show in preview
    previewAnchorEl: null, // The element which the preview popper will anchor to
  };

  delayBeforeShowingPreview = 800; //Delay before showing preview popper in ms
  previewTimer = null; // Timer to keep track of when delay has passed

  shouldComponentUpdate = (prevProps) => {
    const { featureFilter, featureCollection } = this.props;
    const prevFeatureFilter = prevProps.featureFilter;
    const numFeatures = featureCollection.value.features.length;
    const prevNumFeatures = prevProps.featureCollection.value.features.length;
    if (
      featureFilter !== prevFeatureFilter ||
      numFeatures !== prevNumFeatures
    ) {
      clearTimeout(this.previewTimer);
      this.setState({ previewAnchorEl: undefined, previewFeature: undefined });
      return false;
    }
    return true;
  };

  componentWillUnmount = () => {
    clearTimeout(this.previewTimer);
  };

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
    const { featureFilter } = this.props;
    const featureCollection = { ...this.props.featureCollection };
    // If user has a value in the filter input...
    if (featureFilter.length > 0) {
      // Filter all features in the collection
      const filteredFeatures = featureCollection.value.features.filter(
        (feature) => {
          // Returning the features having a title including
          // the filter string
          return feature.featureTitle
            .toLowerCase()
            .includes(featureFilter.toLowerCase());
        }
      );
      return filteredFeatures ?? [];
    }
    // Filter length is zero? Return all features
    return featureCollection.value.features ?? [];
  };

  getSortedFeatures = (features) => {
    const { featureSortingStrategy } = this.props;

    const featuresAtoZSorted = features.sort((a, b) =>
      a.featureTitle.localeCompare(b.featureTitle, undefined, {
        numeric: true, // Ensure that 1 < 2 < 10
      })
    );

    switch (featureSortingStrategy) {
      case "ZtoA":
        return featuresAtoZSorted.reverse();
      default:
        // AtoZ
        return featuresAtoZSorted;
    }
  };

  renderFeatureDetails = (features) => {
    const {
      featureCollection,
      app,
      activeFeatureCollection,
      activeFeature,
      localObserver,
      setActiveFeature,
      enableFeatureToggler,
    } = this.props;
    return (
      <SearchResultsDatasetFeatureDetails
        feature={activeFeature}
        features={features}
        setActiveFeature={setActiveFeature}
        featureCollection={featureCollection}
        app={app}
        source={activeFeatureCollection.source}
        localObserver={localObserver}
        enableFeatureToggler={enableFeatureToggler}
      />
    );
  };

  renderFeatureList = (features) => {
    const {
      featureCollection,
      app,
      selectedFeatures,
      activeFeature,
      handleOnFeatureClick,
      handleOnFeatureKeyPress,
      getOriginBasedIcon,
      addFeatureToSelected,
      removeFeatureFromSelected,
      shouldRenderSelectedCollection,
    } = this.props;

    const sortedFeatures = this.getSortedFeatures(features);
    return (
      <>
        <StyledList
          id={`search-result-dataset-details-${featureCollection.source.id}`}
        >
          {sortedFeatures.map((f) => {
            return (
              <StyledListItem
                disableTouchRipple
                key={f.getId()}
                divider
                button
                onClick={() => {
                  this.resetPreview();
                  handleOnFeatureClick(f);
                }}
                onKeyDown={(event) => handleOnFeatureKeyPress(event, f)}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    this.props.localObserver.publish(
                      "map.setHighLightedStyle",
                      f
                    );
                    this.setPreviewFeature(e, f);
                  }
                }}
                onMouseLeave={() => {
                  if (!isMobile) {
                    // Create a list of ol_uids of selected features
                    const selectedOlUids = this.props.selectedFeatures.map(
                      (f) => f.feature.ol_uid
                    );
                    // Check if the current feature is in the list of selected features
                    if (selectedOlUids.includes(f.ol_uid)) {
                      // If so, reset the style to "selection" style for that feature…
                      this.props.localObserver.publish(
                        "map.setSelectedFeatureStyle",
                        f
                      );
                    } else {
                      // …else, remove the styling entirely (fallback to default OL)
                      f.setStyle(null);
                    }
                    this.resetPreview();
                  }
                }}
              >
                <SearchResultsDatasetFeature
                  feature={f}
                  app={app}
                  source={featureCollection.source}
                  origin={featureCollection.origin}
                  visibleInMap={
                    selectedFeatures.findIndex(
                      (item) => item.feature.getId() === f.getId()
                    ) > -1
                  }
                  addFeatureToSelected={addFeatureToSelected}
                  removeFeatureFromSelected={removeFeatureFromSelected}
                  activeFeature={activeFeature}
                  getOriginBasedIcon={getOriginBasedIcon}
                  shouldRenderSelectedCollection={
                    shouldRenderSelectedCollection
                  }
                />
              </StyledListItem>
            );
          })}
        </StyledList>
        {this.renderSearchResultPreview()}
      </>
    );
  };

  renderDatasetDetails = () => {
    const { activeFeature } = this.props;

    // If the user has selected a feature, we should show its details
    // if the feature does not have a onClickName. If it does, the details
    // will be taken care of somewhere else.
    const shouldRenderFeatureDetails =
      activeFeature && !activeFeature.onClickName;

    const features = this.getFilteredFeatures();

    return shouldRenderFeatureDetails
      ? this.renderFeatureDetails(features)
      : this.renderFeatureList(features);
  };

  renderSearchResultPreview = () => {
    const { previewFeature, previewAnchorEl } = this.state;
    const { activeFeatureCollection, enableFeaturePreview } = this.props;
    const shouldShowPreview =
      enableFeaturePreview && !isMobile && !previewFeature?.onClickName
        ? true
        : false;

    if (shouldShowPreview) {
      return (
        <SearchResultsPreview
          previewFeature={previewFeature}
          activeFeatureCollection={activeFeatureCollection}
          app={this.props.app}
          anchorEl={previewAnchorEl}
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

export default SearchResultsDataset;
