import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import clsx from "clsx";

const styles = theme => ({
  menuItem: {
    height: theme.spacing(20),
    maxWidth: theme.spacing(36),
    minWidth: theme.spacing(22),
    margin: theme.spacing(1),
    backgroundColor: "blue",
    opacity: "0.8",
    cursor: "pointer",
    [theme.breakpoints.down("xs")]: {
      maxWidth: "none",
      height: theme.spacing(10)
    }
  },
  noTransparency: {
    opacity: 1
  },
  gridContainer: {
    height: "100%"
  }
});

class OverlayMenuItem extends React.PureComponent {
  static propTypes = {};

  static defaultProps = {};

  render() {
    const {
      classes,

      item,
      toggleHighlight,
      highlighted,
      handleMenuButtonClick
    } = this.props;

    return (
      <>
        <Paper
          onClick={handleMenuButtonClick}
          style={{ backgroundColor: item.color }}
          onMouseEnter={toggleHighlight}
          onMouseLeave={toggleHighlight}
          className={
            highlighted > 0
              ? clsx(classes.menuItem, classes.noTransparency)
              : classes.menuItem
          }
          square={true}
          elevation={highlighted ? 20 : 0}
        >
          <Grid
            className={classes.gridContainer}
            justify="center"
            alignItems="center"
            container
          >
            <Grid align="center" xs={12} item>
              {}
            </Grid>
            <Grid xs={12} item>
              <Typography
                style={{ wordWrap: "break-word" }}
                variant="subtitle1"
                align="center"
                color="textPrimary"
              >
                {item.title}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(OverlayMenuItem));
