import React from "react";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
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
  datasetSummary: {
    borderTop: "2px solid #dedede",
    borderBottom: "2px solid #dedede",
  },
  datasetContainer: {
    boxShadow: "none",
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

const AccordionDetailsNoPadding = withStyles({
  root: {
    padding: 0,
  },
})(AccordionDetails);

class SearchResultsDataset extends React.PureComponent {
  //Some sources does not return numberMatched and numberReturned, falling back on features.length
  state = {
    numberOfResultsToDisplay: this.props.featureCollection.value.numberMatched
      ? this.props.featureCollection.value.numberMatched >
        this.props.featureCollection.value.numberReturned
        ? `${this.props.featureCollection.value.numberReturned}+`
        : this.props.featureCollection.value.numberReturned
      : this.props.featureCollection.value.features.length,
    expanded: this.props.sumOfResults === 1,
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
    const { featureCollection, handleOnResultClick, classes, app } = this.props;
    const { showAllInformation } = this.state;

    return (
      <AccordionDetailsNoPadding
        id={`search-result-dataset-details-${featureCollection.source.id}`}
        className={classes.datasetDetailsContainer}
      >
        <Grid justify="center" container>
          {this.state.expanded &&
            featureCollection.value.features.map((f) => (
              <React.Fragment key={f.id}>
                <Grid
                  role="button"
                  onClick={handleOnResultClick(f)}
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
                      handleOnResultClick={handleOnResultClick}
                    />
                  </Grid>
                </Grid>
                {this.renderShowMoreInformationButton()}
                {!this.resultHasOnlyOneFeature() && (
                  <Divider className={classes.divider}></Divider>
                )}
              </React.Fragment>
            ))}
        </Grid>
      </AccordionDetailsNoPadding>
    );
  };

  renderDatasetSummary = () => {
    const { numberOfResultsToDisplay } = this.state;
    const { featureCollection, classes, getOriginBasedIcon } = this.props;
    const { numberReturned, numberMatched, features } = featureCollection.value;
    const toolTipTitle = numberReturned
      ? `Visar ${numberReturned} av ${numberMatched} resultat`
      : `Visar ${features.length} resultat`;
    return (
      <AccordionSummary
        id={`search-result-dataset-${featureCollection.source.id}`}
        aria-controls={`search-result-dataset-details-${featureCollection.source.id}`}
        className={classes.datasetSummary}
        expandIcon={<ExpandMoreIcon />}
      >
        <Grid alignItems="center" container>
          <Grid item xs={1}>
            {getOriginBasedIcon(featureCollection.origin)}
          </Grid>
          <Grid item xs={9}>
            <Typography>{featureCollection.source.caption}</Typography>
          </Grid>
          <Grid item xs={2}>
            <Tooltip title={toolTipTitle}>
              <Chip color="primary" label={numberOfResultsToDisplay} />
            </Tooltip>
          </Grid>
        </Grid>
      </AccordionSummary>
    );
  };

  renderResultsDataset = () => {
    const { classes } = this.props;
    return (
      <>
        <Accordion
          className={classes.datasetContainer}
          square
          expanded={this.state.expanded}
          onChange={() => this.setState({ expanded: !this.state.expanded })}
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
