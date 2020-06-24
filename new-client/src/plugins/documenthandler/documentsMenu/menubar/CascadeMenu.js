import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Menu from "@material-ui/core/Menu";
import List from "@material-ui/core/List";
import Collapse from "@material-ui/core/Collapse";

import SubMenuItemPartialFunctionality from "./SubMenuItem";
import menuItem from "../MenuItemHOC";
import PanelMenuListItemPartialFunctionality from "./PanelMenuListItem";
import StrippedCascadeRootItemPartialFunctionality from "./CascadeRootItem";
import Grid from "@material-ui/core/Grid";

const SubMenuItem = menuItem(SubMenuItemPartialFunctionality);
const PanelMenuListItem = menuItem(PanelMenuListItemPartialFunctionality);
const CascadeRootItem = menuItem(StrippedCascadeRootItemPartialFunctionality);

const styles = theme => ({});

class CascadeMenu extends React.PureComponent {
  renderMenuItems = () => {
    const { items, localObserver } = this.props;
    return items.map(item => {
      if (item.menu && item.menu.length > 0) {
        return (
          <SubMenuItem
            localObserver={localObserver}
            key={item.title}
            getMenuItem={this.getMenuItem}
            item={item}
          ></SubMenuItem>
        );
      } else {
        return this.getMenuItem(item);
      }
    });
  };

  getMenuItemType = (item, type) => {
    const { localObserver } = this.props;

    return (
      <PanelMenuListItem
        type={type}
        localObserver={localObserver}
        item={item}
      ></PanelMenuListItem>
    );
  };

  getCascadeMenuItem = item => {
    const { localObserver } = this.props;

    return (
      <CascadeRootItem
        localObserver={localObserver}
        item={item}
      ></CascadeRootItem>
    );
  };

  getMenuItem = item => {
    if (item.menu && item.menu.length > 0) {
      return this.getCascadeMenuItem(item);
    } else if (item.document) {
      return this.getMenuItemType(item, "document");
    } else if (item.link) {
      return this.getMenuItemType(item, "link");
    } else if (item.maplink) {
      return this.getMenuItemType(item, "maplink");
    }
  };

  render() {
    const { items } = this.props;
    return (
      <Collapse in={this.props.open}>
        <List disablePadding>{items && this.renderMenuItems()}</List>
      </Collapse>
    );
  }
}

export default withStyles(styles)(withSnackbar(CascadeMenu));
