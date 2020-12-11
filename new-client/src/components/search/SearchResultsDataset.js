import React from "react";
import { withStyles } from "@material-ui/core/styles";
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
  datasetTable: {
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
});

const TightAccordionDetails = withStyles((theme) => ({
  root: {
    padding: 0,
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

class SearchResultsDataset extends React.PureComponent {
  //Some sources does not return numberMatched and numberReturned, falling back on features.length
  state = {
    numberOfResultsToDisplay: this.props.featureCollection.value.numberMatched
      ? this.props.featureCollection.value.numberMatched >
        this.props.featureCollection.value.numberReturned
        ? `${this.props.featureCollection.value.numberReturned}+`
        : this.props.featureCollection.value.numberReturned
      : this.props.featureCollection.value.features.length,
    showAllInformation: false,
  };

  resultHasOnlyOneFeature = () => {
    const { featureCollection } = this.props;
    return featureCollection.value.features.length === 1;
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
    } = this.props;

    const features = activeFeature
      ? [activeFeature]
      : featureCollection.value.features;
    return (
      <TightAccordionDetails
        id={`search-result-dataset-details-${featureCollection.source.id}`}
        className={classes.datasetDetailsContainer}
      >
        <Grid justify="center" container>
          {activeFeatureCollection &&
            features.map((f) => (
              <React.Fragment key={f.id}>
                <Grid
                  role="button"
                  onClick={() => handleOnFeatureClick(f)}
                  className={classes.datasetTable}
                  container
                  item
                >
                  <Typography variant="srOnly">Aktivera sökresultat</Typography>
                  <Grid item xs={12}>
                    <SearchResultsDatasetFeature
                      feature={f}
                      app={app}
                      showAllInformation={activeFeature ? true : false}
                      source={featureCollection.source}
                      visibleInMap={selectedItems.indexOf(f.id) > -1}
                      showClickResultInMap={showClickResultInMap}
                      activeFeature={activeFeature}
                    />
                  </Grid>
                </Grid>
                {!this.resultHasOnlyOneFeature() && (
                  <Divider className={classes.divider}></Divider>
                )}
              </React.Fragment>
            ))}
        </Grid>
      </TightAccordionDetails>
    );
  };

  renderDetailsHeader = () => {
    const {
      featureCollection,
      activeFeature,
      resetFeatureAndCollection,
      setActiveFeature,
    } = this.props;
    const numElements = activeFeature ? 3 : 2;
    return (
      <Grid alignItems="center" style={{ maxWidth: "100%" }} container>
        <TightBreadcrumbs
          numelements={numElements}
          aria-label="breadcrumb"
          component="div"
        >
          <Link
            noWrap
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
          <Link
            onClick={(e) => {
              e.stopPropagation();
              setActiveFeature(undefined);
            }}
            noWrap
            component="div"
            variant="button"
          >
            {featureCollection.source.caption}
          </Link>
          {activeFeature && (
            <Link noWrap component="div" variant="button">
              {
                activeFeature.properties[
                  featureCollection.source.displayFields[0]
                ]
              }
            </Link>
          )}
        </TightBreadcrumbs>
      </Grid>
    );
  };

  renderListHeader = () => {
    const { numberOfResultsToDisplay } = this.state;

    const { featureCollection, getOriginBasedIcon } = this.props;
    const { numberReturned, numberMatched, features } = featureCollection.value;
    const toolTipTitle = numberReturned
      ? `Visar ${numberReturned} av ${numberMatched} resultat`
      : `Visar ${features.length} resultat`;
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
      setActiveFeatureCollection,
      activeFeatureCollection,
    } = this.props;
    return (
      <>
        <Accordion
          className={classes.datasetContainer}
          square
          expanded={activeFeatureCollection ? true : false}
          TransitionProps={{ timeout: 100 }}
          onChange={() => {
            setActiveFeatureCollection(featureCollection);
          }}
        >
          {this.renderDatasetSummary()}
          {this.renderDatasetDetails()}
        </Accordion>
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
