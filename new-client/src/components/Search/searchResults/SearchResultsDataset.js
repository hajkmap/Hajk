import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { isMobile } from "../../../utils/IsMobile";
import {
  Typography,
  Accordion,
  AccordionSummary,
  Chip,
  Tooltip,
  Divider,
  Grid,
} from "@material-ui/core";
import SearchResultsDatasetFeature from "./SearchResultsDatasetFeature";
import SearchResultsDatasetFeatureDetails from "./SearchResultsDatasetFeatureDetails";
import SearchResultsPreview from "./SearchResultsPreview";

const styles = (theme) => ({
  datasetContainer: {
    boxShadow: "none",
    overflow: "hidden",
  },
  divider: {
    backgroundColor: theme.palette.divider,
    width: "100%",
  },
  datasetDetailsContainer: {
    padding: 0,
  },
  hover: {
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  datasetFeaturesContainer: {
    borderTop: `${theme.spacing(0.1)}px solid ${theme.palette.divider}`,
  },
});

const TightAccordionSummary = withStyles((theme) => ({
  root: {
    borderTop: `${theme.spacing(0.1)}px solid ${theme.palette.divider}`,
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
    padding: `${theme.spacing(0)}px ${theme.spacing(1)}px`,
    minHeight: 42,
    "&$expanded": {
      padding: "0px 10px",
      minHeight: 42,
      backgroundColor: theme.palette.action.selected,
    },
  },
  content: {
    maxWidth: "100%",
    margin: "0 0",
    "&$expanded": {
      margin: "0 0",
    },
  },
  expanded: {},
}))(AccordionSummary);

class SearchResultsDataset extends React.PureComponent {
  //Some sources does not return numberMatched and numberReturned, falling back on features.length
  state = {
    numberOfResultsToDisplay: this.props.featureCollection.value.features
      .length,
    previewFeature: undefined, // Feature to show in preview
    popOverAnchorEl: undefined, // The element which the preview popper will anchor to
  };

  delayBeforeShowingPreview = 800; //Delay before showing preview popper in ms
  previewTimer = null; // Timer to keep track of when delay has passed

  resultHasOnlyOneFeature = () => {
    const { featureCollection } = this.props;
    return featureCollection.value.features.length === 1;
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

  renderDatasetDetails = () => {
    const {
      featureCollection,
      classes,
      app,
      selectedItems,
      showClickResultInMap,
      activeFeatureCollection,
      activeFeature,
      handleOnFeatureClick,
      handleOnFeatureKeyPress,
      getOriginBasedIcon,
      getFeatureTitle,
      localObserver,
    } = this.props;

    const shouldRenderFeatureDetails =
      // If the user has selected a feature, we should show it's details
      // IF the feature does not have a onClickName, if it does, the details
      // will be taken care of somewhere else.
      activeFeature && !activeFeature.onClickName;

    const features = this.getFilteredFeatures();
    const sortedFeatures = this.getSortedFeatures(features);

    if (shouldRenderFeatureDetails) {
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
    } else {
      return (
        <Grid
          justify="center"
          container
          className={classes.datasetFeaturesContainer}
        >
          {sortedFeatures.map((f) => {
            const featureTitle = getFeatureTitle(f);
            if (featureTitle.length > 0) {
              return (
                <React.Fragment key={f.id}>
                  <Grid
                    role="button"
                    onClick={() => {
                      this.resetPreview();
                      handleOnFeatureClick(f);
                    }}
                    tabIndex={0}
                    onKeyDown={(event) => handleOnFeatureKeyPress(event, f)}
                    className={classes.hover}
                    onMouseEnter={
                      !isMobile ? (e) => this.setPreviewFeature(e, f) : null
                    }
                    onMouseLeave={!isMobile ? this.resetPreview : null}
                    container
                    item
                  >
                    {
                      <Typography variant="srOnly">
                        Aktivera sökresultat
                      </Typography>
                    }
                    <SearchResultsDatasetFeature
                      feature={f}
                      featureTitle={getFeatureTitle(f)}
                      app={app}
                      source={featureCollection.source}
                      origin={featureCollection.origin}
                      visibleInMap={
                        selectedItems.findIndex(
                          (item) => item.featureId === f.id
                        ) > -1
                      }
                      showClickResultInMap={showClickResultInMap}
                      activeFeature={activeFeature}
                      getOriginBasedIcon={getOriginBasedIcon}
                    />
                  </Grid>
                  {!this.resultHasOnlyOneFeature() && (
                    <Divider className={classes.divider}></Divider>
                  )}
                </React.Fragment>
              );
            } else {
              return null;
            }
          })}
        </Grid>
      );
    }
  };

  renderListHeader = () => {
    const { numberOfResultsToDisplay } = this.state;

    const { featureCollection, getOriginBasedIcon } = this.props;
    const toolTipTitle = `Visar ${numberOfResultsToDisplay} resultat`;
    return (
      <Grid alignItems="center" container>
        <Grid item xs={1}>
          {getOriginBasedIcon(featureCollection.origin)}
        </Grid>
        <Grid item xs={9}>
          <Typography
            noWrap
            variant="button"
            component="div" // The noWrap does not work on variant="button" without changing component
            style={{ maxWidth: "100%" }}
          >
            {featureCollection.source.caption}
          </Typography>
        </Grid>
        <Grid container item justify="flex-end" xs={2}>
          <Tooltip title={toolTipTitle}>
            <Chip
              size="small"
              color="default"
              label={numberOfResultsToDisplay}
            />
          </Tooltip>
        </Grid>
      </Grid>
    );
  };

  renderDatasetSummary = () => {
    const { activeFeatureCollection, featureCollection } = this.props;

    if (!activeFeatureCollection) {
      return (
        <TightAccordionSummary
          id={`search-result-dataset-${featureCollection.source.id}`}
          aria-controls={`search-result-dataset-details-${featureCollection.source.id}`}
        >
          {this.renderListHeader()}
        </TightAccordionSummary>
      );
    } else {
      return null;
    }
  };

  renderResultsDataset = () => {
    const {
      classes,
      featureCollection,
      activeFeatureCollection,
      handleFeatureCollectionClick,
      showFeaturePreview,
      getFeatureTitle,
    } = this.props;
    const { previewFeature, previewAnchorEl } = this.state;
    const shouldShowPreview =
      showFeaturePreview && !isMobile && !previewFeature?.onClickName
        ? true
        : false;
    return (
      <>
        <Accordion
          className={classes.datasetContainer}
          square
          expanded={activeFeatureCollection ? true : false}
          TransitionProps={{ timeout: 100 }}
          onChange={() => {
            handleFeatureCollectionClick(featureCollection);
          }}
        >
          {this.renderDatasetSummary()}
          {activeFeatureCollection && this.renderDatasetDetails()}
        </Accordion>
        {shouldShowPreview && (
          <SearchResultsPreview
            {...this.props}
            previewFeature={previewFeature}
            anchorEl={previewAnchorEl}
            getFeatureTitle={getFeatureTitle}
          />
        )}
      </>
    );
  };

  render() {
    const { numberOfResultsToDisplay } = this.state;
    return parseInt(numberOfResultsToDisplay) > 0
      ? this.renderResultsDataset()
      : null;
  }
}

export default withStyles(styles)(SearchResultsDataset);
