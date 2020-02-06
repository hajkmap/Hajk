import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";

import AccessAlarmIcon from "@material-ui/icons/AccessAlarm";

const styles = theme => ({
  menuItem: {
    height: theme.spacing(20),
    maxWidth: theme.spacing(36),
    minWidth: theme.spacing(22),
    margin: theme.spacing(1),
    opacity: "0.8",
    cursor: "pointer",
    [theme.breakpoints.down("xs")]: {
      maxWidth: "none"
    }
  },
  gridContainer: {
    height: "100%"
  }
});

class MenuItemView extends React.PureComponent {
  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
  }

  handleMenuButtonClick = e => {
    this.localObserver.publish("document-clicked");
  };

  render() {
    const { classes, color, title } = this.props;
    return (
      <>
        <Paper
          onClick={() => {
            this.handleMenuButtonClick(title);
          }}
          style={{ backgroundColor: color }}
          className={classes.menuItem}
          square={true}
          elevation={0}
        >
          <Grid
            className={classes.gridContainer}
            justify="center"
            alignItems="flex-end"
            container
          >
            <Grid align="center" xs={12} item>
              <AccessAlarmIcon style={{ fontSize: 60 }} color="primary" />
            </Grid>
            <Grid xs={12} item>
              <Typography
                style={{ wordWrap: "break-word" }}
                variant="subtitle1"
                align="center"
                color="textSecondary"
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

export default withStyles(styles)(withSnackbar(MenuItemView));
