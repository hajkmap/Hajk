import { Model } from "backbone";
import { hfetch } from "utils/FetchWrapper";

var menuEditorModel = Model.extend({
  constructor: function (settings) {
    this.config = settings.config;
  },

  loadFolders: async function (callback) {
    try {
      return hfetch(this.config.url_folder_list).then((response) => {
        return response.text().then((text) => {
          return JSON.parse(text);
        });
      });
    } catch (err) {
      alert(
        "Kunde inte ladda mappen med mappar. Verifiera att uppsättningen är korrekt utförd."
      );
      console.error(err);
    }
  },

  async listAllAvailableDocuments(folder) {
    try {
      if (folder) {
        return hfetch(this.config.url_document_list + "/" + folder).then(
          (response) => {
            return response.text().then((text) => {
              return JSON.parse(text);
            });
          }
        );
      } else {
        return hfetch(this.config.url_document_list).then((response) => {
          return response.text().then((text) => {
            return JSON.parse(text);
          });
        });
      }
    } catch (err) {}
  },

  isParentRootOfTree: function (parent) {
    return parent === undefined ? true : false;
  },

  insertBeforeDropNode: function (foundDropNode, foundDragNode, tree) {
    var children = foundDropNode.parent ? foundDropNode.parent.children : tree;
    children.splice(children.indexOf(foundDropNode), 0, foundDragNode);
  },

  insertAfterDropNode: function (foundDropNode, foundDragNode, tree) {
    var children = foundDropNode.parent ? foundDropNode.parent.children : tree;
    children.splice(children.indexOf(foundDropNode) + 1, 0, foundDragNode);
  },

  addToDropNode: function (newTree, foundDragNode, foundDropNode) {
    this.updateDragNode(newTree, foundDragNode, foundDropNode);
    this.addToNode(foundDropNode, foundDragNode);
  },

  addToGap: function (newTree, foundDragNode, foundDropNode, info) {
    this.removeNodeFromParent(foundDragNode, newTree);
    this.setParentOfNode(foundDragNode, foundDropNode.parent);

    if (info.node.dragOverGapBottom) {
      this.insertAfterDropNode(foundDropNode, foundDragNode, newTree);
    }
    if (info.node.dragOverGapTop) {
      this.insertBeforeDropNode(foundDropNode, foundDragNode, newTree);
    }
  },

  addToTreeRoot: function (newTree, foundDragNode, foundDropNode, info) {
    this.removeNodeFromParent(foundDragNode, newTree);
    this.setParentOfNode(foundDragNode, foundDropNode.parent);

    if (info.node.dragOverGapBottom) {
      this.insertAfterDropNode(foundDropNode, foundDragNode, newTree);
    }
    if (info.node.dragOverGapTop) {
      this.insertBeforeDropNode(foundDropNode, foundDragNode, newTree);
    }
  },

  removeNodeFromParent: function (node, newTree) {
    if (node.parent) {
      node.parent.children.splice(node.parent.children.indexOf(node), 1);
    } else {
      newTree.splice(newTree.indexOf(node), 1);
    }
  },

  addToNode: function (nodeToBeAddedTo, nodeToAdd) {
    nodeToBeAddedTo.children.push(nodeToAdd);
  },

  setParentOfNode: function (node, newParentNode) {
    if (newParentNode) {
      node.parent = { ...newParentNode };
    } else {
      node.parent = undefined;
    }
  },

  updateDragNode: function (newTree, dragNode, dropNode) {
    this.removeNodeFromParent(dragNode, newTree);
    this.setParentOfNode(dragNode, dropNode);
  },

  getNodeFromTree: function (tree, key) {
    let foundNode = null;
    tree.forEach((treeNode) => {
      let found = this.findNode(treeNode, key);
      if (found) {
        foundNode = found;
      }
    });
    return foundNode;
  },

  findNode: function (treeNode, key) {
    if (treeNode.key === key) {
      return treeNode;
    } else {
      if (treeNode.children.length > 0) {
        return this.getNodeFromTree(treeNode.children, key);
      }
    }
  },

  //We remove children of menuItem and uses structure of tree as hierarchy for menu instead
  getMenuItemWithoutChildren: function (menuItem) {
    let strippedMenuitem = { ...menuItem };
    strippedMenuitem.menu = [];
    return strippedMenuitem;
  },

  setParent: function (treeNode, parent) {
    treeNode.parent = parent;
    if (treeNode.children.length > 0) {
      treeNode.children.forEach((child) => {
        this.setParent(child, treeNode);
      });
    }
  },

  canSave: function (tree) {
    return !this.hasTreeInvalidTreeNodes(tree);
  },

  setParentForAllTreeNodes: function (tree) {
    tree.forEach((treeNode) => {
      this.setParent(treeNode, undefined);
    });
  },

  isSameNode: function (foundDropNode, foundDragNode) {
    return foundDropNode.key === foundDragNode.key;
  },

  isSelectionValid: function (menuItem, children) {
    if (
      (menuItem.maplink || menuItem.document || menuItem.link) &&
      children.length > 0
    ) {
      return false;
    }

    return true;
  },

  createMenuFromTreeStructure: function (menu, tree) {
    tree.forEach((treeNode) => {
      if (treeNode.children.length > 0) {
        menu.push(treeNode.menuItem);
        treeNode.menuItem.menu = [];
        return this.createMenuFromTreeStructure(
          treeNode.menuItem.menu,
          treeNode.children
        );
      } else {
        menu.push(treeNode.menuItem);
      }
    });
    return menu;
  },

  removeHeaderTreeRow: function (tree) {
    tree.shift();
  },

  hasTreeInvalidTreeNodes: function (tree) {
    return tree.some((treeNode) => {
      return this.hasInvalidTreeNodes(treeNode);
    });
  },

  hasInvalidTreeNodes: function (treeNode) {
    if (!treeNode.title.props.valid) {
      return true;
    } else {
      if (treeNode.children.length > 0) {
        return this.hasTreeInvalidTreeNodes(treeNode.children);
      }
      return false;
    }
  },

  getNewMenuItemObject: function () {
    return {
      title: "",
      folder: "",
      document: "",
      color: "",
      icon: {
        materialUiIconName: "",
        fontSize: "large",
      },
      maplink: "",
      link: "",
      menu: [],
    };
  },

  //Can this recursion be written better????
  findInTree: function (tree, key) {
    return tree
      .map((treeNode) => {
        var found = this.findTreeNode(treeNode, key);
        return found;
      })
      .filter((res) => {
        return res !== undefined;
      })[0];
  },
  //Can this recursion be written better????
  findTreeNode: function (treeNode, key) {
    if (treeNode.key === key) {
      return treeNode;
    } else {
      if (treeNode.children.length > 0) {
        return this.findInTree(treeNode.children, key);
      }
    }
  },

  exportTreeAsMenuJson: function (tree, menuConfig) {
    this.removeHeaderTreeRow(tree);
    menuConfig.menu = this.createMenuFromTreeStructure([], tree);
    return menuConfig;
  },

  loadMenuConfigForMap: function (map) {
    var url = this.config.url_map + "/" + map;
    return hfetch(url).then((response) => {
      return response.json().then((data) => {
        let documentHandler = data.tools.find((tool) => {
          return tool.type === "documenthandler";
        });
        return documentHandler;
      });
    });
  },
});

export default menuEditorModel;
