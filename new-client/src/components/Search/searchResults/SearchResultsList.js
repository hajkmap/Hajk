import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withWidth, List, ListItem } from "@material-ui/core";
import SearchResultsDataset from "./SearchResultsDataset";
import SearchResultsDatasetSummary from "./SearchResultsDatasetSummary";

const styles = () => ({
  searchResultList: {
    padding: 0,
    width: "100%",
    transition: "none",
  },
  searchResultListItem: {
    width: "100%",
    display: "flex",
    padding: 0,
    transition: "none",
  },
});

class SearchResultsList extends React.PureComponent {
  constructor(props) {
    super(props);
    this.bindSubscriptions();
  }

  state = {
    selectedItems: [],
  };

  bindSubscriptions = () => {
    const { localObserver } = this.props;
    localObserver.subscribe(
      "searchResultList.clearAllSelectedFeatures",
      this.clearAllSelectedFeatures
    );
    localObserver.subscribe(
      "searchResultList.handleActiveFeatureChange",
      this.handleActiveFeatureChange
    );
  };

  componentWillUnmount = () => {
    const { localObserver } = this.props;
    localObserver.unsubscribe("searchResultList.clearAllSelectedFeatures");
    localObserver.unsubscribe("searchResultList.handleActiveFeatureChange");
  };

  componentDidMount = () => {
    const { activeFeature } = this.props;
    //If the search results in exactly one hit (meaning that activeFeature is set on first render),
    // we activate it right a way.
    if (activeFeature) {
      this.handleSingleSearchResult();
    }
  };

  shouldRemoveSelectionFromCurrent = (currentFeatureIndex) => {
    const { selectedItems } = this.state;
    if (currentFeatureIndex === -1) {
      return false;
    }
    const selectedItem = selectedItems[currentFeatureIndex];
    return selectedItem?.from !== "userSelect";
  };

  handleSingleSearchResult = () => {
    const {
      app,
      activeFeature,
      activeFeatureCollection,
      localObserver,
    } = this.props;

    if (activeFeature.onClickName) {
      app.globalObserver.publish(
        `search.featureClicked.${activeFeature.onClickName}`,
        activeFeature
      );
    } else {
      const selectedItems = [];
      const source = activeFeatureCollection?.source;
      const displayFields = source?.displayFields ? source.displayFields : [];
      selectedItems.push({
        featureId: activeFeature.id,
        displayFields: displayFields,
        from: "showDetails",
      });
      this.setState(
        {
          selectedItems: selectedItems,
        },
        () => {
          if (this.props.width === "xs" || this.props.width === "sm") {
            localObserver.publish("minimizeSearchResultList");
          }
          localObserver.publish(
            "map.addAndHighlightFeatureInSearchResultLayer",
            {
              feature: activeFeature,
              displayFields: displayFields,
            }
          );
        }
      );
    }
  };

  getFeatureSelectedIndex = (feature) => {
    return !feature
      ? -1
      : this.state.selectedItems.findIndex(
          (item) => item.featureId === feature.id
        );
  };

  handleFeatureSelectionToggled = (feature, source) => {
    const { localObserver } = this.props;
    const currentIndex = this.getFeatureSelectedIndex(feature);
    const selectedItems = [...this.state.selectedItems];

    if (currentIndex !== -1) {
      selectedItems.splice(currentIndex, 1);
    } else {
      const displayFields = source.displayFields ? source.displayFields : [];
      selectedItems.push({
        featureId: feature.id,
        displayFields: displayFields,
        from: "userSelect",
      });
    }

    this.setState({ selectedItems: selectedItems });
    localObserver.publish("map.highlightFeaturesByIds", selectedItems);
    localObserver.publish("map.zoomToFeaturesByIds", selectedItems);
  };

  handleActiveFeatureChange = (update) => {
    const { currentFeature, nextFeature, nextSource, initiator } = update;
    const { localObserver } = this.props;
    const shouldZoomToFeature = initiator !== "infoClick";

    if (!nextFeature) {
      return this.handleCurrentFeatureReset(currentFeature);
    }

    const selectedItems = this.removeCurrentAndAddNextToSelection(
      currentFeature,
      nextFeature,
      nextSource
    );

    this.setState({ selectedItems: selectedItems });
    if (shouldZoomToFeature) {
      localObserver.publish("map.zoomToFeaturesByIds", [
        selectedItems[selectedItems.length - 1],
      ]);
    }
    localObserver.publish("map.highlightFeaturesByIds", selectedItems);
  };

  removeCurrentAndAddNextToSelection = (
    currentFeature,
    nextFeature,
    nextSource
  ) => {
    const selectedItems = [...this.state.selectedItems];
    const currentIndex = this.getFeatureSelectedIndex(currentFeature);
    const displayFields = nextSource?.displayFields
      ? nextSource.displayFields
      : [];

    if (this.currentAndNextFeatureIsSame(currentFeature, nextFeature)) {
      return selectedItems;
    }
    if (this.shouldRemoveCurrentFromSelection(currentIndex)) {
      selectedItems.splice(currentIndex, 1);
    }
    if (this.shouldAddNextToCollection(nextFeature)) {
      selectedItems.push({
        featureId: nextFeature.id,
        displayFields: displayFields,
        from: "showDetails",
      });
    }
    return selectedItems;
  };

  currentAndNextFeatureIsSame = (currentFeature, nextFeature) => {
    const currentIndex = this.getFeatureSelectedIndex(currentFeature);
    const nextIndex = this.getFeatureSelectedIndex(nextFeature);
    return nextIndex !== -1 && currentIndex === nextIndex;
  };

  shouldAddNextToCollection = (nextFeature) => {
    const nextIndex = this.getFeatureSelectedIndex(nextFeature);
    return nextFeature && nextIndex === -1;
  };

  shouldRemoveCurrentFromSelection = (currentIndex) => {
    const { selectedItems } = this.state;
    return (
      currentIndex !== -1 && selectedItems[currentIndex].from !== "userSelect"
    );
  };

  handleCurrentFeatureReset = (currentFeature) => {
    const { localObserver } = this.props;
    const currentFeatureIndex = this.getFeatureSelectedIndex(currentFeature);
    const selectedItems = [...this.state.selectedItems];
    if (this.shouldRemoveCurrentFromSelection(currentFeatureIndex)) {
      selectedItems.splice(currentFeatureIndex, 1);
    }
    this.setState({ selectedItems: selectedItems });
    localObserver.publish("map.highlightFeaturesByIds", selectedItems);
    localObserver.publish("map.zoomToFeaturesByIds", selectedItems);
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

  clearAllSelectedFeatures = () => {
    const { localObserver } = this.props;
    const selectedItems = [];
    // Remove all selected items from array, then publish to
    // mapViewModel to reset style (clearing highlight).
    this.setState({ selectedItems: selectedItems }, () => {
      localObserver.publish("map.resetStyleForFeaturesInResultSource");
    });
  };

  renderSearchResultDatasetSummary = (featureCollection) => {
    const { getOriginBasedIcon } = this.props;
    return (
      <SearchResultsDatasetSummary
        featureCollection={featureCollection}
        getOriginBasedIcon={getOriginBasedIcon}
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
      resetFeatureAndCollection,
      handleFeatureCollectionClick,
      featureFilter,
      featureSortingStrategy,
      showFeaturePreview,
      getFeatureTitle,
      localObserver,
    } = this.props;
    return (
      <SearchResultsDataset
        app={app}
        featureCollection={featureCollection}
        getOriginBasedIcon={getOriginBasedIcon}
        selectedItems={this.state.selectedItems}
        handleFeatureSelectionToggled={this.handleFeatureSelectionToggled}
        activeFeatureCollection={activeFeatureCollection}
        activeFeature={activeFeature}
        handleFeatureCollectionClick={handleFeatureCollectionClick}
        setActiveFeature={setActiveFeature}
        handleOnFeatureClick={this.handleOnFeatureClick}
        handleOnFeatureKeyPress={this.handleOnFeatureKeyPress}
        resetFeatureAndCollection={resetFeatureAndCollection}
        featureFilter={featureFilter}
        featureSortingStrategy={featureSortingStrategy}
        showFeaturePreview={showFeaturePreview}
        getFeatureTitle={getFeatureTitle}
        localObserver={localObserver}
      />
    );
  };

  renderSearchResultList = () => {
    const {
      featureCollections,
      classes,
      handleFeatureCollectionClick,
    } = this.props;
    return (
      <List className={classes.searchResultList}>
        {featureCollections.map((featureCollection) => (
          <ListItem
            disableTouchRipple
            key={featureCollection.source.id}
            className={classes.searchResultListItem}
            id={`search-result-dataset-${featureCollection.source.id}`}
            aria-controls={`search-result-dataset-details-${featureCollection.source.id}`}
            onClick={() => handleFeatureCollectionClick(featureCollection)}
            button
            divider
          >
            {this.renderSearchResultDatasetSummary(featureCollection)}
          </ListItem>
        ))}
      </List>
    );
  };

  render() {
    const { activeFeatureCollection } = this.props;

    return activeFeatureCollection
      ? this.renderSearchResultDataset(activeFeatureCollection)
      : this.renderSearchResultList();
  }
}

export default withStyles(styles)(withWidth()(SearchResultsList));
