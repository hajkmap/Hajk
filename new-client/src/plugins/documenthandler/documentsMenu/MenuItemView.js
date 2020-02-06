import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";

import AccessAlarmIcon from "@material-ui/icons/AccessAlarm";

const styles = theme => ({
  menuItem: {
    height: theme.spacing(16),
    margin: theme.spacing(1)
  },
  gridContainer: {
    height: "100%"
  }
});

class MenuItemView extends React.PureComponent {
  state = {
    counter: 0
  };

  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
    this.localObserver = this.props.localObserver;
    this.globalObserver = this.props.app.globalObserver;
  }

  handleMenuButtonClick = e => {
    console.log(e, "e");
  };

  render() {
    const { classes, color, title } = this.props;
    return (
      <>
        <Paper
          onClick={this.handleMenuButtonClick}
          style={{ backgroundColor: color }}
          className={classes.menuItem}
          square="true"
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
              <Typography variant="h5" align="center" color="textSecondary">
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
