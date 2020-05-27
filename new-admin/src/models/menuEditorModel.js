import { Model } from "backbone";

const fetchConfig = {
  credentials: "same-origin"
};

var menuEditorModel = Model.extend({
  constructor: function(settings) {
    this.config = settings.config;
    console.log(this.config, "config");
  },

  async listAllAvailableDocuments() {
    try {
      return fetch(this.config.url_document_list, fetchConfig).then(
        response => {
          return response.text().then(text => {
            return JSON.parse(text);
          });
        }
      );
    } catch (err) {}
  },

  removeNodeFromParent: function(node, newTree) {
    if (node.parent) {
      node.parent.children.splice(node.parent.children.indexOf(node), 1);
    } else {
      newTree.splice(newTree.indexOf(node), 1);
    }
  },
  addToDropNode: function(nodeToBeAddedTo, nodeToAdd) {
    nodeToBeAddedTo.children.push(nodeToAdd);
  },

  setParentOfNode: function(node, newParentNode) {
    node.parent = { ...newParentNode };
  },

  updateDragNode: function(newTree, dragNode, dropNode) {
    this.removeNodeFromParent(dragNode, newTree);
    this.setParentOfNode(dragNode, dropNode);
  },

  getNodeFromTree: function(tree, key) {
    let foundNode = null;
    tree.forEach(treeNode => {
      let found = this.findNode(treeNode, key);
      if (found) {
        foundNode = found;
      }
    });
    return foundNode;
  },

  findNode: function(treeNode, key) {
    if (treeNode.key === key) {
      return treeNode;
    } else {
      if (treeNode.children.length > 0) {
        return this.getNodeFromTree(treeNode.children, key);
      }
    }
  },

  //We remove children of menuItem and uses structure of tree as hierarchy for menu instead
  getMenuItemWithoutChildren: function(menuItem) {
    let strippedMenuitem = { ...menuItem };
    strippedMenuitem.menu = [];
    return strippedMenuitem;
  },

  setParent: function(treeNode, parent) {
    treeNode.parent = parent;
    if (treeNode.children.length > 0) {
      treeNode.children.forEach(child => {
        this.setParent(child, treeNode);
      });
    }
  },

  canSave: function(tree) {
    return tree.some(treeNode => {
      return this.checkForInvalidTreeNodes(treeNode);
    });
  },

  setParentForAllTreeNodes: function(tree) {
    tree.forEach(treeNode => {
      this.setParent(treeNode, undefined);
    });
  },

  isSameNode: function(foundDropNode, foundDragNode) {
    return foundDropNode.key === foundDragNode.key;
  },

  isSelectionValid: function(menuItem, children) {
    if (
      (menuItem.maplink || menuItem.document || menuItem.link) &&
      children.length > 0
    ) {
      return false;
    }

    return true;
  },

  createMenuFromTreeStructure: function(menu, tree) {
    tree.forEach(treeNode => {
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

  removeHeaderTreeRow: function(tree) {
    tree.shift();
  },

  checkForInvalidTreeNodes: function(treeNode) {
    if (!treeNode.title.props.valid) {
      return false;
    } else {
      if (treeNode.children.length > 0) {
        treeNode.children.forEach(child => {
          return this.checkForInvalidTreeNodes(child);
        });
      }
      return true;
    }
  },

  getNewMenuItemObject: function() {
    return {
      title: "",
      document: "",
      color: "",
      icon: {
        materialUiIconName: "",
        fontSize: "large"
      },
      maplink: "",
      link: "",
      menu: []
    };
  },

  //Can this recursion be written better????
  findInTree: function(tree, key) {
    return tree
      .map(treeNode => {
        var found = this.findTreeNode(treeNode, key);
        return found;
      })
      .filter(res => {
        return res !== undefined;
      })[0];
  },
  //Can this recursion be written better????
  findTreeNode: function(treeNode, key) {
    if (treeNode.key === key) {
      return treeNode;
    } else {
      if (treeNode.children.length > 0) {
        return this.findInTree(treeNode.children, key);
      }
    }
  },

  exportTreeAsMenuJson: function(tree, menuConfig) {
    this.removeHeaderTreeRow(tree);
    console.log(tree, "treeBeforeExport");
    menuConfig.menu = this.createMenuFromTreeStructure([], tree);
    console.log(menuConfig, "menuConfig");
    return menuConfig;
  },

  loadMenuConfigForMap: function(map) {
    var url = this.config.url_map + "/" + map;
    return fetch(url, { credentials: "same-origin" }).then(response => {
      return response.json().then(data => {
        let documentHandler = data.tools.find(tool => {
          return tool.type === "documenthandler";
        });
        return documentHandler;
      });
    });
  }
});

export default menuEditorModel;
