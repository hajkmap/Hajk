import React from "react";
import PanelList from "./PanelList";

class PanelMenuView extends React.PureComponent {
  state = { selectedIndex: null, coloredIndex: [], expandedIndex: [] };

  constructor(props) {
    super(props);
    this.#setInternalReferences();
    this.#bindSubscriptions();
  }

  handleExpandClick = (item) => {
    const indexOfItemId = this.state.expandedIndex.indexOf(item.id);
    let newExpandedState = [...this.state.expandedIndex];

    if (indexOfItemId === -1) {
      newExpandedState.push(item.id);
    } else {
      newExpandedState.splice(indexOfItemId);
    }
    this.setState({
      expandedIndex: newExpandedState,
      coloredIndex: this.#getItemIdsToColor(item),
    });
  };

  setActiveMenuItems = (documentName, item) => {
    if (!documentName) {
      this.setState({
        selectedIndex: null,
        coloredIndex: [],
      });
    }
    if (documentName === item.document) {
      this.setState({
        selectedIndex: item.id,
        coloredIndex: this.#getItemIdsToColor(item),
        expandedIndex: this.#getItemIdsToExpand(item),
      });
    }
  };

  #setInternalReferences = () => {
    const { options } = this.props;
    this.internalId = 0;
    options.menuConfig.menu.forEach((menuItem) => {
      this.#setMenuItemLevel(menuItem, 0);
      this.#setInternalId(menuItem);
      this.#setParentMenuItem(menuItem, undefined);
      this.internalId = this.internalId + 1;
    });
  };

  #bindSubscriptions = () => {
    const { localObserver } = this.props;

    localObserver.subscribe("document-clicked", (item) => {
      localObserver.publish("set-active-document", {
        documentName: item.document,
        headerIdentifier: null,
      });
    });

    localObserver.subscribe("link-clicked", (item) => {
      window.open(item.link, "_blank");
    });

    localObserver.subscribe("maplink-clicked", (item) => {
      localObserver.publish("fly-to", item.maplink);
    });
  };

  #setInternalId = (menuItem) => {
    menuItem.id = this.internalId;
    if (menuItem.menu.length > 0) {
      menuItem.menu.forEach((child) => {
        this.internalId = this.internalId + 1;
        this.#setInternalId(child);
      });
    }
  };

  #setParentMenuItem = (menuItem, parent) => {
    menuItem.parent = parent;
    if (menuItem.menu.length > 0) {
      menuItem.menu.forEach((child) => {
        this.#setParentMenuItem(child, menuItem);
      });
    }
  };

  #setMenuItemLevel = (menuItem, level) => {
    menuItem.level = level;
    level = level + 1;
    if (menuItem.menu && menuItem.menu.length > 0) {
      menuItem.menu.forEach((subMenuItem) => {
        this.#setMenuItemLevel(subMenuItem, level);
      });
    }
  };

  #getItemIdsToExpand = (item) => {
    const shoudBeExpanded = this.#extractIdsFromItems(
      this.#getAllAncestors(item)
    );

    const currentlyNoExpanded = shoudBeExpanded.filter(() => {
      return this.state.expandedIndex.indexOf(item.id) === -1;
    });
    return [...this.state.expandedIndex, ...currentlyNoExpanded];
  };

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
  };

  render() {
    const { localObserver, app, options } = this.props;
    return (
      <PanelList
        localObserver={localObserver}
        handleExpandClick={this.handleExpandClick}
        setActiveMenuItems={this.setActiveMenuItems}
        expandedIndex={this.state.expandedIndex}
        coloredIndex={this.state.coloredIndex}
        selectedIndex={this.state.selectedIndex}
        globalObserver={app.globalObserver}
        menu={options.menuConfig.menu}
      ></PanelList>
    );
  }
}

export default PanelMenuView;
