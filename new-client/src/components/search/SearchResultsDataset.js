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
  Grid
} from "@material-ui/core";
import SearchResultsDatasetFeature from "./SearchResultsDatasetFeature";

const styles = theme => ({
  datasetSummary: {
    backgroundColor: "#f2f2f2",
    borderTop: "2px solid #dedede",
    borderBottom: "2px solid #dedede"
  },
  datasetContainer: {
    boxShadow: "none"
  },
  divider: {
    backgroundColor: "#00000073",
    width: "100%"
  },
  datasetDetailsContainer: {
    padding: 0
  },
  datasetTable: {
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.hover
    }
  }
});

class SearchResultsDataset extends React.PureComponent {
  state = {
    numberOfResultsToDisplay:
      this.props.featureCollection.value.numberMatched >
      this.props.featureCollection.value.numberReturned
        ? `${this.props.featureCollection.value.numberReturned}+`
        : this.props.featureCollection.value.numberReturned,
    expanded: this.props.sumOfResults === 1,
    showAllInformation: false
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
        onClick={e => {
          e.stopPropagation();
          this.setState({
            showAllInformation: !this.state.showAllInformation
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
      <AccordionDetails
        id={`search-result-dataset-details-${featureCollection.source.id}`}
        className={classes.datasetDetailsContainer}
      >
        <Grid justify="center" container>
          {this.state.expanded &&
            featureCollection.value.features.map(f => (
              <React.Fragment key={f.id}>
                <Grid
                  role="button"
                  onClick={handleOnResultClick(f)}
                  className={classes.datasetTable}
                  container
                  item
                >
                  <Typography variant="srOnly">Aktivera sökresultat</Typography>
                  <Grid item xs={1}></Grid>
                  <Grid item xs={10}>
                    <SearchResultsDatasetFeature
                      feature={f}
                      app={app}
                      showAllInformation={showAllInformation}
                      source={featureCollection.source}
                      handleOnResultClick={handleOnResultClick}
                    />
                  </Grid>
                  <Grid item xs={1}></Grid>
                </Grid>
                {this.renderShowMoreInformationButton()}
                {!this.resultHasOnlyOneFeature() && (
                  <Divider className={classes.divider}></Divider>
                )}
              </React.Fragment>
            ))}
        </Grid>
      </AccordionDetails>
    );
  };

  renderDatasetSummary = () => {
    const { numberOfResultsToDisplay } = this.state;
    const { featureCollection, classes, getOriginBasedIcon } = this.props;
    const { numberReturned, numberMatched } = featureCollection.value;
    const toolTipTitle = `Visar ${numberReturned} av ${numberMatched} resultat`;
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
    const { featureCollection } = this.props;
    return featureCollection.value.numberReturned > 0
      ? this.renderResultsDataset()
      : null;
  }
}

export default withStyles(styles)(SearchResultsDataset);
