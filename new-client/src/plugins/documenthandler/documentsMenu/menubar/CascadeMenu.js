import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { withSnackbar } from "notistack";
import Menu from "@material-ui/core/Menu";
import SubMenuItem from "./SubMenuItem";
import menuItem from "../MenuItemHOC";
import MenuBarItemPartialFunctionality from "./BarMenuItem";
import StrippedCascadeRootItemPartialFunctionality from "./CascadeRootItem";
import Grid from "@material-ui/core/Grid";

const BarMenuItem = menuItem(MenuBarItemPartialFunctionality);
const CascadeRootItem = menuItem(StrippedCascadeRootItemPartialFunctionality);

const styles = theme => ({
  noPadding: {
    padding: 0
  },
  menu: {
    minWidth: "179px"
  }
});

class CascadeMenu extends React.PureComponent {
  static propTypes = {};
  static defaultProps = {};

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
        return (
          <Grid key={item.title} item>
            {this.getMenuItem(item)}
          </Grid>
        );
      }
    });
  };

  getMenuItemType = (item, type) => {
    const { localObserver } = this.props;

    return (
      <BarMenuItem
        type={type}
        localObserver={localObserver}
        item={item}
      ></BarMenuItem>
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
    console.log(item.menu && item.menu.length > 0, "item");
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
    const {
      anchorEl,
      verticalAnchor,
      horizontalAnchor,
      items,
      menuOpen,
      onClose,

      forwardedRef,
      classes
    } = this.props;
    console.log(forwardedRef, "parentWidth");
    return (
      <>
        <Menu
          id="simple-menu"
          classes={{ list: classes.noPadding }}
          getContentAnchorEl={null}
          anchorOrigin={{
            vertical: verticalAnchor,
            horizontal: horizontalAnchor
          }}
          anchorEl={anchorEl}
          onClose={onClose}
          open={menuOpen}
        >
          <Grid className={classes.menu} direction="column" container>
            {items && this.renderMenuItems()}
          </Grid>
        </Menu>
      </>
    );
  }
}

export default withStyles(styles)(withSnackbar(CascadeMenu));
