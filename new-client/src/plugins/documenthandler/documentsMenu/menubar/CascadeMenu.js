import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Menu from "@material-ui/core/Menu";
import SubMenuItem from "./SubMenuItem";
import menuItem from "../MenuItemHOC";
import _MenuBarItem from "./MenuBarItem";
import _MenuBarCascadeMenuItem from "./MenuBarCascadeMenuItem";

const MenuBarItem = menuItem(_MenuBarItem);
const MenuBarCascadeMenuItem = menuItem(_MenuBarCascadeMenuItem);

const styles = theme => ({});

class CascadeMenu extends React.PureComponent {
  static propTypes = {};
  static defaultProps = {};

  renderMenuItems = () => {
    const { menuItems } = this.props;
    return menuItems.map(menuItem => {
      if (menuItem.menu && menuItem.menu.length > 0) {
        return (
          <SubMenuItem
            key={menuItem.title}
            getMenuItem={this.getMenuItem}
            title={menuItem.title}
            menuItems={menuItem.menu}
          ></SubMenuItem>
        );
      } else {
        return this.getMenuItem(menuItem);
      }
    });
  };

  getMenuItem = item => {
    const { localObserver } = this.props;
    if (item.menu && item.menu.length > 0) {
      return (
        <MenuBarCascadeMenuItem
          key={item.title}
          localObserver={localObserver}
          menuItems={item.menu}
          title={item.title}
        ></MenuBarCascadeMenuItem>
      );
    } else if (item.document) {
      return (
        <MenuBarItem
          key={item.title}
          type="document"
          localObserver={localObserver}
          title={item.title}
        ></MenuBarItem>
      );
    } else if (item.link) {
      return (
        <MenuBarItem
          key={item.title}
          type="link"
          localObserver={localObserver}
          title={item.title}
        ></MenuBarItem>
      );
    } else if (item.maplink) {
      return (
        <MenuBarItem
          key={item.title}
          type="maplink"
          localObserver={localObserver}
          title={item.title}
        ></MenuBarItem>
      );
    }
  };

  render() {
    const { anchorEl, menuItems, menuOpen } = this.props;
    return (
      <>
        <Menu
          id="simple-menu"
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left"
          }}
          anchorEl={anchorEl}
          keepMounted
          open={menuOpen}
        >
          {menuItems && this.renderMenuItems()}
        </Menu>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(CascadeMenu));
