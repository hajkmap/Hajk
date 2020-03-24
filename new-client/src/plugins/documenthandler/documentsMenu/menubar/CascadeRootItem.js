import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import MenuItem from "@material-ui/core/MenuItem";
import CascadeMenu from "./CascadeMenu";
import Grid from "@material-ui/core/Grid";
import ArrowDownIcon from "@material-ui/icons/KeyboardArrowDown";
import Typography from "@material-ui/core/Typography";

const styles = theme => ({
  menuItem: {
    maxHeight: theme.spacing(5),
    minHeight: theme.spacing(5)
  },
  menuItemRootOverride: {
    minHeight: 0
  },
  typography: {
    maxHeight: "inherit",

    margin: theme.spacing(1)
  }
});
class MenuBarCascadeMenuItem extends React.PureComponent {
  static propTypes = {};
  static defaultProps = {};

  state = {
    anchorEl: null,
    menuOpen: false
  };

  closeMenu = () => {
    this.setState({
      menuOpen: false
    });
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
      <Grid
        style={{ backgroundColor: item.color }}
        key={item.title}
        item
        lg={icon && !item.title ? false : true}
      >
        <MenuItem
          onClick={this.handleClick}
          className={classes.menuItem}
          onMouseEnter={toggleHighlight}
          onMouseLeave={toggleHighlight}
          aria-controls="simple-menu"
          aria-haspopup="true"
        >
          {icon}
          {item.title && (
            <>
              <Typography className={classes.typography} variant="button">
                {item.title}
              </Typography>
              <ArrowDownIcon></ArrowDownIcon>
            </>
          )}
        </MenuItem>
      </Grid>
    );
  };

  render() {
    const { item, localObserver } = this.props;

    return (
      <>
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
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(MenuBarCascadeMenuItem));
