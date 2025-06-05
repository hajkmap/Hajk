import React from "react";
import { Typography, Chip, Grid } from "@mui/material";
import { styled } from "@mui/material/styles";
import HajkToolTip from "components/HajkToolTip";

const SummaryContainer = styled(Grid)(({ theme }) => ({
  minHeight: 42,
  paddingRight: theme.spacing(1),
  paddingLeft: theme.spacing(1),
  alignItems: "center",
}));

const StyledTypography = styled(Typography)(() => ({
  maxWidth: "100%",
}));

const WarningChip = styled(Chip)(({ theme }) => ({
  color: theme.palette.warning.contrastText,
  backgroundColor: theme.palette.warning.light,
  ...theme.applyStyles("dark", {
    backgroundColor: theme.palette.warning.dark,
  }),
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
    const { featureCollection, getOriginBasedIcon } = this.props;

    const displayWarning = this.shouldDisplayWarning();
    const toolTipTitle = displayWarning
      ? `Maximalt antal sökträffar har uppnåtts. Förfina sökningen för att säkerställa att viktig information inte missas.`
      : `Visar ${numberOfResultsToDisplay} resultat`;

    return (
      <>
        <SummaryContainer container>
          <Grid size={1}>{getOriginBasedIcon(featureCollection.origin)}</Grid>
          <Grid size={9}>
            <StyledTypography
              noWrap
              variant="button"
              component="div" // The noWrap does not work on variant="button" without changing component
            >
              {featureCollection.source.caption}
            </StyledTypography>
          </Grid>
          <Grid container justifyContent="flex-end" size={2}>
            <HajkToolTip title={toolTipTitle}>
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
            </HajkToolTip>
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

export default SearchResultsDatasetSummary;
