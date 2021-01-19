import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { Checkbox, Typography, Tooltip, Grid } from "@material-ui/core";

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
    const { feature, source, visibleInMap, showClickResultInMap } = this.props;
    const helpText = !visibleInMap ? "Visa i kartan" : "Dölj från kartan";

    return (
      <Grid item align="center">
        <Tooltip title={helpText}>
          <Checkbox
            color="primary"
            disableRipple
            checked={visibleInMap}
            onClick={(e) => e.stopPropagation()}
            onChange={() => showClickResultInMap(feature, source)}
          />
        </Tooltip>
      </Grid>
    );
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
    const { feature, featureTitle, classes } = this.props;
    if (featureTitle.length > 0) {
      return (
        <Grid container alignItems="center" className={classes.root}>
          {feature.geometry
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
