import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { isMobile } from "../../utils/IsMobile";
import {
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
  Divider,
  Grid,
} from "@material-ui/core";
import SearchResultsDatasetFeature from "./SearchResultsDatasetFeature";
import SearchResultsDatasetFeatureDetails from "./SearchResultsDatasetFeatureDetails";
import SearchResultsPreview from "./SearchResultsPreview";
import Breadcrumbs from "@material-ui/core/Breadcrumbs";
import Link from "@material-ui/core/Link";

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
});

const TightAccordionSummary = withStyles((theme) => ({
  root: {
    borderTop: `${theme.spacing(0.1)}px solid ${theme.palette.divider}`,
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
    padding: "0px 10px",
    minHeight: 36,
    "&$expanded": {
      padding: "0px 10px",
      minHeight: 36,
      backgroundColor: theme.palette.action.selected,
    },
  },
  content: {
    maxWidth: "100%",
    margin: "5px 0",
    "&$expanded": {
      margin: "5px 0",
    },
  },
  expanded: {},
}))(AccordionSummary);

const TightAccordionDetails = withStyles((theme) => ({
  root: {
    padding: 0,
    cursor: "default",
    borderTop: `${theme.spacing(0.1)}px solid ${theme.palette.divider}`,
    boxShadow: "none",
    "&:before": {
      display: "none",
    },
  },
}))(AccordionDetails);

const TightBreadcrumbs = withStyles({
  root: {
    width: "100%",
    display: "inline-block",
  },
  ol: {
    width: "100%",
  },
  li: {
    display: "flex",
    maxWidth: (props) => (props.numelements > 2 ? "35%" : "90%"),
  },
})(Breadcrumbs);

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

  getFeatureTitle = (feature) => {
    const { activeFeatureCollection } = this.props;

    return activeFeatureCollection.source.displayFields.reduce(
      (featureTitleString, df) => {
        let displayField = feature.properties[df];
        if (Array.isArray(displayField)) {
          displayField = displayField.join(", ");
        }

        if (displayField) {
          if (featureTitleString.length > 0) {
            featureTitleString = featureTitleString.concat(
              ` | ${displayField}`
            );
          } else {
            featureTitleString = displayField;
          }
        }

        return featureTitleString;
      },
      ""
    );
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
          const featureTitle = this.getFeatureTitle(feature);
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
    const { featureSortingStrategy } = this.props;

    const featuresAtoZSorted = features.sort((a, b) =>
      this.getFeatureTitle(a).localeCompare(this.getFeatureTitle(b), "sv")
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
      getOriginBasedIcon,
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
        <TightAccordionDetails
          id={`search-result-dataset-details-${featureCollection.source.id}`}
          className={classes.datasetDetailsContainer}
        >
          <SearchResultsDatasetFeatureDetails
            feature={activeFeature}
            featureTitle={this.getFeatureTitle(activeFeature)}
            app={app}
            source={activeFeatureCollection.source}
          />
        </TightAccordionDetails>
      );
    } else {
      return (
        <TightAccordionDetails
          id={`search-result-dataset-details-${featureCollection.source.id}`}
          className={classes.datasetDetailsContainer}
        >
          <Grid justify="center" container>
            {sortedFeatures.map((f) => {
              const featureTitle = this.getFeatureTitle(f);
              if (featureTitle.length > 0) {
                return (
                  <React.Fragment key={f.id}>
                    <Grid
                      role="button"
                      onClick={() => {
                        this.resetPreview();
                        handleOnFeatureClick(f);
                      }}
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
                        featureTitle={this.getFeatureTitle(f)}
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
        </TightAccordionDetails>
      );
    }
  };

  renderDetailsHeader = () => {
    const {
      activeFeatureCollection,
      activeFeature,
      resetFeatureAndCollection,
      setActiveFeature,
    } = this.props;
    const shouldRenderFeatureDetails =
      activeFeature && !activeFeature.onClickName;
    const numElements = shouldRenderFeatureDetails ? 3 : 2;
    return (
      <Grid alignItems="center" style={{ maxWidth: "100%" }} container>
        <TightBreadcrumbs
          numelements={numElements}
          aria-label="breadcrumb"
          component="div"
        >
          <Tooltip title="Tillbaka till alla sökresultat">
            <Link
              noWrap
              color="textPrimary"
              component="div"
              onClick={(e) => {
                e.stopPropagation();
                resetFeatureAndCollection();
              }}
              onChange={resetFeatureAndCollection}
              variant="button"
            >
              Start
            </Link>
          </Tooltip>
          <Tooltip title={activeFeatureCollection.source.caption}>
            <Link
              onClick={(e) => {
                e.stopPropagation();
                setActiveFeature(undefined);
              }}
              noWrap
              color="textPrimary"
              component="div"
              variant="button"
            >
              {activeFeatureCollection.source.caption}
            </Link>
          </Tooltip>
          {shouldRenderFeatureDetails && (
            <Tooltip title={this.getFeatureTitle(activeFeature)}>
              <Link noWrap color="textPrimary" component="div" variant="button">
                {this.getFeatureTitle(activeFeature)}
              </Link>
            </Tooltip>
          )}
        </TightBreadcrumbs>
      </Grid>
    );
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
          <Typography variant="button">
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

    return (
      <TightAccordionSummary
        id={`search-result-dataset-${featureCollection.source.id}`}
        aria-controls={`search-result-dataset-details-${featureCollection.source.id}`}
      >
        {activeFeatureCollection
          ? this.renderDetailsHeader()
          : this.renderListHeader()}
      </TightAccordionSummary>
    );
  };

  renderResultsDataset = () => {
    const {
      classes,
      featureCollection,
      activeFeatureCollection,
      handleFeatureCollectionClick,
      showFeaturePreview,
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
            getFeatureTitle={this.getFeatureTitle}
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
