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
      "searchResultList.handleFeatureTogglerClicked",
      this.handleFeatureTogglerClicked
    );
  };

  componentWillUnmount = () => {
    const { localObserver } = this.props;
    localObserver.unsubscribe("searchResultList.clearAllSelectedFeatures");
    localObserver.unsubscribe("searchResultList.handleFeatureTogglerClicked");
  };

  componentDidMount = () => {
    const { activeFeature } = this.props;
    //If the search results in exactly one hit (meaning that activeFeature is set on first render),
    // we activate it right a way.
    if (activeFeature) {
      this.handleSingleSearchResult();
    }
  };

  handleFeatureTogglerClicked = (currenAndNextInfo) => {
    const { setActiveFeature, localObserver } = this.props;
    const displayFields = currenAndNextInfo?.source?.displayFields ?? [];
    const currentFeatureIndex = this.getFeatureSelectedIndex(
      currenAndNextInfo.currentFeature
    );
    const nextFeatureIndex = this.getFeatureSelectedIndex(
      currenAndNextInfo.nextFeature
    );
    const selectedItems = [...this.state.selectedItems];

    if (currentFeatureIndex !== -1) {
      selectedItems.splice(currentFeatureIndex, 1);
    }
    if (nextFeatureIndex === -1) {
      selectedItems.push({
        featureId: currenAndNextInfo.nextFeature.id,
        displayFields: displayFields,
      });
    }
    this.setState(
      {
        selectedItems: selectedItems,
      },
      () => {
        if (this.props.width === "xs" || this.props.width === "sm") {
          localObserver.publish("minimizeSearchResultList");
        }
        localObserver.publish(
          "map.highlightFeaturesByIds",
          this.state.selectedItems
        );
        localObserver.publish(
          "map.zoomToFeaturesByIds",
          this.state.selectedItems
        );
        setActiveFeature(currenAndNextInfo.nextFeature);
      }
    );
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
    return this.state.selectedItems.findIndex(
      (item) => item.featureId === feature.id
    );
  };

  showClickResultInMap = (feature, source) => {
    const { localObserver } = this.props;
    const currentIndex = this.getFeatureSelectedIndex(feature);

    const selectedItems = [...this.state.selectedItems];
    const displayFields = source.displayFields ? source.displayFields : [];

    if (currentIndex === -1) {
      selectedItems.push({
        featureId: feature.id,
        displayFields: displayFields,
      });
    } else {
      selectedItems.splice(currentIndex, 1);
    }

    this.setState(
      {
        selectedItems: selectedItems,
      },
      () => {
        if (this.props.width === "xs" || this.props.width === "sm") {
          localObserver.publish("minimizeSearchResultList");
        }
        localObserver.publish(
          "map.highlightFeaturesByIds",
          this.state.selectedItems
        );
        localObserver.publish(
          "map.zoomToFeaturesByIds",
          this.state.selectedItems
        );
      }
    );
  };

  handleOnFeatureClick = (feature) => {
    const { app, setActiveFeature, activeFeatureCollection } = this.props;
    if (feature.onClickName) {
      app.globalObserver.publish(
        `search.featureClicked.${feature.onClickName}`,
        feature
      );
    } else {
      setActiveFeature(feature);
      if (this.getFeatureSelectedIndex(feature) === -1) {
        this.showClickResultInMap(feature, activeFeatureCollection.source);
      }
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

  render() {
    const {
      featureCollections,
      getOriginBasedIcon,
      app,
      classes,
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
      <Grid container alignItems="center" justify="center">
        <Grid container item>
          {featureCollections.map((featureCollection) => (
            <Grid
              key={featureCollection.source.id}
              role="button"
              xs={12}
              className={
                activeFeature ? null : classes.searchResultDatasetWrapper
              }
              item
            >
              <SearchResultsDataset
                app={app}
                featureCollection={featureCollection}
                getOriginBasedIcon={getOriginBasedIcon}
                selectedItems={this.state.selectedItems}
                showClickResultInMap={this.showClickResultInMap}
                activeFeatureCollection={activeFeatureCollection}
                activeFeature={activeFeature}
                handleFeatureCollectionClick={handleFeatureCollectionClick}
                setActiveFeature={setActiveFeature}
                handleOnFeatureClick={this.handleOnFeatureClick}
                resetFeatureAndCollection={resetFeatureAndCollection}
                featureFilter={featureFilter}
                featureSortingStrategy={featureSortingStrategy}
                showFeaturePreview={showFeaturePreview}
                getFeatureTitle={getFeatureTitle}
                localObserver={localObserver}
              />
            </Grid>
          ))}
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles)(withWidth()(SearchResultsList));
