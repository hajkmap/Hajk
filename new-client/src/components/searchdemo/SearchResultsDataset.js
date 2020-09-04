import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";

import {
  Typography,
  List,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
} from "@material-ui/core";

import PlaceIcon from "@material-ui/icons/Place";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

import SearchResultsDatasetFeature from "./SearchResultsDatasetFeature";

const styles = (theme) => ({});

class SearchResultsDataset extends React.PureComponent {
  state = {
    numberOfResultsToDisplay:
      this.props.featureCollection.value.numberMatched >
      this.props.featureCollection.value.numberReturned
        ? `${this.props.featureCollection.value.numberReturned}+`
        : this.props.featureCollection.value.numberReturned,
    expanded: this.props.featureCollection.value.numberReturned === 1,
  };

  renderResultsDataset = () => {
    const { numberOfResultsToDisplay } = this.state;
    const {
      checkedItems,
      handleCheckedToggle,
      setSelectedFeatureAndSource,
      featureCollection,
    } = this.props;

    return (
      <>
        <Accordion
          expanded={this.state.expanded}
          onChange={() => this.setState({ expanded: !this.state.expanded })}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Grid container>
              <Grid item xs={4}>
                <Typography>
                  <PlaceIcon /> {featureCollection.source.caption}
                </Typography>
              </Grid>
              <Grid item xs={4} />
              <Grid item xs={4}>
                <Tooltip
                  title={`Visar ${featureCollection.value.numberReturned} av ${featureCollection.value.numberMatched} resultat`}
                >
                  <Chip label={numberOfResultsToDisplay} />
                </Tooltip>
              </Grid>
            </Grid>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {featureCollection.value.features.map((f) => (
                <SearchResultsDatasetFeature
                  key={f.id}
                  feature={f}
                  source={featureCollection.source}
                  checkedItems={checkedItems}
                  handleCheckedToggle={handleCheckedToggle}
                  setSelectedFeatureAndSource={setSelectedFeatureAndSource}
                />
              ))}
            </List>
          </AccordionDetails>
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
