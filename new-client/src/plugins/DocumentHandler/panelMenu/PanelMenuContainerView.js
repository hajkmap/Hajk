import React from "react";
import PanelList from "./PanelList";
import Box from "@mui/material/Box";
import { getIsMobile } from "../../../utils/IsMobile";
import { delay } from "../../../utils/Delay";
import { animateScroll as scroll } from "react-scroll";
import { hasSubMenu } from "../utils/helpers";
import { getNormalizedMenuState } from "../utils/stateConverter";
import {
  isExpandedTopLevelItem,
  getItemIdsToColor,
  findMenuItemWithDocumentName,
} from "../panelMenu/panelMenuUtils";

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
      this.#handleShowMapLayersFromPanelMenu
    );
    localObserver.subscribe("document-window-closed", this.#clearPanel);
  };

  #initializeItems = () => {
    const { options } = this.props;
    options.menuConfig.menu.forEach(this.#setInitialMenuItemProperties);
    this.setState(getNormalizedMenuState(options.menuConfig.menu));
  };

  // Adds highlighting on the selected document by checking if the provided
  // document (from props) matches the current menu-item.
  #setInitialMenuItemProperties = (menuItem) => {
    const { document, options = {} } = this.props;
    // Since this code only runs on mount, we should be allowed to check
    // for the selected document by using "documentOnStart" instead of the supplied
    // document. Added this fallback since the document from props is not always
    // defined, probably because of timing issues...
    const itemMatchesOpenDocument =
      (document && menuItem.document === document.documentFileName) ||
      (options.documentOnStart !== "" &&
        options.documentOnStart === menuItem.document);
    // Do not use spread because we are mutating original item
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

  //------------------Handle events-------------------------

  #handleOpenDocumentFromLink = ({ documentName, headerIdentifier }) => {
    const itemClicked = findMenuItemWithDocumentName(documentName, this.state);
    this.#setDocument(documentName, headerIdentifier);
    this.#setItemStateProperties(itemClicked.id).then(() => {
      this.#scrollToMenuItem(itemClicked.itemRef.current.offsetTop);
    });
  };

  #handleOpenDocumentFromPanelMenu = (id) => {
    const { app } = this.props;
    this.#setDocument(this.state[id].document, null);
    this.#setItemStateProperties(id).then(() => {
      app.globalObserver.publish("core.onlyHideDrawerIfNeeded");
    });
  };

  #handleShowMapLayers = (mapLink) => {
    const { options, localObserver, app } = this.props;
    if (options.displayLoadingOnMapLinkOpen) {
      localObserver.publish("maplink-loading");
    }
    app.globalObserver.publish("core.onlyHideDrawerIfNeeded");
    this.#delayAndFlyToMapLink(mapLink);
  };

  #closeDocumentWindow = () => {
    const { app } = this.props;
    this.#setDocument();
    app.globalObserver.publish("documentviewer.closeWindow");
  };

  #handleShowMapLayersFromLink = (maplink) => {
    if (getIsMobile()) {
      this.#closeDocumentWindow();
    }
    this.#handleShowMapLayers(maplink);
  };

  #handleShowMapLayersFromPanelMenu = (id) => {
    const { options } = this.props;
    // If we're on small screen, or the admin option is set (no matter screen size),
    // let's close the DocumentHandler window
    if (getIsMobile() || options.closePanelOnMapLinkOpen) {
      this.#closeDocumentWindow();
    }
    this.#handleShowMapLayers(this.state[id].maplink);
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

  #setClickedItemProperties = (clickedItem) => {
    let newItem = { ...clickedItem };
    return {
      ...clickedItem,
      colored: !isExpandedTopLevelItem(newItem),
      selected: !newItem.hasSubMenu,
      expandedSubMenu: newItem.hasSubMenu
        ? !newItem.expandedSubMenu
        : newItem.expandedSubMenu,
    };
  };

  #setNonClickedItemProperties = (item, currentState, clickedItem) => {
    const idsToColor = getItemIdsToColor(clickedItem, currentState);
    return {
      ...item,
      colored: idsToColor.indexOf(item.id) !== -1,
      expandedSubMenu:
        clickedItem.allParents.indexOf(item.id) !== -1
          ? true
          : item.expandedSubMenu,
      selected: clickedItem.hasSubMenu ? item.selected : false,
    };
  };

  //Important to create new state and items to not mutate state directly
  #setItemStateProperties = (idClicked) => {
    return new Promise((resolve) => {
      const currentState = { ...this.state };
      const clickedItem = currentState[idClicked];
      const newState = Object.values(currentState).reduce((items, item) => {
        const isClickedItem = item.id === idClicked;
        if (isClickedItem) {
          return {
            ...items,
            [item.id]: this.#setClickedItemProperties(item),
          };
        } else {
          return {
            ...items,
            [item.id]: this.#setNonClickedItemProperties(
              item,
              currentState,
              clickedItem
            ),
          };
        }
      }, {});

      this.setState(newState, resolve);
    });
  };

  #clearPanel = () => {
    let newState = Object.values({ ...this.state }).reduce((state, item) => {
      let newItem = { ...item };
      newItem.colored = false;
      newItem.selected = false;
      return { ...state, [newItem.id]: newItem };
    }, {});

    this.setState(newState);
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

  render() {
    const { app, localObserver } = this.props;
    return (
      <Box
        id="panelListWrapper"
        sx={{ maxHeight: "100%", position: "relative", overflow: "auto" }}
      >
        <PanelList
          app={app}
          localObserver={localObserver}
          level={0}
          items={this.state}
        ></PanelList>
      </Box>
    );
  }
}

export default PanelMenuView;
