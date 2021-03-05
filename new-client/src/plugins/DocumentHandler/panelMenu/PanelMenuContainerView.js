import React from "react";
import PanelList from "./PanelList";
import { isMobile } from "../../../utils/IsMobile";

class PanelMenuView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.#bindSubscriptions();
  }

  state = {
    items: {},
  };

  componentDidMount = () => {
    this.#setInternalReferences();
  };

  handleExpandClick = (id) => {
    const newItems = { ...this.state.items };
    newItems[id].expandedSubMenu = !newItems[id].expandedSubMenu;
    newItems[id].colored = newItems[id].expandedSubMenu;
    Object.values(newItems).forEach((item) => {
      if (item.parentId === id) {
        item.colored = true;
      }
    });

    this.setState({ items: newItems });
  };

  isTopLevelMenuItemColored = () => {
    const { options } = this.props;
    return options.menuConfig.menu.some((item) => {
      return (
        item.menu.length === 0 && this.state.coloredIndex.indexOf(item.id) > -1
      );
    });
  };

  /*
  setActiveMenuItems = (documentName, item) => {
    console.log(documentName, "docuemtnNema");
    if (!documentName) {
      if (this.isTopLevelMenuItemColored()) {
        this.setState({
          selectedIndex: null,
          coloredIndex: [],
        });
      } else {
        this.setState({
          selectedIndex: null,
        });
      }
    }
    if (documentName === item.document) {
      this.setState({
        selectedIndex: item.id,
        coloredIndex: this.#getItemIdsToColor(item),
        expandedIndex: this.#getItemIdsToExpand(item),
      });
    }
  };*/

  #setInternalReferences = () => {
    const { options } = this.props;
    this.internalId = 0;
    options.menuConfig.menu.forEach((menuItem) => {
      this.#setItemProperties(menuItem);
      this.internalId = this.internalId + 1;
    });

    const test = this.#getNormalizedResultState(options.menuConfig.menu);
    this.setState({
      items: test,
    });
  };

  #bindSubscriptions = () => {
    const { localObserver, options } = this.props;

    localObserver.subscribe("set-active-document", ({ documentName }) => {
      console.log(documentName, "documentName");
      const newItems = { ...this.state.items };
      Object.values(newItems).forEach((item) => {
        item.selected = item.document === documentName;
        item.colored = item.document === documentName;
      });

      this.setState({ items: newItems });
    });

    localObserver.subscribe("document-clicked", (id) => {
      localObserver.publish("set-active-document", {
        documentName: this.state.items[id].document,
        headerIdentifier: null,
      });
    });

    localObserver.subscribe("link-clicked", (id) => {
      window.open(this.state.items[id].link, "_blank");
    });

    localObserver.subscribe("document-maplink-clicked", (maplink) => {
      if (options.displayLoadingOnMapLinkOpen) {
        localObserver.publish("maplink-loading");
      }
      this.delayAndFlyToMapLink(maplink);
    });

    localObserver.subscribe("maplink-clicked", (id) => {
      if (!isMobile && options.closePanelOnMapLinkOpen) {
        localObserver.publish("set-active-document", {
          documentName: null,
          headerIdentifier: null,
        });
        this.props.app.globalObserver.publish("documentviewer.closeWindow");
      }
      if (options.displayLoadingOnMapLinkOpen) {
        localObserver.publish("maplink-loading");
      }
      this.delayAndFlyToMapLink(this.state.items[id].maplink);
    });
  };

  /*
  Large maplinks can be slow and cause the application to hang. This delay is a workaround in order
  allow the other tasks such as closing the document and displaying a snackbar to run before the
  application hangs.
  */
  delayAndFlyToMapLink = (maplink) => {
    setTimeout(() => {
      this.props.localObserver.publish("fly-to", maplink);
    }, 100);
  };

  #getNormalizedResultState = (menu, parentId = null, level = 0) => {
    let normalized = menu.reduce((acc, menuItem) => {
      menuItem.parentId = parentId;
      menuItem.level = level;
      menuItem.selected = false;
      menuItem.colored = false;
      menuItem.menuItemIds = [];
      acc = { ...acc, ...{ [menuItem.id]: menuItem } };

      if (menuItem.menu && menuItem.menu.length > 0) {
        menuItem.menuItemIds = [
          ...menuItem.menuItemIds,
          ...menuItem.menu.map((menuItem) => {
            return menuItem.id;
          }),
        ];

        acc = {
          ...acc,
          ...this.#getNormalizedResultState(
            menuItem.menu,
            menuItem.id,
            level + 1
          ),
        };
      }
      return acc;
    }, {});
    Object.values(normalized).forEach((n) => {
      delete n.menu;
    });
    return normalized;
  };

  #setItemProperties = (menuItem) => {
    menuItem.id = this.internalId;

    if (menuItem.menu && menuItem.menu.length > 0) {
      menuItem.menu.forEach((subMenuItem) => {
        this.internalId = this.internalId + 1;
        this.#setItemProperties(subMenuItem, menuItem);
      });
    }
  };
  /*
  #getAllAncestors = (item) => {
    const ancestors = [];
    let parent = item.parent;
    while (parent) {
      ancestors.push(parent);
      parent = parent.parent;
    }
    return ancestors;
  };

  #extractIdsFromItems = (items) => {
    return items.map((item) => {
      return item.id;
    });
  };
*/
  getItemList = () => {
    const { options } = this.props;
    console.log(options.menuConfig.menu, "Menu");
    return options.menuConfig.menu;
  };
  /*
  #getAllSubMenuIds = (menu) => {
    let itemIds = [];
    menu.forEach((menuItem) => {
      if (menuItem.menu.length > 0) {
        itemIds.push(menuItem.id);
        itemIds = itemIds.concat(this.#getAllSubMenuIds(menuItem.menu));
      } else {
        itemIds.push(menuItem.id);
      }
    });
    return itemIds;
  };

  #getItemIdsToColor = (item) => {
    const ancestors = [item, ...this.#getAllAncestors(item)];
    const ancestorIds = this.#extractIdsFromItems(ancestors);
    const allSubMenuItemIds = ancestors.reduce((acc, ancestor) => {
      acc = acc.concat(this.#getAllSubMenuIds(ancestor.menu));
      return acc;
    }, []);
    const topAncestor = ancestors.find((ancestor) => {
      return ancestor.parent === undefined;
    });
    const isTopAncestor = topAncestor.id === item.id;
    const allIds = [...ancestorIds, ...allSubMenuItemIds];
    const isExpanded = this.state.expandedIndex.some((id) => {
      return ancestorIds.indexOf(id) > -1;
    });

    if (isExpanded && isTopAncestor) {
      return [];
    }

    return allIds;
  };*/

  render() {
    const { localObserver, app } = this.props;

    return (
      <PanelList
        localObserver={localObserver}
        handleExpandClick={this.handleExpandClick}
        setActiveMenuItems={this.setActiveMenuItems}
        globalObserver={app.globalObserver}
        level={0}
        items={this.state.items}
      ></PanelList>
    );
  }
}

export default PanelMenuView;
