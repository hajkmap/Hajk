import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Divider from "@material-ui/core/Divider";

import {
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip
} from "@material-ui/core";

import PlaceIcon from "@material-ui/icons/Place";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

import SearchResultsDatasetFeature from "./SearchResultsDatasetFeature";

const styles = theme => ({
  searchResultSummary: {
    backgroundColor: "#f2f2f2",
    borderTop: "2px solid #dedede",
    borderBottom: "2px solid #dedede"
  },
  accordion: {
    boxShadow: "none"
  }
});

class SearchResultsDataset extends React.PureComponent {
  state = {
    numberOfResultsToDisplay:
      this.props.featureCollection.value.numberMatched >
      this.props.featureCollection.value.numberReturned
        ? `${this.props.featureCollection.value.numberReturned}+`
        : this.props.featureCollection.value.numberReturned,
    expanded: this.props.sumOfResults === 1
  };

  renderDatasetDetails = () => {
    const {
      featureCollection,
      handleOnResultClick,
      setSelectedFeatureAndSource
    } = this.props;

    return (
      <AccordionDetails>
        <Grid container>
          {featureCollection.value.features.map((f, index) => (
            <Grid key={f.id} container item>
              <Grid item xs={1}></Grid>
              <Grid item xs={10}>
                <SearchResultsDatasetFeature
                  feature={f}
                  source={featureCollection.source}
                  handleOnResultClick={handleOnResultClick}
                  setSelectedFeatureAndSource={setSelectedFeatureAndSource}
                />
              </Grid>
              <Grid item xs={1}></Grid>

              <Divider
                style={{ backgroundColor: "#00000073", width: "100%" }}
              ></Divider>
            </Grid>
          ))}
        </Grid>
      </AccordionDetails>
    );
  };

  renderDatasetSummary = () => {
    const { numberOfResultsToDisplay } = this.state;
    const { featureCollection, classes } = this.props;
    const { numberReturned, numberMatched } = featureCollection.value;
    const toolTipTitle = `Visar ${numberReturned} av ${numberMatched} resultat`;
    return (
      <AccordionSummary
        className={classes.searchResultSummary}
        expandIcon={<ExpandMoreIcon />}
      >
        <Grid alignItems="center" container>
          <Grid item xs={1}>
            <PlaceIcon />
          </Grid>
          <Grid item xs={9}>
            <Typography>{featureCollection.source.caption}</Typography>
          </Grid>
          <Grid item xs={2}>
            <Tooltip title={toolTipTitle}>
              <Chip label={numberOfResultsToDisplay} />
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
          className={classes.accordion}
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
