import React from "react";
import PanelList from "./PanelList";
import { isMobile } from "../../../utils/IsMobile";
import { delay } from "../../../utils/Delay";
import { animateScroll as scroll } from "react-scroll";
import { withStyles } from "@material-ui/core/styles";
import { hasSubMenu } from "../utils/helpers";
import { getNormalizedMenuState } from "../utils/stateConverter";

const styles = () => ({
  panelListWrapper: {
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
    this.#initializeItems();
  };

  #bindSubscriptions = () => {
    const { localObserver } = this.props;
    localObserver.subscribe("submenu-clicked", this.#handleSubMenuClicked);
    localObserver.subscribe(
      "document-link-clicked",
      this.#handleOpenDocumentFromLink
    );
    localObserver.subscribe(
      "document-clicked",
      this.#handleOpenDocumentFromPanelMenu
    );
    localObserver.subscribe("link-clicked", this.#handleExternalLinkClicked);
    localObserver.subscribe(
      "document-maplink-clicked",
      this.#handleShowMapLayersFromLink
    );
    localObserver.subscribe(
      "maplink-clicked",
      this.#handleShowMapLayersFromPanel
    );
  };

  #initializeItems = () => {
    const { options } = this.props;
    options.menuConfig.menu.forEach(this.#setInitialMenuItemProperties);
    this.setState(getNormalizedMenuState(options.menuConfig.menu));
  };

  //------------------Handle events-------------------------

  #findPanelMenuWithDocumentName = (documentName) => {
    return Object.values(this.state).find((item) => {
      return item.document === documentName;
    });
  };

  #handleOpenDocumentFromLink = ({ documentName, headerIdentifier }) => {
    this.#setDocument(documentName, headerIdentifier);
    const itemClicked = this.#findPanelMenuWithDocumentName(documentName);
    this.#setItemStateProperties(itemClicked.id).then(() => {
      this.#scrollToMenuItem(
        this.state[itemClicked.id].itemRef.current.offsetTop
      );
    });
  };

  #handleOpenDocumentFromPanelMenu = (id) => {
    const { app } = this.props;
    this.#setDocument(this.state[id].document, null);
    this.#setItemStateProperties(id).then(() => {
      app.globalObserver.publish("core.onlyHideDrawerIfNeeded");
    });
  };

  #handleShowMapLayersFromLink = (maplink) => {
    const { options, localObserver, app } = this.props;
    if (options.displayLoadingOnMapLinkOpen) {
      localObserver.publish("maplink-loading");
    }
    app.globalObserver.publish("core.onlyHideDrawerIfNeeded");
    this.#delayAndFlyToMapLink(maplink);
  };

  #handleShowMapLayersFromPanel = (id) => {
    const { options, app, localObserver } = this.props;
    if (!isMobile && options.closePanelOnMapLinkOpen) {
      this.#setDocument();
      app.globalObserver.publish("documentviewer.closeWindow");
      app.globalObserver.publish("core.onlyHideDrawerIfNeeded");
    }
    if (options.displayLoadingOnMapLinkOpen) {
      localObserver.publish("maplink-loading");
    }
    this.#delayAndFlyToMapLink(this.state[id].maplink);
  };

  #handleSubMenuClicked = (id) => {
    this.#setItemStateProperties(id);
  };

  #handleExternalLinkClicked = (id) => {
    const { app } = this.props;
    window.open(this.state[id].link, "_blank");
    app.globalObserver.publish("core.onlyHideDrawerIfNeeded");
  };

  //---------------------------------------------------

  #getTopLevelItem = (clickedItem, newItems) => {
    if (!clickedItem.parentId) {
      return clickedItem;
    } else {
      return Object.values(newItems).find((item) => {
        return item.allChildren.indexOf(clickedItem.id) > -1;
      });
    }
  };

  #getItemIdsToColor = (clickedItem, newItems) => {
    const topLevelItem = this.#getTopLevelItem(clickedItem, newItems);
    return [topLevelItem.id, ...topLevelItem.allChildren];
  };

  #isExpandedTopLevelItem = (item) => {
    return item.hasSubMenu && item.expandedSubMenu && item.level === 0;
  };

  #setClickedItemProperties = (clickedItem) => {
    clickedItem.colored = !this.#isExpandedTopLevelItem(clickedItem);
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

  #setItemStateProperties = (idClicked) => {
    return new Promise((resolve) => {
      const newItems = { ...this.state };
      const clickedItem = newItems[idClicked];
      this.#setClickedItemProperties(clickedItem);
      this.#setNonClickedItemProperties(clickedItem, newItems);
      this.setState({ newItems }, resolve);
    });
  };

  #scrollToMenuItem = async (scrollOffset) => {
    scroll.scrollTo(scrollOffset, {
      containerId: "panelListWrapper",
      smooth: false,
      isDynamic: true,
      delay: 0,
    });
  };

  #setDocument = (documentName = null, headerIdentifier = null) => {
    const { localObserver } = this.props;
    localObserver.publish("set-active-document", {
      documentName: documentName,
      headerIdentifier: headerIdentifier,
    });
  };

  /*
  Large maplinks can be slow and cause the application to hang. This delay is a workaround in order
  allow the other tasks such as closing the document and displaying a snackbar to run before the
  application hangs.
  */
  #delayAndFlyToMapLink = async (maplink) => {
    await delay(100);
    this.props.localObserver.publish("fly-to", maplink);
  };

  #getNextUniqueId = () => {
    this.internalId += 1;
    return this.internalId;
  };

  #setInitialMenuItemProperties = (menuItem) => {
    const { document } = this.props;
    const itemMatchesOpenDocument =
      menuItem.document === document.documentFileName;
    //Do not use spread because we are mutating original item
    Object.assign(menuItem, {
      id: this.#getNextUniqueId(),
      selected: itemMatchesOpenDocument,
      colored: itemMatchesOpenDocument,
    });
    if (hasSubMenu(menuItem)) {
      menuItem.hasSubMenu = true;
      menuItem.menu.forEach((subMenuItem) => {
        this.#setInitialMenuItemProperties(subMenuItem, menuItem);
      });
    }
  };

  render() {
    const { classes, app, localObserver } = this.props;
    return (
      <div className={classes.panelListWrapper} id="panelListWrapper">
        <PanelList
          app={app}
          localObserver={localObserver}
          level={0}
          items={this.state}
        ></PanelList>
      </div>
    );
  }
}

export default withStyles(styles)(PanelMenuView);
