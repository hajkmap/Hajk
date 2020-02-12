import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Paper from "@material-ui/core/Paper";
import CardMedia from "@material-ui/core/CardMedia";
import Grid from "@material-ui/core/Grid";
import Divider from "@material-ui/core/Divider";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import { Typography } from "@material-ui/core";

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

class HeaderView extends React.PureComponent {
  static propTypes = {};

  static defaultProps = {};

  constructor(props) {
    super(props);
  }

  goToParentChapters = () => {
    const { localObserver, menuItems } = this.props;
    var parentChapter = menuItems[0].parent;
    localObserver.publish("goToParentChapters", parentChapter);
  };
  render() {
    const { classes, subMenu, title } = this.props;
    console.log(subMenu, "subMenu");
    return (
      <>
        <Paper className={classes.logoItem} square={true} elevation={0}>
          <Grid
            className={classes.gridContainer}
            container
            spacing={0}
            alignItems="flex-end"
            justify="center"
          >
            <Grid item xs={12}>
              {subMenu ? (
                <>
                  <ArrowBackIcon
                    onClick={this.goToParentChapters}
                  ></ArrowBackIcon>
                  <Typography>{title}</Typography>
                </>
              ) : (
                <CardMedia
                  style={{ width: "302px", height: "113px" }}
                  image={"http://localhost:3000/logo-share.png"}
                ></CardMedia>
              )}
            </Grid>
          </Grid>
        </Paper>
        <Divider variant="fullWidth"></Divider>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(HeaderView));
