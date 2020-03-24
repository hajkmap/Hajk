import React from "react";
import { withStyles } from "@material-ui/core/styles";
import CardMedia from "@material-ui/core/CardMedia";
import Grid from "@material-ui/core/Grid";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import { Typography } from "@material-ui/core";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";

const styles = theme => ({
  gridContainer: {
    height: "100%",
    margin: theme.spacing(2)
  },
  logo: { width: "302px", height: "113px" }
});

class HeaderView extends React.PureComponent {
  static propTypes = {};

  static defaultProps = {};

  isSubMenu = () => {
    const { activeMenuSection } = this.props;
    return activeMenuSection[0].parent === undefined ? false : true;
  };

  getContainingMenu = () => {
    const { activeMenuSection } = this.props;
    return activeMenuSection[0].parent.containingMenu;
  };

  goToParentMenu = () => {
    const { localObserver } = this.props;
    localObserver.publish("show-containing-menu", this.getContainingMenu());
  };
  render() {
    const { options, classes } = this.props;
    return (
      <>
        <Grid container>
          {this.isSubMenu() ? (
            <>
              <Grid item>
                <IconButton onClick={this.goToParentMenu}>
                  <ArrowBackIcon></ArrowBackIcon>
                  <Typography>Tillbaka</Typography>
                </IconButton>
              </Grid>
            </>
          ) : (
            <CardMedia
              className={classes.logo}
              image={options.overlayLogoUrl}
            ></CardMedia>
          )}
        </Grid>
        <Grid item>
          <Divider variant="fullWidth"></Divider>
        </Grid>
      </>
    );
  }
}

export default withStyles(styles)(HeaderView);
