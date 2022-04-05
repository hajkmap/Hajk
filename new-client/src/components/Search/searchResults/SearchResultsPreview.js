import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { Grid, Popover, Typography, fade } from "@material-ui/core";
import SearchResultsDatasetFeatureDetails from "./SearchResultsDatasetFeatureDetails";

const styles = (theme) => ({
  datasetContainer: {
    boxShadow: "none",
    overflow: "hidden",
  },
  divider: {
    backgroundColor: theme.palette.divider,
    width: "100%",
  },
  datasetDetailsContainer: {
    padding: 0,
  },
  hover: {
    cursor: "pointer",
    "&:hover": {
      backgroundColor: theme.palette.action.hover,
    },
  },
  preview: {
    pointerEvents: "none",
  },
  previewPaper: {
    width: 400,
    maxHeight: 200,
    overflow: "hidden",
    background: fade(theme.palette.background.paper, 0.8),
  },
  previewHeaderContainer: {
    paddingTop: theme.spacing(0.8),
  },
  previewContentContainer: {
    borderTop: `${theme.spacing(0.2)}px solid ${theme.palette.divider}`,
  },
});

class SearchResultsPreview extends React.PureComponent {
  renderFeaturePreview = () => {
    const {
      classes,
      activeFeatureCollection,
      previewFeature,
      anchorEl,
      app,
      getFeatureTitle,
    } = this.props;

    return (
      <Popover
        id="mouse-over-popover"
        open={anchorEl ? true : false}
        anchorEl={anchorEl}
        classes={{
          root: classes.preview,
          paper: classes.previewPaper,
        }}
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
          <Grid
            item
            align="center"
            className={classes.previewHeaderContainer}
            xs={12}
          >
            <Typography variant="button">Förhandsvisning</Typography>
          </Grid>
          <Grid item className={classes.previewContentContainer} xs={12}>
            <SearchResultsDatasetFeatureDetails
              feature={previewFeature}
              featureTitle={getFeatureTitle(previewFeature)}
              app={app}
              source={activeFeatureCollection.source}
            />
          </Grid>
        </Grid>
      </Popover>
    );
  };

  render() {
    const { previewFeature } = this.props;
    return previewFeature ? this.renderFeaturePreview() : null;
  }
}

export default withStyles(styles)(SearchResultsPreview);
