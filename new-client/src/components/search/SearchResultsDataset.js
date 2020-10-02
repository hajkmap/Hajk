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
  Divider,
  Grid,
} from "@material-ui/core";
import SearchResultsDatasetFeature from "./SearchResultsDatasetFeature";

const styles = (theme) => ({
  datasetSummary: {
    backgroundColor: "#f2f2f2",
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
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
});

class SearchResultsDataset extends React.PureComponent {
  state = {
    numberOfResultsToDisplay:
      this.props.featureCollection.value.numberMatched >
      this.props.featureCollection.value.numberReturned
        ? `${this.props.featureCollection.value.numberReturned}+`
        : this.props.featureCollection.value.numberReturned,
    expanded: this.props.sumOfResults === 1,
  };

  resultHasOnlyOneFeature = () => {
    const { featureCollection } = this.props;
    return featureCollection.value.features.length === 1;
  };

  renderDatasetDetails = () => {
    const { featureCollection, handleOnResultClick, classes } = this.props;

    return (
      <AccordionDetails className={classes.datasetDetailsContainer}>
        <Grid container>
          {featureCollection.value.features.map((f) => (
            <Grid
              role="button"
              onClick={handleOnResultClick(f)}
              key={f.id}
              className={classes.datasetTable}
              container
              item
            >
              <Grid item xs={1}></Grid>
              <Grid item xs={10}>
                <SearchResultsDatasetFeature
                  feature={f}
                  source={featureCollection.source}
                  handleOnResultClick={handleOnResultClick}
                />
              </Grid>
              <Grid item xs={1}></Grid>

              {!this.resultHasOnlyOneFeature() && (
                <Divider className={classes.divider}></Divider>
              )}
            </Grid>
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
