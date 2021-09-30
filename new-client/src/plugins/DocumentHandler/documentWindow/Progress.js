import React from "react";
import withStyles from "@mui/styles/withStyles";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";

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
        justifyContent="center"
        container
        className={classes.grid}
      >
        <CircularProgress className={classes.progress} justify="center" />
      </Grid>
    );
  }
}

export default withStyles(styles)(Progress);
