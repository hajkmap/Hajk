import React from "react";
import { Accordion, Paper, Typography } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import Alert from "@material-ui/lab/Alert";
import AccordionSummary from "@material-ui/core/AccordionSummary";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";

import { Button } from "@material-ui/core";
import MoreHorizIcon from "@material-ui/icons/MoreHoriz";

import SearchResultsList from "./SearchResultsList";
import AccordionDetails from "@material-ui/core/AccordionDetails";

const styles = (theme) => ({
  searchResultTopBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: theme.spacing(1),
  },
  searchResultTopBarLeft: {
    display: "flex",
  },

  hidden: {
    display: "none",
  },

  searchResultListWrapper: {
    maxHeight: "75vh",
    overflow: "auto",
  },
  expanded: {
    "&$expanded": {
      margin: theme.spacing(0),
      minHeight: theme.spacing(0),
    },
  },
  content: {
    margin: theme.spacing(0),
  },

  // New styles
  root: {
    maxHeight: "80vh",
    minWidth: 200,
    [theme.breakpoints.up("sm")]: {
      maxWidth: 520,
    },
    [theme.breakpoints.down("xs")]: {
      minWidth: "100%",
      position: "absolute",
      left: 0,
    },
  },
});

class SearchResultsContainer extends React.PureComponent {
  state = {
    selectedFeatureAndSource: null,
    expanded: true,
    sumOfResults: this.props.searchResults.featureCollections
      .map((fc) => fc.value.totalFeatures)
      .reduce((a, b) => a + b, 0),
  };

  componentDidMount = () => {
    const { localObserver } = this.props;
    localObserver.subscribe("minimize-search-result-list", () => {
      this.setState({ expanded: false });
    });
  };

  getTheSoleResult = () => {
    const { featureCollections } = this.props;
    // Check which OL collection (i.e. "dataset") has the result
    const datasetWithTheSoleResult = featureCollections.find(
      (fc) => fc.value.totalFeatures === 1
    );

    if (datasetWithTheSoleResult === undefined) {
      return null;
    } else {
      const feature = datasetWithTheSoleResult.value.features[0];
      const source = datasetWithTheSoleResult.source;

      return { feature, source };
    }
  };

  renderSearchResultListOptions = () => {
    const { classes } = this.props;
    return (
      <Grid className={classes.hidden} item>
        <Button>Filtrera</Button>
        <Button>Sortera</Button>
        <IconButton>
          <MoreHorizIcon />
        </IconButton>
      </Grid>
    );
  };

  toggleResultListExpansion = () => {
    this.setState({ expanded: !this.state.expanded });
  };

  renderSearchResultContainerHeader = () => {
    const { sumOfResults } = this.state;
    return (
      <Grid justify="space-between" alignItems="center" container>
        <Grid item>
          <Typography>{`Visar ${sumOfResults} träffar`}</Typography>
        </Grid>
        <Grid item>{this.renderSearchResultListOptions()}</Grid>
        <Grid item>
          <IconButton onClick={this.toggleResultListExpansion}>
            {this.state.expanded ? (
              <>
                <ExpandLessIcon color="primary"></ExpandLessIcon>
                <Typography color="primary">Dölj</Typography>
              </>
            ) : (
              <>
                <ExpandMoreIcon color="primary"></ExpandMoreIcon>
                <Typography color="primary">Visa</Typography>
              </>
            )}
          </IconButton>
        </Grid>
      </Grid>
    );
  };

  render() {
    const {
      classes,
      featureCollections,
      map,
      resultSource,
      getOriginBasedIcon,
      localObserver,
    } = this.props;
    const { sumOfResults, selectedFeatureAndSource } = this.state;

    return (
      <>
        {sumOfResults === 0 ? (
          <Paper className={classes.root}>
            <Alert severity="warning">Sökningen gav inget resultat.</Alert>
          </Paper>
        ) : (
          <Paper className={classes.root}>
            <Accordion expanded={this.state.expanded}>
              <AccordionSummary
                classes={{
                  content: classes.content,
                  expanded: classes.expanded,
                }}
                aria-controls="search-result-list"
                id="search-result-list-header"
              >
                {this.renderSearchResultContainerHeader()}
              </AccordionSummary>
              <AccordionDetails
                id="search-result-list"
                className={classes.searchResultListWrapper}
              >
                <SearchResultsList
                  localObserver={localObserver}
                  featureAndSource={
                    sumOfResults === 1
                      ? this.getTheSoleResult()
                      : selectedFeatureAndSource
                  }
                  sumOfResults={sumOfResults}
                  getOriginBasedIcon={getOriginBasedIcon}
                  featureCollections={featureCollections}
                  map={map}
                  app={this.props.app}
                  resultSource={resultSource}
                />
              </AccordionDetails>
            </Accordion>
          </Paper>
        )}
      </>
    );
  }
}

export default withStyles(styles)(SearchResultsContainer);
