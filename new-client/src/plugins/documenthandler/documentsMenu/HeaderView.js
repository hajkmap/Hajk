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
  gridContainer: {
    height: "100%",
    margin: theme.spacing(2)
  }
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
    const { options } = this.props;
    return (
      <>
        <Grid container item xs={12}>
          {this.isSubMenu() ? (
            <>
              <Grid item>
                <ArrowBackIcon onClick={this.goToParentMenu}></ArrowBackIcon>
              </Grid>
              <Grid item>
                <Typography>Tillbaka</Typography>
              </Grid>
            </>
          ) : (
            <CardMedia
              style={{ width: "302px", height: "113px" }}
              image={options.overlayLogoUrl}
            ></CardMedia>
          )}
        </Grid>

        <Divider variant="fullWidth"></Divider>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(HeaderView));
