import React from "react";
import { Checkbox, Typography, Tooltip, Grid } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { styled } from "@mui/material/styles";

const IconWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  paddingLeft: theme.spacing(1),
}));

const GridRoot = styled(Grid)(() => ({
  minHeight: 42,
  width: "100%",
}));

const StyledTypography = styled(Typography)(() => ({
  maxWidth: "100%",
}));

class SearchResultsDatasetFeature extends React.PureComponent {
  renderShowInMapCheckbox = () => {
    const { visibleInMap } = this.props;
    const helpText = !visibleInMap ? "Lägg till i urval" : "Ta bort från urval";

    return (
      <Grid item align="center">
        <Tooltip disableInteractive title={helpText}>
          <Checkbox
            color="default"
            checked={visibleInMap}
            onClick={(e) => e.stopPropagation()}
            onChange={this.handleCheckboxToggle}
            icon={<StarBorderIcon />}
            checkedIcon={<StarIcon />}
          />
        </Tooltip>
      </Grid>
    );
  };

  handleCheckboxToggle = () => {
    const {
      feature,
      source,
      visibleInMap,
      addFeatureToSelected,
      removeFeatureFromSelected,
    } = this.props;
    if (visibleInMap) {
      removeFeatureFromSelected(feature);
    } else {
      feature.source = source;
      addFeatureToSelected({
        feature: feature,
        sourceId: source?.id,
        initiator: "userSelect",
      });
    }
  };

  renderOriginBasedIcon = () => {
    const { getOriginBasedIcon, origin } = this.props;
    return <IconWrapper>{getOriginBasedIcon(origin)}</IconWrapper>;
  };

  render() {
    const { feature, shouldRenderSelectedCollection } = this.props;
    const shouldRenderCheckbox =
      feature.getGeometry() && shouldRenderSelectedCollection;
    if (feature.featureTitle.length > 0) {
      return (
        <GridRoot container alignItems="center" hej="hejhej">
          {shouldRenderCheckbox
            ? this.renderShowInMapCheckbox()
            : this.renderOriginBasedIcon()}
          <Grid item xs={9}>
            <StyledTypography noWrap align="left">
              {feature.featureTitle}
            </StyledTypography>
          </Grid>
          <Grid item xs={1}></Grid>
        </GridRoot>
      );
    } else {
      return null;
    }
  }
}
export default SearchResultsDatasetFeature;
