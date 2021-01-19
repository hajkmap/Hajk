import React from "react";
import List from "@material-ui/core/List";
import PanelMenuListItem from "./PanelMenuListItem";

class PanelList extends React.PureComponent {
  getMenuItemType = (item, type) => {
    const { localObserver, globalObserver } = this.props;

    return (
      <PanelMenuListItem
        setActiveMenuItems={this.props.setActiveMenuItems}
        selectedIndex={this.props.selectedIndex}
        expandedIndex={this.props.expandedIndex}
        handleExpandClick={this.props.handleExpandClick}
        type={type}
        coloredIndex={this.props.coloredIndex}
        handleMenuButtonClick={this.handleMenuButtonClick}
        localObserver={localObserver}
        globalObserver={globalObserver}
        item={item}
      ></PanelMenuListItem>
    );
  };

  #renderMenuItem = (item) => {
    if (item.menu.length > 0) {
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
    const { menu } = this.props;
    return (
      <List disablePadding component="nav">
        {menu.map((item) => {
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
