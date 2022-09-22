import React from "react";
import { Typography, Chip, Tooltip, Grid } from "@mui/material";
import { styled } from "@mui/material/styles";
import { withTranslation } from "react-i18next";

const SummaryContainer = styled(Grid)(({ theme }) => ({
  minHeight: 42,
  paddingRight: theme.spacing(1),
  paddingLeft: theme.spacing(1),
}));

const StyledTypography = styled(Typography)(() => ({
  maxWidth: "100%",
}));

const WarningChip = styled(Chip)(({ theme }) => ({
  color: theme.palette.warning.contrastText,
  backgroundColor:
    theme.palette.mode === "dark"
      ? theme.palette.warning.dark
      : theme.palette.warning.light,
}));

class SearchResultsDatasetSummary extends React.PureComponent {
  //Some sources does not return numberMatched and numberReturned, falling back on features.length
  state = {
    numberOfResultsToDisplay:
      this.props.featureCollection.value.features.length,
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
    const { featureCollection, getOriginBasedIcon, t } = this.props;

    const displayWarning = this.shouldDisplayWarning();
    const toolTipTitle = displayWarning
      ? t("core.search.searchResults.datasetSummary.maxWarning")
      : `${t("common.showing")} ${numberOfResultsToDisplay} ${t(
          "common.results"
        ).toLowerCase()}`;

    return (
      <>
        <SummaryContainer alignItems="center" container>
          <Grid item xs={1}>
            {getOriginBasedIcon(featureCollection.origin)}
          </Grid>
          <Grid item xs={9}>
            <StyledTypography
              noWrap
              variant="button"
              component="div" // The noWrap does not work on variant="button" without changing component
            >
              {featureCollection.source.caption}
            </StyledTypography>
          </Grid>
          <Grid container item justifyContent="flex-end" xs={2}>
            <Tooltip disableInteractive title={toolTipTitle}>
              {displayWarning ? (
                <WarningChip
                  size="small"
                  color="default"
                  label={`${numberOfResultsToDisplay}${
                    displayWarning ? "+" : ""
                  }`}
                />
              ) : (
                <Chip
                  size="small"
                  color="default"
                  label={`${numberOfResultsToDisplay}${
                    displayWarning ? "+" : ""
                  }`}
                />
              )}
            </Tooltip>
          </Grid>
        </SummaryContainer>
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

export default withTranslation()(SearchResultsDatasetSummary);
