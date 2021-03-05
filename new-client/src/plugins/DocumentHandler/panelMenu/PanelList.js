import React from "react";
import List from "@material-ui/core/List";
import PanelMenuListItem from "./PanelMenuListItem";

class PanelList extends React.PureComponent {
  getMenuItemType = (item, type) => {
    const { localObserver, globalObserver } = this.props;

    return (
      <PanelMenuListItem
        handleExpandClick={this.props.handleExpandClick}
        type={type}
        menu={item.menu}
        icon={item.icon}
        id={item.id}
        level={item.level}
        color={item.color}
        title={item.title}
        subMenuItems={this.#getSubMenuItems(item)}
        expanded={item.expandedSubMenu}
        colored={item.colored}
        selected={item.selected}
        handleMenuButtonClick={this.handleMenuButtonClick}
        localObserver={localObserver}
        globalObserver={globalObserver}
      ></PanelMenuListItem>
    );
  };

  #getSubMenuItems = (item) => {
    return item.menuItemIds.reduce((acc, subItemId) => {
      const subItem = Object.values(this.props.items).find((i) => {
        return i.id === subItemId;
      });
      if (subItem.menuItemIds.length > 0) {
        acc = [...acc, ...this.#getSubMenuItems(subItem)];
      }
      acc = [...acc, subItem];
      return acc;
    }, []);
  };

  #renderMenuItem = (item) => {
    if (item.menuItemIds && item.menuItemIds.length > 0) {
      return this.getMenuItemType(item, "submenu");
    } else if (item.document) {
      return this.getMenuItemType(item, "document");
    } else if (item.link) {
      return this.getMenuItemType(item, "link");
    } else if (item.maplink) {
      return this.getMenuItemType(item, "maplink");
    }
  };

  render() {
    const { items, level } = this.props;
    return (
      <List disablePadding id="panelmenu" role="navigation" component="nav">
        {Object.values(items)
          .filter((item) => {
            return item.level == level;
          })
          .map((item) => {
            return (
              <React.Fragment key={item.id}>
                {this.#renderMenuItem(item, item.id)}
              </React.Fragment>
            );
          })}
      </List>
    );
  }
}

export default PanelList;
