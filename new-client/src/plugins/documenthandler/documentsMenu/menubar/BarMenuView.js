import React from "react";
import ReactDOM from "react-dom";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Grid from "@material-ui/core/Grid";
import { Paper } from "@material-ui/core";
import menuItem from "../MenuItemHOC";
import BarMenuItemPartialFunctionality from "./BarMenuItem";
import CascadeRootItemPartialFunctionality from "./CascadeRootItem";

const BarMenuItem = menuItem(BarMenuItemPartialFunctionality);
const CascadeRootItem = menuItem(CascadeRootItemPartialFunctionality);

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

class BarMenuView extends React.PureComponent {
  static propTypes = {};
  static defaultProps = {};

  componentDidMount = () => {
    const { removeMapBlur } = this.props;
    removeMapBlur();
  };

  getMenuItemType = (item, key, type) => {
    const { localObserver } = this.props;
    return (
      <BarMenuItem
        key={key}
        type={type}
        localObserver={localObserver}
        item={item}
      ></BarMenuItem>
    );
  };

  getCascadeMenuItem = (item, key) => {
    const { localObserver } = this.props;
    return (
      <CascadeRootItem
        key={key}
        localObserver={localObserver}
        item={item}
      ></CascadeRootItem>
    );
  };

  getMenuItem = (item, reactKey) => {
    if (item.menu && item.menu.length > 0) {
      return this.getCascadeMenuItem(item, reactKey);
    } else if (item.document) {
      return this.getMenuItemType(item, reactKey, "document");
    } else if (item.link) {
      return this.getMenuItemType(item, reactKey, "link");
    } else if (item.maplink) {
      return this.getMenuItemType(item, reactKey, "maplink");
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
        <Grid container alignItems="stretch">
          {menu.map((item, index) => {
            return this.getMenuItem(item, index);
          })}
        </Grid>
      </Paper>,
      header
    );
  }
}

export default withStyles(styles)(withSnackbar(BarMenuView));
