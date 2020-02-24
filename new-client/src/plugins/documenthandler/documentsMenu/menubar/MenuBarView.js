import React from "react";
import ReactDOM from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Grid from "@material-ui/core/Grid";
import { Paper } from "@material-ui/core";
import menuItem from "../MenuItemHOC";
import _MenuBarItem from "./MenuBarItem";
import _CascadeRootItem from "./CascadeRootItem";

const MenuBarItem = menuItem(_MenuBarItem);
const CascadeRootItem = menuItem(_CascadeRootItem);

const xs = 12,
  sm = 4,
  md = 3,
  lg = 2;

const header = document.getElementById("header");

const styles = theme => ({
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
        <CascadeRootItem
          localObserver={localObserver}
          item={item}
        ></CascadeRootItem>
      );
    } else if (item.document) {
      return (
        <MenuBarItem
          type="document"
          localObserver={localObserver}
          item={item}
        ></MenuBarItem>
      );
    } else if (item.link) {
      return (
        <MenuBarItem
          type="link"
          localObserver={localObserver}
          item={item}
        ></MenuBarItem>
      );
    } else if (item.maplink) {
      return (
        <MenuBarItem
          type="maplink"
          localObserver={localObserver}
          item={item}
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
    return currentMenu.containingMenu;
  };

  render() {
    const { classes } = this.props;
    var menu = this.getMenuTree();

    return ReactDOM.createPortal(
      <Paper className={classes.root}>
        {menu.map(item => {
          return this.renderMenuItem(item);
        })}
      </Paper>,
      header
    );
  }
}

export default withStyles(styles)(withSnackbar(MenuBarView));
