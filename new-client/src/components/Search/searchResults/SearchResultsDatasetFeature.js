import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { Checkbox, Typography, Tooltip, Grid } from "@material-ui/core";
import StarIcon from "@material-ui/icons/Star";
import StarBorderIcon from "@material-ui/icons/StarBorder";

const styles = (theme) => ({
  root: {
    minHeight: 42,
    width: "100%",
  },
  originIconWrapper: {
    paddingLeft: theme.spacing(1),
  },
  typography: {
    maxWidth: "100%",
  },
});

class SearchResultsDatasetFeature extends React.PureComponent {
  renderShowInMapCheckbox = () => {
    const { visibleInMap } = this.props;
    const helpText = !visibleInMap ? "Lägg till i urval" : "Ta bort från urval";

    return (
      <Grid item align="center">
        <Tooltip title={helpText}>
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
      featureTitle,
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
        featureTitle: featureTitle,
        initiator: "userSelect",
      });
    }
  };

  renderOriginBasedIcon = () => {
    const { getOriginBasedIcon, origin, classes } = this.props;
    return (
      <Grid className={classes.originIconWrapper}>
        {getOriginBasedIcon(origin)}
      </Grid>
    );
  };

  render() {
    const { feature, featureTitle, classes, shouldRenderSelectedCollection } =
      this.props;
    const shouldRenderCheckbox =
      feature.getGeometry() && shouldRenderSelectedCollection;
    if (featureTitle.length > 0) {
      return (
        <Grid container alignItems="center" className={classes.root}>
          {shouldRenderCheckbox
            ? this.renderShowInMapCheckbox()
            : this.renderOriginBasedIcon()}
          <Grid item xs={9}>
            <Typography noWrap align="left" className={classes.typography}>
              {featureTitle}
            </Typography>
          </Grid>
          <Grid item xs={1}></Grid>
        </Grid>
      );
    } else {
      return null;
    }
  }
}
export default withStyles(styles)(SearchResultsDatasetFeature);
