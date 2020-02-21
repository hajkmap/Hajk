import React from "react";
import ReactDOM from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Grid from "@material-ui/core/Grid";
import { Paper } from "@material-ui/core";
import menuItem from "../MenuItemHOC";
import _MenuBarItem from "./MenuBarItem";
import _MenuBarCascadeMenuItem from "./MenuBarCascadeMenuItem";

const MenuBarItem = menuItem(_MenuBarItem);
const MenuBarCascadeMenuItem = menuItem(_MenuBarCascadeMenuItem);

const xs = 12,
  sm = 4,
  md = 3,
  lg = 2,
  fullWidth = 12;

const styles = theme => ({
  container: {
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    outline: "none",
    minHeight: "80%",
    marginTop: "5%",
    marginBottom: "5%",
    [theme.breakpoints.down("xs")]: {
      height: "100%",
      overflow: "scroll",
      marginTop: 0,
      marginBottom: 0
    }
  },
  menuItem: {
    height: theme.spacing(20),
    maxWidth: theme.spacing(30),
    minWidth: theme.spacing(22),
    margin: theme.spacing(1),
    backgroundColor: "rgba(38, 44, 44, 0)",
    cursor: "pointer",
    [theme.breakpoints.down("xs")]: {
      height: "100%"
    }
  },

  root: {
    padding: "2px 4px",
    display: "flex",
    alignItems: "center",
    marginRight: theme.spacing(6),
    minWidth: theme.spacing(180), //DEBUG
    minHeight: theme.spacing(8)
  }
});

class MenuBarView extends React.PureComponent {
  state = {
    menu: this.props.activeMenuSection
  };

  static propTypes = {};
  static defaultProps = {};

  renderMenuItem = item => {
    return (
      <Grid key={item.title} zeroMinWidth item xs={xs} sm={sm} md={md} lg={lg}>
        {this.getMenuItem(item)}
      </Grid>
    );
  };

  getMenuItem = item => {
    const { localObserver } = this.props;
    if (item.menu && item.menu.length > 0) {
      return (
        <MenuBarCascadeMenuItem
          localObserver={localObserver}
          menuItems={item.menu}
          title={item.title}
        ></MenuBarCascadeMenuItem>
      );
    } else if (item.document) {
      return (
        <MenuBarItem
          type="document"
          localObserver={localObserver}
          title={item.title}
        ></MenuBarItem>
      );
    } else if (item.link) {
      return (
        <MenuBarItem
          type="link"
          localObserver={localObserver}
          title={item.title}
        ></MenuBarItem>
      );
    } else if (item.maplink) {
      return (
        <MenuBarItem
          type="maplink"
          localObserver={localObserver}
          title={item.title}
        ></MenuBarItem>
      );
    }
  };

  getSubMenu = () => {
    var subMenu = this.getMenuTree()[1];

    return subMenu ? subMenu : null;
  };

  getMenuTree = () => {
    var currentMenu = this.props.activeMenuSection[0];
    while (currentMenu && currentMenu.containingMenu && currentMenu.parent) {
      currentMenu = currentMenu.parent;
    }
    console.log(currentMenu, "currentMenu");
    return currentMenu.containingMenu;
  };

  render() {
    const { classes, activeMenuSection } = this.props;
    var menu = this.getMenuTree();

    return ReactDOM.createPortal(
      <Paper className={classes.root}>
        {menu.map(item => {
          return this.renderMenuItem(item);
        })}
      </Paper>,
      document.getElementById("header")
    );
  }
}

export default withStyles(styles)(withSnackbar(MenuBarView));
