import React from "react";
import { List, ListItem } from "@mui/material";
import SearchResultsDataset from "./SearchResultsDataset";
import SearchResultsDatasetSummary from "./SearchResultsDatasetSummary";
import { useTheme } from "@mui/material";
import { useMediaQuery } from "@mui/material";
import { styled } from "@mui/material/styles";

// A HOC that pipes isMobile to the children. See this as a proposed
// solution. It is not pretty, but if we move this to a separate file
// we could use this HOC instead of the isMobile helper function in ../../utils/.
// TODO: Move to some /hooks folder
const withIsMobile = () => (WrappedComponent) => (props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return <WrappedComponent {...props} isMobile={isMobile} />;
};

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

class SearchResultsList extends React.PureComponent {
  componentDidMount = () => {
    const { activeFeature } = this.props;
    //If the search results in exactly one hit (meaning that activeFeature is set on first render),
    // we activate it right a way.
    if (activeFeature) {
      this.handleSingleSearchResult();
    }
  };

  handleSingleSearchResult = () => {
    const {
      app,
      activeFeature,
      activeFeatureCollection,
      localObserver,
      getFeatureTitle,
      addFeatureToSelected,
    } = this.props;

    if (activeFeature.onClickName) {
      app.globalObserver.publish(
        `search.featureClicked.${activeFeature.onClickName}`,
        activeFeature
      );
    } else {
      const source = activeFeatureCollection?.source;
      const featureTitle = getFeatureTitle(activeFeature, source);

      activeFeature.source = source;
      activeFeature.featureTitle = featureTitle;
      addFeatureToSelected({
        feature: activeFeature,
        sourceId: source?.id,
        featureTitle: featureTitle,
        initiator: "showDetails",
      });
      if (this.props.isMobile) {
        localObserver.publish("minimizeSearchResultList");
      }
      localObserver.publish("map.addAndHighlightFeatureInSearchResultLayer", {
        feature: activeFeature,
        featureTitle: featureTitle,
      });
    }
  };

  handleOnFeatureClick = (feature) => {
    const { app, setActiveFeature } = this.props;
    if (feature.onClickName) {
      app.globalObserver.publish(
        `search.featureClicked.${feature.onClickName}`,
        feature
      );
    } else {
      setActiveFeature(feature);
    }
  };

  handleOnFeatureKeyPress = (event, feature) => {
    if (event.which === 13 || event.keyCode === 13) {
      this.handleOnFeatureClick(feature);
    }
  };

  renderSearchResultDatasetSummary = (featureCollection) => {
    const { getOriginBasedIcon } = this.props;
    return (
      <SearchResultsDatasetSummary
        featureCollection={featureCollection}
        getOriginBasedIcon={getOriginBasedIcon}
        maxResultsPerDataset={this.props.options.maxResultsPerDataset ?? 100}
        showResultsLimitReachedWarning={
          this.props.options.showResultsLimitReachedWarning ?? true
        }
      />
    );
  };

  renderSearchResultDataset = (featureCollection) => {
    const {
      getOriginBasedIcon,
      app,
      activeFeatureCollection,
      activeFeature,
      setActiveFeature,
      handleFeatureCollectionClick,
      featureFilter,
      featureSortingStrategy,
      enableFeaturePreview,
      getFeatureTitle,
      localObserver,
      enableFeatureToggler,
      selectedFeatures,
      addFeatureToSelected,
      removeFeatureFromSelected,
      shouldRenderSelectedCollection,
    } = this.props;
    return (
      <SearchResultsDataset
        app={app}
        featureCollection={featureCollection}
        getOriginBasedIcon={getOriginBasedIcon}
        selectedFeatures={selectedFeatures}
        activeFeatureCollection={activeFeatureCollection}
        activeFeature={activeFeature}
        handleFeatureCollectionClick={handleFeatureCollectionClick}
        setActiveFeature={setActiveFeature}
        handleOnFeatureClick={this.handleOnFeatureClick}
        handleOnFeatureKeyPress={this.handleOnFeatureKeyPress}
        featureFilter={featureFilter}
        featureSortingStrategy={featureSortingStrategy}
        enableFeaturePreview={enableFeaturePreview}
        getFeatureTitle={getFeatureTitle}
        localObserver={localObserver}
        enableFeatureToggler={enableFeatureToggler}
        addFeatureToSelected={addFeatureToSelected}
        removeFeatureFromSelected={removeFeatureFromSelected}
        shouldRenderSelectedCollection={shouldRenderSelectedCollection}
      />
    );
  };

  renderSearchResultList = () => {
    const { featureCollections, handleFeatureCollectionClick } = this.props;
    return (
      <StyledList>
        {featureCollections.map((featureCollection) => (
          <StyledListItem
            disableTouchRipple
            key={featureCollection.source.id}
            id={`search-result-dataset-${featureCollection.source.id}`}
            aria-controls={`search-result-dataset-details-${featureCollection.source.id}`}
            onClick={() => handleFeatureCollectionClick(featureCollection)}
            button
            divider
          >
            {this.renderSearchResultDatasetSummary(featureCollection)}
          </StyledListItem>
        ))}
      </StyledList>
    );
  };

  render() {
    const { activeFeatureCollection } = this.props;

    return activeFeatureCollection
      ? this.renderSearchResultDataset(activeFeatureCollection)
      : this.renderSearchResultList();
  }
}

export default withIsMobile()(SearchResultsList);
