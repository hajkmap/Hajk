import React from "react";
import List from "@mui/material/List";
import PanelMenuListItem from "./PanelMenuListItem";

class PanelList extends React.PureComponent {
  getMenuItemType = (item, type) => {
    return (
      <PanelMenuListItem
        {...this.props}
        type={type}
        menu={item.menu}
        icon={item.icon}
        id={item.id}
        level={item.level}
        color={item.color}
        title={item.title}
        itemRef={item.itemRef}
        subMenuItems={this.#getSubMenuItems(item)}
        expanded={item.expandedSubMenu}
        colored={item.colored}
        selected={item.selected}
      ></PanelMenuListItem>
    );
  };

  #getSubMenuItems = (item) => {
    return item.menuItemIds.reduce((subMenuItems, subItemId) => {
      const subItem = Object.values(this.props.items).find((i) => {
        return i.id === subItemId;
      });
      if (subItem.menuItemIds.length > 0) {
        subMenuItems = [...subMenuItems, ...this.#getSubMenuItems(subItem)];
      }
      return [...subMenuItems, subItem];
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
      <List
        style={{ position: "static" }}
        disablePadding
        id={`panellist_${level}`}
        role="navigation"
        component="nav"
      >
        {Object.values(items)
          .filter((item) => {
            return item.level === level;
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
