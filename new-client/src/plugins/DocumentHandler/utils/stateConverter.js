import React from "react";
import { hasSubMenu } from "../utils/helpers";

const getAllChildrenIds = (menu) => {
  return menu.reduce((allChildren, item) => {
    if (hasSubMenu(item)) {
      allChildren = [...allChildren, ...getAllChildrenIds(item.menu)];
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
export const getNormalizedMenuState = (
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
        menuItemIds: [],
        allChildren: [],
        allParents: parentIds,
        itemRef: React.createRef(),
      },
    };

    if (menuItem.menu && menuItem.menu.length > 0) {
      menuItem.allChildren = [
        ...menuItem.allChildren,
        ...getAllChildrenIds(menuItem.menu),
      ];
      menuItem.menuItemIds = [
        ...menuItem.menuItemIds,
        ...menuItem.menu.map((menuItem) => {
          return menuItem.id;
        }),
      ];

      items = {
        ...items,
        ...getNormalizedMenuState(menuItem.menu, menuItem.id, level + 1, [
          ...parentIds,
          menuItem.id,
        ]),
      };
    }
    return { ...items, ...{ [menuItem.id]: menuItem } };
  }, {});
  Object.values(normalizedItemList).forEach((n) => {
    delete n.menu;
  });
  return normalizedItemList;
};
