import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { Checkbox, Typography, Tooltip, Grid } from "@material-ui/core";

const styles = () => ({});

class SearchResultsDatasetFeature extends React.PureComponent {
  renderShowInMapCheckbox = () => {
    const { feature, source, visibleInMap, showClickResultInMap } = this.props;
    const helpText = !visibleInMap ? "Visa i kartan" : "Ta bort från kartan";

    return (
      <Grid item xs={2} align="center">
        <Tooltip title={helpText}>
          <Checkbox
            color="primary"
            disableRipple
            checked={visibleInMap}
            onClick={(e) => e.stopPropagation()}
            onChange={() => showClickResultInMap(feature, source)}
            inputProps={{ "aria-label": "primary checkbox" }}
          />
        </Tooltip>
      </Grid>
    );
  };

  renderOriginBasedIcon = () => {
    const { getOriginBasedIcon, origin } = this.props;
    return (
      <Grid
        item
        style={{ paddingTop: 5, paddingBottom: 5 }}
        xs={2}
        align="center"
      >
        {getOriginBasedIcon(origin)}
      </Grid>
    );
  };

  render() {
    const { feature, featureTitle } = this.props;
    if (featureTitle.length > 0) {
      return (
        <Grid container alignItems="center">
          {feature.geometry
            ? this.renderShowInMapCheckbox()
            : this.renderOriginBasedIcon()}
          <Grid item xs={9}>
            <Typography
              noWrap
              variant="subtitle1"
              align="left"
              style={{ maxWidth: "100%" }}
            >
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
