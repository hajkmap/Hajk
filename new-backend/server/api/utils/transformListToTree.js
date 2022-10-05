/**
 *
 * @param {Array} items The flat array to be transformed into a nested tree
 * @param {any} id The ID of parent
 * @param {String} parentColumnName The property name that contains the reference to the parent
 * @returns
 */
export const transformListToTree = (items, id = null, parentColumnName) =>
  items
    .filter((item) => item[parentColumnName] === id)
    .map((item) => ({
      ...item,
      children: transformListToTree(items, item.id, parentColumnName),
    }));
