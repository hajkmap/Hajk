import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import List from "@material-ui/core/List";
import menuItem from "../MenuItemHOC";
import PanelMenuListItemPartialFunctionality from "./PanelMenuListItem";
import CascadeRootItemPartialFunctionality from "./CascadeRootItem";

const PanelMenuListItem = menuItem(PanelMenuListItemPartialFunctionality);
const CascadeRootItem = menuItem(CascadeRootItemPartialFunctionality);

const styles = theme => ({});

class PanelMenuView extends React.PureComponent {
  getMenuItemType = (item, key, type) => {
    const { localObserver } = this.props;
    return (
      <PanelMenuListItem
        key={key}
        type={type}
        localObserver={localObserver}
        item={item}
      ></PanelMenuListItem>
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

  getMenuTree = () => {
    var currentMenu = this.props.activeMenuSection[0];
    while (currentMenu && currentMenu.containingMenu && currentMenu.parent) {
      currentMenu = currentMenu.parent;
    }
    return currentMenu.containingMenu;
  };

  render() {
    var menu = this.getMenuTree();

    return (
      <List component="nav">
        {menu.map((item, index) => {
          return this.getMenuItem(item, index);
        })}
      </List>
    );
  }
}

export default withStyles(styles)(withSnackbar(PanelMenuView));
