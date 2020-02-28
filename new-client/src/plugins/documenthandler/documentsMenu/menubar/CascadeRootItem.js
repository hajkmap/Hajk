import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Button from "@material-ui/core/Button";
import CascadeMenu from "./CascadeMenu";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
  button: {
    height: "100%",
    buttonWidth: "170px" //MAKE THIS DYNAMIC SOMEHOW?
  }
});
class MenuBarCascadeMenuItem extends React.PureComponent {
  static propTypes = {};
  static defaultProps = {};

  state = {
    anchorEl: null,
    menuOpen: false
  };

  handleClick = e => {
    this.setState({
      anchorEl: e.currentTarget.parentNode,
      menuOpen: !this.state.menuOpen
    });
  };

  onCloseClick = () => {
    this.setState({
      menuOpen: false
    });
  };

  render() {
    const { toggleHighlight, item, localObserver, classes } = this.props;

    return (
      <>
        <Grid
          style={{ backgroundColor: item.color }}
          key={item.title}
          zeroMinWidth
          item
          lg
        >
          <Button
            fullWidth
            onClick={this.handleClick}
            className={classes.button}
            onMouseEnter={toggleHighlight}
            onMouseLeave={toggleHighlight}
            aria-controls="simple-menu"
            aria-haspopup="true"
          >
            <Typography variant="button">{item.title}</Typography>
          </Button>

          <CascadeMenu
            items={item.menu}
            menuOpen={this.state.menuOpen}
            onClose={this.onCloseClick}
            anchorEl={this.state.anchorEl}
            localObserver={localObserver}
            verticalAnchor="bottom"
            horizontalAnchor="left"
          ></CascadeMenu>
        </Grid>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(MenuBarCascadeMenuItem));
