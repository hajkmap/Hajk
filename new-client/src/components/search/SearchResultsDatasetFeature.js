import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { Checkbox, Typography, Tooltip, Grid } from "@material-ui/core";

const styles = (theme) => ({
  tableCell: {
    paddingLeft: 0,
    wordBreak: "break-all",
    width: "50%",
  },
  featureDisplayFieldsContainer: {
    paddingLeft: 15,
  },
  allFeatureDetailsContainer: {
    maxWidth: "100%",
    padding: theme.spacing(2),
  },
  allFeatureDetailsHeader: {
    maxWidth: "100%",
    fontWeight: 500,
    paddingBottom: theme.spacing(1),
  },
});

class SearchResultsDatasetFeature extends React.PureComponent {
  renderShowInMapCheckbox = () => {
    const { feature, visibleInMap, showClickResultInMap } = this.props;
    const helpText = !visibleInMap ? "Visa i kartan" : "Ta bort från kartan";

    return (
      <Grid item xs={2}>
        <Tooltip title={helpText}>
          <Checkbox
            color="primary"
            disableRipple
            checked={visibleInMap}
            onClick={(e) => e.stopPropagation()}
            onChange={() => showClickResultInMap(feature)}
            inputProps={{ "aria-label": "primary checkbox" }}
          />
        </Tooltip>
      </Grid>
    );
  };

  renderOriginBasedIcon = () => {
    const { getOriginBasedIcon, origin } = this.props;
    return (
      <Grid item style={{ padding: 10 }} xs={2}>
        {getOriginBasedIcon(origin)}
      </Grid>
    );
  };

  render() {
    const { classes, feature, featureTitle } = this.props;
    if (feature && featureTitle.length > 0) {
      return (
        <Grid
          container
          alignItems="center"
          className={classes.featureDisplayFieldsContainer}
        >
          <Grid item xs={10}>
            <Typography
              noWrap
              variant="subtitle1"
              align="left"
              style={{ maxWidth: "100%" }}
            >
              {featureTitle}
            </Typography>
          </Grid>
          {feature.geometry
            ? this.renderShowInMapCheckbox()
            : this.renderOriginBasedIcon()}
        </Grid>
      );
    }
  }
}
export default withStyles(styles)(SearchResultsDatasetFeature);
