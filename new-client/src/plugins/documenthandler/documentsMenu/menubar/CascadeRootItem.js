import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import MenuItem from "@material-ui/core/MenuItem";
import CascadeMenu from "./CascadeMenu";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
  menu: {
    height: "100%"
  },
  typography: { whiteSpace: "pre-line", margin: theme.spacing(1) }
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

  getButton = () => {
    const { toggleHighlight, item, classes, getIcon } = this.props;

    var icon = item.icon ? getIcon(item.icon) : null;
    return (
      <MenuItem
        onClick={this.handleClick}
        className={classes.menu}
        onMouseEnter={toggleHighlight}
        onMouseLeave={toggleHighlight}
        aria-controls="simple-menu"
        aria-haspopup="true"
      >
        {icon}
        {item.title && (
          <Typography className={classes.typography} variant="button">
            {item.title}
          </Typography>
        )}
      </MenuItem>
    );
  };

  render() {
    const { item, localObserver } = this.props;

    return (
      <>
        <Grid
          style={{ backgroundColor: item.color }}
          key={item.title}
          zeroMinWidth
          justify="flex-start"
          item
          lg
        >
          {this.getButton()}
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
