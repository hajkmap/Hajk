import React from "react";
import PanelList from "./PanelList";
import { isMobile } from "../../../utils/IsMobile";

class PanelMenuView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.#bindSubscriptions();
    this.listScrollRef = React.createRef();
  }

  internalId = 0;

  state = {
    items: {},
  };

  componentDidMount = () => {
    this.#setInternalReferences();
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
    const { localObserver } = this.props;
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

    this.setState({ items: newItems }, () => {
      //Handle scroll for submenu separately, see onEnter
      if (!clickedItem.hasSubMenu) {
        this.scrollToMenuItem(
          this.state.items[clickedItem.id].itemRef.current.offsetTop
        );
      }
    });
  };

  scrollToMenuItem = (scrollOffset) => {
    setTimeout(() => {
      this.listScrollRef.current.scrollTop = scrollOffset;
    }, 300);
  };

  #bindSubscriptions = () => {
    const { localObserver, options, app } = this.props;

    localObserver.subscribe("submenu-clicked", ({ id, offset }) => {
      this.updateColorAndExpandedState(id);
    });

    localObserver.subscribe("set-active-document", ({ documentName }) => {
      const itemClicked = Object.values(this.state.items).find((item) => {
        return item.document === documentName;
      });
      console.log(itemClicked, "setActiveDocuemnt");
      this.updateColorAndExpandedState(itemClicked.id);
    });

    localObserver.subscribe("document-clicked", ({ id, offset }) => {
      localObserver.publish("set-active-document", {
        documentName: this.state.items[id].document,
        headerIdentifier: null,
      });
      app.globalObserver.publish("core.onlyHideDrawerIfNeeded");
    });

    localObserver.subscribe("link-clicked", ({ id, offset }) => {
      window.open(this.state.items[id].link, "_blank");
      app.globalObserver.publish("core.onlyHideDrawerIfNeeded");
    });

    localObserver.subscribe("document-maplink-clicked", (maplink) => {
      if (options.displayLoadingOnMapLinkOpen) {
        localObserver.publish("maplink-loading");
      }
      app.globalObserver.publish("core.onlyHideDrawerIfNeeded");
      this.delayAndFlyToMapLink(maplink);
    });

    localObserver.subscribe("maplink-clicked", ({ id, offset }) => {
      if (!isMobile && options.closePanelOnMapLinkOpen) {
        localObserver.publish("set-active-document", {
          documentName: null,
          headerIdentifier: null,
        });
        app.globalObserver.publish("documentviewer.closeWindow");
        app.globalObserver.publish("core.onlyHideDrawerIfNeeded");
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
          itemRef: React.createRef(),
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

  onEnter = (id) => {
    this.scrollToMenuItem(this.state.items[id].itemRef.current.offsetTop);
  };

  render() {
    return (
      <div
        ref={this.listScrollRef}
        style={{
          overflow: "auto",
          scrollBehavior: "smooth",
          position: "relative",
          maxHeight: "100%",
        }}
        id="test"
      >
        <PanelList
          {...this.props}
          onEnter={this.onEnter}
          level={0}
          items={this.state.items}
        ></PanelList>
      </div>
    );
  }
}

export default PanelMenuView;
