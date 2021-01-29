import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { Typography, Chip, Tooltip, Grid } from "@material-ui/core";

const styles = (theme) => ({
  summaryContainer: {
    minHeight: 42,
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
  },
  typography: {
    maxWidth: "100%",
  },
  warningChip: {
    color: theme.palette.warning.contrastText,
    backgroundColor:
      theme.palette.type === "dark"
        ? theme.palette.warning.dark
        : theme.palette.warning.light,
  },
});

class SearchResultsDatasetSummary extends React.PureComponent {
  //Some sources does not return numberMatched and numberReturned, falling back on features.length
  state = {
    numberOfResultsToDisplay: this.props.featureCollection.value.features
      .length,
  };

  shouldDisplayWarning = () => {
    const { numberOfResultsToDisplay } = this.state;
    const {
      maxResultsPerDataset,
      featureCollection,
      showResultsLimitReachedWarning,
    } = this.props;
    const { numberMatched, numberReturned } = featureCollection.value;

    if (!showResultsLimitReachedWarning) {
      return false;
    }

    if (numberReturned < numberMatched) {
      return true;
    }

    return maxResultsPerDataset <= numberOfResultsToDisplay;
  };

  renderDatasetSummary = () => {
    const { numberOfResultsToDisplay } = this.state;
    const { featureCollection, getOriginBasedIcon, classes } = this.props;

    const displayWarning = this.shouldDisplayWarning();
    const toolTipTitle = displayWarning
      ? `Maximalt antal sökträffar har uppnåtts. Förfina sökningen för att säkerställa att viktig information inte missas.`
      : `Visar ${numberOfResultsToDisplay} resultat`;

    return (
      <>
        <Grid
          alignItems="center"
          container
          className={classes.summaryContainer}
        >
          <Grid item xs={1}>
            {getOriginBasedIcon(featureCollection.origin)}
          </Grid>
          <Grid item xs={9}>
            <Typography
              noWrap
              variant="button"
              component="div" // The noWrap does not work on variant="button" without changing component
              className={classes.typography}
            >
              {featureCollection.source.caption}
            </Typography>
          </Grid>
          <Grid container item justify="flex-end" xs={2}>
            <Tooltip title={toolTipTitle}>
              <Chip
                size="small"
                color="default"
                className={displayWarning ? classes.warningChip : null}
                label={`${numberOfResultsToDisplay}${
                  displayWarning ? "+" : ""
                }`}
              />
            </Tooltip>
          </Grid>
        </Grid>
      </>
    );
  };

  render() {
    const { numberOfResultsToDisplay } = this.state;
    return parseInt(numberOfResultsToDisplay) > 0
      ? this.renderDatasetSummary()
      : null;
  }
}

export default withStyles(styles)(SearchResultsDatasetSummary);
