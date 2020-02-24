import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Menu from "@material-ui/core/Menu";
import SubMenuItem from "./SubMenuItem";
import menuItem from "../MenuItemHOC";
import _MenuBarItem from "./MenuBarItem";
import _CascadeRootItem from "./CascadeRootItem";
import Grid from "@material-ui/core/Grid";

const MenuBarItem = menuItem(_MenuBarItem);
const CascadeRootItem = menuItem(_CascadeRootItem);

const styles = theme => ({});

class CascadeMenu extends React.PureComponent {
  static propTypes = {};
  static defaultProps = {};

  renderMenuItems = () => {
    const { items } = this.props;
    return items.map(item => {
      if (item.menu && item.menu.length > 0) {
        return (
          <SubMenuItem
            key={item.title}
            getMenuItem={this.getMenuItem}
            item={item}
          ></SubMenuItem>
        );
      } else {
        return (
          <Grid key={item.title} item>
            {this.getMenuItem(item)}
          </Grid>
        );
      }
    });
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

  render() {
    const {
      anchorEl,
      verticalAnchor,
      horizontalAnchor,
      items,
      menuOpen,
      onClose
    } = this.props;

    return (
      <>
        <Menu
          id="simple-menu"
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: verticalAnchor,
            horizontal: horizontalAnchor
          }}
          anchorEl={anchorEl}
          onClose={onClose}
          open={menuOpen}
        >
          <Grid>{items && this.renderMenuItems()}</Grid>
        </Menu>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(CascadeMenu));
