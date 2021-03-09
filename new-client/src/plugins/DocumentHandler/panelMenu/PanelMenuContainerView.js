import React from "react";
import PanelList from "./PanelList";
import { isMobile } from "../../../utils/IsMobile";
import { delay } from "../../../utils/Delay";
import { animateScroll as scroll } from "react-scroll";
import { withStyles } from "@material-ui/core/styles";

const styles = (theme) => ({
  test: {
    maxHeight: "100%",
    position: "relative",
    overflow: "auto",
  },
});

class PanelMenuView extends React.PureComponent {
  constructor(props) {
    super(props);
    this.#bindSubscriptions();
  }

  internalId = 0;

  state = {};

  componentDidMount = () => {
    this.#setInternalReferences();
  };

  #setInternalReferences = () => {
    const { options } = this.props;
    options.menuConfig.menu.forEach((menuItem) => {
      this.#setInternalId(menuItem);
    });
    this.setState(this.#getNormalizedResultState(options.menuConfig.menu));
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

  #getItemIdsToColor = (clickedItem, newItems) => {
    const topLevelItem = this.getTopLevelItem(clickedItem, newItems);
    return [topLevelItem.id, ...topLevelItem.allChildren];
  };

  #setClickedItemProperties = (clickedItem) => {
    clickedItem.colored = true;
    clickedItem.selected = !clickedItem.hasSubMenu;
    clickedItem.expandedSubMenu = clickedItem.hasSubMenu
      ? !clickedItem.expandedSubMenu
      : clickedItem.expandedSubMenu;
  };

  #setNonClickedItemProperties = (clickedItem, newItems) => {
    const idsToColor = this.#getItemIdsToColor(clickedItem, newItems);
    Object.values(newItems).forEach((item) => {
      if (item.id !== clickedItem.id) {
        item.colored = idsToColor.indexOf(item.id) !== -1;
        if (clickedItem.allParents.indexOf(item.id) !== -1) {
          item.expandedSubMenu = true;
        }
        if (!clickedItem.hasSubMenu) {
          item.selected = false;
        }
      }
    });
  };

  setItemStateProperties = (idClicked) => {
    const newItems = { ...this.state };
    const clickedItem = newItems[idClicked];
    this.#setClickedItemProperties(clickedItem);
    this.#setNonClickedItemProperties(clickedItem, newItems);

    this.setState({ newItems }, () => {
      if (!clickedItem.hasSubMenu) {
        this.scrollToMenuItem(
          this.state[clickedItem.id].itemRef.current.offsetTop
        );
      }
    });
  };

  scrollToMenuItem = async (scrollOffset) => {
    scroll.scrollTo(scrollOffset, {
      containerId: "panelListWrapper",
      smooth: false,
      isDynamic: true,
      delay: 0,
    });
  };

  #bindSubscriptions = () => {
    const { localObserver, options, app } = this.props;

    localObserver.subscribe("submenu-clicked", (id) => {
      this.setItemStateProperties(id);
    });

    localObserver.subscribe("set-active-document", ({ documentName }) => {
      const itemClicked = Object.values(this.state).find((item) => {
        return item.document === documentName;
      });
      this.setItemStateProperties(itemClicked.id);
    });

    localObserver.subscribe("document-clicked", (id) => {
      localObserver.publish("set-active-document", {
        documentName: this.state[id].document,
        headerIdentifier: null,
      });
      app.globalObserver.publish("core.onlyHideDrawerIfNeeded");
    });

    localObserver.subscribe("link-clicked", (id) => {
      window.open(this.state[id].link, "_blank");
      app.globalObserver.publish("core.onlyHideDrawerIfNeeded");
    });

    localObserver.subscribe("document-maplink-clicked", (maplink) => {
      if (options.displayLoadingOnMapLinkOpen) {
        localObserver.publish("maplink-loading");
      }
      app.globalObserver.publish("core.onlyHideDrawerIfNeeded");
      this.delayAndFlyToMapLink(maplink);
    });

    localObserver.subscribe("maplink-clicked", (id) => {
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
      this.delayAndFlyToMapLink(this.state[id].maplink);
    });
  };

  /*
  Large maplinks can be slow and cause the application to hang. This delay is a workaround in order
  allow the other tasks such as closing the document and displaying a snackbar to run before the
  application hangs.
  */
  delayAndFlyToMapLink = async (maplink) => {
    await delay(100);
    this.props.localObserver.publish("fly-to", maplink);
  };

  getAllChildrenIds = (menu) => {
    return menu.reduce((allChildren, item) => {
      if (this.#hasSubMenu(item)) {
        allChildren = [...allChildren, ...this.getAllChildrenIds(item.menu)];
      }
      return [...allChildren, item.id];
    }, []);
  };

  /**
   * Function takes the hierarchial menu and flattens it into a normalized state where
   * the objects key is the id of the menu-item. The structure is now flat and every
   * object has references to parents, children etc.
   * While we are normalizing, we are also setting internal properties we later use
   * to make items selected, colored etc.
   */
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
    this.scrollToMenuItem(this.state[id].itemRef.current.offsetTop);
  };

  render() {
    const { classes, app, localObserver } = this.props;
    return (
      <div className={classes.test} id="panelListWrapper">
        <PanelList
          app={app}
          localObserver={localObserver}
          onEnter={this.onEnter}
          level={0}
          items={this.state}
        ></PanelList>
      </div>
    );
  }
}

export default withStyles(styles)(PanelMenuView);
