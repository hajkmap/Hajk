import React from "react";
import { Checkbox, Typography, Tooltip, Grid } from "@mui/material";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { styled } from "@mui/material/styles";
import { withTranslation } from "react-i18next";

const IconWrapper = styled("div")(({ theme }) => ({
  display: "flex",
  flexWrap: "wrap",
  paddingLeft: theme.spacing(1),
}));

const GridRoot = styled(Grid)(() => ({
  minHeight: 42,
  width: "100%",
}));

const GridLabel = styled(Grid)(({ theme }) => ({
  padding: theme.spacing(1),
  paddingRight: theme.spacing(2), // We want some room after our results labels
}));

const StyledTypography = styled(Typography)(() => ({
  maxWidth: "100%",
}));

class SearchResultsDatasetFeature extends React.PureComponent {
  renderShowInMapCheckbox = () => {
    const { visibleInMap, t } = this.props;
    const helpText = !visibleInMap
      ? t("core.search.searchResults.feature.addToSelection")
      : t("core.search.searchResults.feature.removeFromSelection");

    return (
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
        <GridRoot container alignItems="center">
          <Grid item xs={1} align="center">
            {shouldRenderCheckbox
              ? this.renderShowInMapCheckbox()
              : this.renderOriginBasedIcon()}
          </Grid>
          <GridLabel item xs={10} alignItems="center">
            <StyledTypography noWrap align="left">
              {feature.featureTitle}
            </StyledTypography>
            <StyledTypography
              variant="caption"
              component="p"
              noWrap
              align="left"
            >
              {feature.secondaryLabelFields}
            </StyledTypography>
          </GridLabel>
          <Grid item xs={1} />
        </GridRoot>
      );
    } else {
      return null;
    }
  }
}
export default withTranslation()(SearchResultsDatasetFeature);
