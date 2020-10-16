import React from "react";
import List from "@material-ui/core/List";
import PanelMenuListItem from "./PanelMenuListItem";

class PanelList extends React.PureComponent {
  static propTypes = {};

  getMenuItemType = (item, type) => {
    const { localObserver, globalObserver } = this.props;
    return (
      <PanelMenuListItem
        type={type}
        handleMenuButtonClick={this.handleMenuButtonClick}
        localObserver={localObserver}
        globalObserver={globalObserver}
        item={item}
      ></PanelMenuListItem>
    );
  };

  renderMenuItem = (item) => {
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
        {menu.map((item, index) => {
          return (
            <React.Fragment key={index}>
              {this.renderMenuItem(item, index)}
            </React.Fragment>
          );
        })}
      </List>
    );
  }
}

export default PanelList;
