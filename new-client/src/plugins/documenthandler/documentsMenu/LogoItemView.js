import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Paper from "@material-ui/core/Paper";
import CardMedia from "@material-ui/core/CardMedia";
import Grid from "@material-ui/core/Grid";

const styles = theme => ({
  logoItem: {
    height: theme.spacing(20),
    maxWidth: theme.spacing(36),
    minWidth: theme.spacing(22),
    margin: theme.spacing(1),
    cursor: "pointer",
    backgroundColor: "rgba(0,0,0,0)",
    [theme.breakpoints.down("xs")]: {
      maxWidth: "none"
    }
  },
  gridContainer: {
    height: "100%"
  }
});

class LogoItemView extends React.PureComponent {
  static propTypes = {};

  static defaultProps = {};

  render() {
    const { classes } = this.props;
    return (
      <>
        <Paper className={classes.logoItem} square={true} elevation={0}>
          <Grid
            className={classes.gridContainer}
            container
            spacing={0}
            alignItems="center"
            justify="center"
          >
            <Grid item xs={12}>
              <CardMedia
                style={{ width: "302px", height: "113px" }}
                image={"http://localhost:3000/logo-share.png"}
              ></CardMedia>
            </Grid>
          </Grid>
        </Paper>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(LogoItemView));
