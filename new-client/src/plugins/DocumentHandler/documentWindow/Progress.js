import React from "react";
import { withStyles } from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import CircularProgress from "@material-ui/core/CircularProgress";

const styles = (theme) => ({
  grid: {
    height: "100%",
  },
  progress: {
    height: "100%",
  },
});
class Progress extends React.PureComponent {
  render() {
    const { classes } = this.props;

    return (
      <Grid
        alignItems="center"
        justify="center"
        container
        className={classes.grid}
      >
        <CircularProgress className={classes.progress} justify="center" />
      </Grid>
    );
  }
}

export default withStyles(styles)(Progress);
