import React from "react";
import { Grid, Popover, Typography, alpha } from "@mui/material";
import SearchResultsDatasetFeatureDetails from "./SearchResultsDatasetFeatureDetails";
import { styled } from "@mui/material/styles";

const StyledPopover = styled(Popover)(({ theme }) => ({
  pointerEvents: "none",
  "& .MuiPopover-paper": {
    width: 400,
    maxHeight: 200,
    overflow: "hidden",
    background: alpha(theme.palette.background.paper, 0.8),
  },
}));

const HeaderContainer = styled(Grid)(({ theme }) => ({
  paddingTop: theme.spacing(0.8),
}));

const ContentContainer = styled(Grid)(({ theme }) => ({
  borderTop: `${theme.spacing(0.2)} solid ${theme.palette.divider}`,
}));

class SearchResultsPreview extends React.PureComponent {
  renderFeaturePreview = () => {
    const { activeFeatureCollection, previewFeature, anchorEl, app } =
      this.props;

    return (
      <StyledPopover
        id="mouse-over-popover"
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "center",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        disableRestoreFocus
      >
        <Grid container>
          <HeaderContainer item align="center" xs={12}>
            <Typography variant="button">Förhandsvisning</Typography>
          </HeaderContainer>
          <ContentContainer item xs={12}>
            <SearchResultsDatasetFeatureDetails
              feature={previewFeature}
              app={app}
              source={activeFeatureCollection.source}
            />
          </ContentContainer>
        </Grid>
      </StyledPopover>
    );
  };

  render() {
    const { previewFeature } = this.props;
    return previewFeature ? this.renderFeaturePreview() : null;
  }
}

export default SearchResultsPreview;
