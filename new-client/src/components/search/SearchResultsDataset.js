import React from "react";
import { withStyles } from "@material-ui/core/styles";
import {
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
  Button,
  Divider,
  Grid,
} from "@material-ui/core";
import SearchResultsDatasetFeature from "./SearchResultsDatasetFeature";

const styles = (theme) => ({
  datasetContainer: {
    boxShadow: "none",
    overflow: "hidden",
  },
  divider: {
    backgroundColor: "#00000073",
    width: "100%",
  },
  datasetDetailsContainer: {
    padding: 0,
  },
  datasetTable: {
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
});

const TightAccordion = withStyles({
  root: {
    borderTop: "2px solid #dedede",
  },
})(Accordion);

const TightAccordionDetails = withStyles({
  root: {
    padding: 0,
    borderTop: "2px solid #dedede",
    boxShadow: "none",
    "&:before": {
      display: "none",
    },
  },
})(AccordionDetails);

const TightAccordionSummary = withStyles((theme) => ({
  root: {
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
    padding: "0px 10px",
    minHeight: 36,
    "&$expanded": {
      padding: "0px 10px",
      minHeight: 36,
    },
  },
  content: {
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
    //expanded: this.props.sumOfResults === 1,
    showAllInformation: false,
  };

  resultHasOnlyOneFeature = () => {
    const { featureCollection } = this.props;
    return featureCollection.value.features.length === 1;
  };

  renderShowMoreInformationButton = () => {
    const { showAllInformation } = this.state;
    const { classes } = this.props;
    return (
      <Button
        color="primary"
        fullWidth
        className={classes.showMoreInformationButton}
        onClick={(e) => {
          e.stopPropagation();
          this.setState({
            showAllInformation: !this.state.showAllInformation,
          });
        }}
      >
        {showAllInformation ? "Visa mindre" : "Visa mer"}
      </Button>
    );
  };

  renderDatasetDetails = () => {
    const {
      featureCollection,
      handleOnResultClick,
      classes,
      app,
      selectedItems,
    } = this.props;
    const { showAllInformation } = this.state;

    return (
      <TightAccordionDetails
        id={`search-result-dataset-details-${featureCollection.source.id}`}
        className={classes.datasetDetailsContainer}
      >
        <Grid justify="center" container>
          {this.props.expanded &&
            featureCollection.value.features.map((f) => (
              <React.Fragment key={f.id}>
                <Grid
                  role="button"
                  onClick={() => handleOnResultClick(f)}
                  className={classes.datasetTable}
                  container
                  item
                >
                  <Typography variant="srOnly">Aktivera sökresultat</Typography>
                  <Grid item xs={12}>
                    <SearchResultsDatasetFeature
                      feature={f}
                      app={app}
                      showAllInformation={showAllInformation}
                      source={featureCollection.source}
                      visibleInMap={selectedItems.indexOf(f.id) > -1}
                      handleOnResultClick={(feature) => {
                        handleOnResultClick(feature);
                      }}
                    />
                  </Grid>
                </Grid>
                {/*this.renderShowMoreInformationButton()*/}
                {!this.resultHasOnlyOneFeature() && (
                  <Divider className={classes.divider}></Divider>
                )}
              </React.Fragment>
            ))}
        </Grid>
      </TightAccordionDetails>
    );
  };

  renderDatasetSummary = () => {
    const { numberOfResultsToDisplay } = this.state;
    const { featureCollection, getOriginBasedIcon } = this.props;
    const { numberReturned, numberMatched, features } = featureCollection.value;
    const toolTipTitle = numberReturned
      ? `Visar ${numberReturned} av ${numberMatched} resultat`
      : `Visar ${features.length} resultat`;
    return (
      <TightAccordionSummary
        id={`search-result-dataset-${featureCollection.source.id}`}
        aria-controls={`search-result-dataset-details-${featureCollection.source.id}`}
        //expandIcon={<ExpandMoreIcon />}
      >
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
      </TightAccordionSummary>
    );
  };

  renderResultsDataset = () => {
    const {
      classes,
      featureCollection,
      handleFeatureCollectionSelected,
      expanded,
    } = this.props;
    return (
      <>
        <TightAccordion
          className={classes.datasetContainer}
          square
          expanded={expanded}
          TransitionProps={{ timeout: 100 }}
          onChange={() => {
            //this.setState({ expanded: !this.state.expanded });
            handleFeatureCollectionSelected(featureCollection);
          }}
        >
          {this.renderDatasetSummary()}
          {this.renderDatasetDetails()}
        </TightAccordion>
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
