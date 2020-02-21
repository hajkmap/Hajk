import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Button from "@material-ui/core/Button";

import CascadeMenu from "./CascadeMenu";
import menuComponent from "../MenuViewHOC";

console.log(menuComponent, "menuViewHoc");

//const CascadeMenu = menuViewHoc(_CascadeMenu);

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

class MenuBarCascadeMenuItem extends React.PureComponent {
  static propTypes = {};
  static defaultProps = {};

  state = {
    anchorEl: null,
    menuOpen: false
  };

  handleClick = e => {
    const { localObserver, title, subMenu } = this.props;
    localObserver.publish("show-submenu", title);

    this.setState({
      anchorEl: e.currentTarget,
      menuOpen: !this.state.menuOpen
    });
  };

  render() {
    const { toggleHighlight, title, menuItems } = this.props;

    return (
      <>
        <Button
          onClick={this.handleClick}
          onMouseEnter={toggleHighlight}
          onMouseLeave={toggleHighlight}
          aria-controls="simple-menu"
          aria-haspopup="true"
        >
          {title}
        </Button>
        <CascadeMenu
          menuItems={menuItems}
          menuOpen={this.state.menuOpen}
          anchorEl={this.state.anchorEl}
        ></CascadeMenu>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(MenuBarCascadeMenuItem));
