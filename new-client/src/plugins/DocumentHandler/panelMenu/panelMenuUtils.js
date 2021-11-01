const getTopLevelItem = (clickedItem, allItems) => {
  //earlier, this would have been 0, but because of the printId offset, it's not.
  if (!clickedItem.parentId) {
    return clickedItem;
  } else {
    return Object.values(allItems).find((item) => {
      return item.allChildren.indexOf(clickedItem.id) > -1;
    });
  }
};

export const getItemIdsToColor = (clickedItem, allItems) => {
  const topLevelItem = getTopLevelItem(clickedItem, allItems);
  return [topLevelItem.id, ...topLevelItem.allChildren];
};

export const isExpandedTopLevelItem = (item) => {
  return item.hasSubMenu && item.expandedSubMenu && item.level === 0;
};

export const findMenuItemWithDocumentName = (documentName, itemsToSearch) => {
  return Object.values(itemsToSearch).find((item) => {
    return item.document === documentName;
  });
};
