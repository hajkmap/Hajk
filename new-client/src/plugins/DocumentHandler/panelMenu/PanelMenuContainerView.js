import React from "react";
import PanelList from "./PanelList";
import { isMobile } from "../../../utils/IsMobile";

class PanelMenuView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.#bindSubscriptions();
  }

  internalId = 0;

  state = {
    items: {},
  };

  componentDidMount = () => {
    this.#setInternalReferences();
  };

  handleExpandClick = (id) => {
    this.updateColorAndExpandedState(id);
  };

  #setInternalReferences = () => {
    const { options } = this.props;

    options.menuConfig.menu.forEach((menuItem) => {
      this.#setInternalId(menuItem);
    });

    this.setState({
      items: this.#getNormalizedResultState(options.menuConfig.menu),
    });
  };

  getTopLevelItem = (clickedItem, newItems) => {
    if (!clickedItem.parentId) {
      return clickedItem;
    } else {
      return Object.values(newItems).find((item) => {
        return item.allChildren.indexOf(clickedItem.id) > -1;
      });
    }
  };

  updateColorAndExpandedState = (idClicked) => {
    const newItems = { ...this.state.items };
    const clickedItem = newItems[idClicked];

    let selectedItem = Object.values(newItems).find((item) => {
      return item.selected;
    });

    const topLevelItem = this.getTopLevelItem(clickedItem, newItems);
    let idsToColor = [topLevelItem.id, ...topLevelItem.allChildren];

    Object.values(newItems).forEach((item) => {
      item.colored = idsToColor.indexOf(item.id) !== -1;
      if (clickedItem.allParents.indexOf(item.id) !== -1) {
        item.expandedSubMenu = true;
      }
      if (item.id === idClicked) {
        if (item.hasSubMenu) {
          item.expandedSubMenu = !item.expandedSubMenu;
          item.selected = false;
        } else {
          if (selectedItem) {
            selectedItem.selected = false;
          }

          item.selected = true;
        }
      }
    });

    this.setState({ items: newItems });
  };

  #bindSubscriptions = () => {
    const { localObserver, options } = this.props;

    localObserver.subscribe("set-active-document", ({ documentName }) => {
      const itemClicked = Object.values(this.state.items).find((item) => {
        return item.document === documentName;
      });
      this.updateColorAndExpandedState(itemClicked.id);
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

  getAllChildrenIds = (menu) => {
    return menu.reduce((allChildren, item) => {
      if (this.#hasSubMenu(item)) {
        allChildren = [...allChildren, ...this.getAllChildrenIds(item.menu)];
      }
      return [...allChildren, item.id];
    }, []);
  };

  #getNormalizedResultState = (
    menu,
    parentId = null,
    level = 0,
    parentIds = []
  ) => {
    let normalizedItemList = menu.reduce((items, menuItem) => {
      menuItem = {
        ...menuItem,
        ...{
          parentId,
          level,
          selected: false,
          colored: false,
          menuItemIds: [],
          allChildren: [],
          allParents: parentIds,
          hasSubMenu: false,
        },
      };

      if (menuItem.menu && menuItem.menu.length > 0) {
        menuItem.hasSubMenu = true;
        menuItem.allChildren = [
          ...menuItem.allChildren,
          ...this.getAllChildrenIds(menuItem.menu),
        ];
        menuItem.menuItemIds = [
          ...menuItem.menuItemIds,
          ...menuItem.menu.map((menuItem) => {
            return menuItem.id;
          }),
        ];

        items = {
          ...items,
          ...this.#getNormalizedResultState(
            menuItem.menu,
            menuItem.id,
            level + 1,
            [...parentIds, menuItem.id]
          ),
        };
      }
      return { ...items, ...{ [menuItem.id]: menuItem } };
    }, {});
    Object.values(normalizedItemList).forEach((n) => {
      delete n.menu;
    });
    return normalizedItemList;
  };

  #hasSubMenu = (item) => {
    return item.menu && item.menu.length > 0;
  };
  #getNextUniqueId = () => {
    this.internalId += 1;
    return this.internalId;
  };

  #setInternalId = (menuItem) => {
    menuItem.id = this.#getNextUniqueId();
    if (this.#hasSubMenu(menuItem)) {
      menuItem.menu.forEach((subMenuItem) => {
        this.#setInternalId(subMenuItem, menuItem);
      });
    }
  };

  render() {
    return (
      <PanelList
        {...this.props}
        handleExpandClick={this.handleExpandClick}
        setActiveMenuItems={this.setActiveMenuItems}
        level={0}
        items={this.state.items}
      ></PanelList>
    );
  }
}

export default PanelMenuView;
