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

class OverlayLinkMenuItem extends React.PureComponent {
  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.globalObserver = this.props.app.globalObserver;
  }

  handleClick = () => {
    const { localObserver, title } = this.props;
    localObserver.publish("open-link", title);
  };

  render() {
    const { classes, color, toggleHighlight, title } = this.props;
    return (
      <>
        <Paper
          onClick={this.handleClick}
          style={{ backgroundColor: color }}
          onMouseEnter={toggleHighlight}
          onMouseLeave={toggleHighlight}
          className={
            this.props.highlighted > 0
              ? clsx(classes.menuItem, classes.noTransparency)
              : classes.menuItem
          }
          square={true}
          elevation={this.props.highlighted ? 20 : 0}
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
                {title}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(OverlayLinkMenuItem));
