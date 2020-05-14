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

  createMenuFromTreeStructure: function(menu, tree) {
    console.log(tree, "TREE");
    tree.forEach(treeNode => {
      if (treeNode.children.length > 0) {
        console.log(menu, "menu");
        menu.push(treeNode.menuItem);
        treeNode.menuItem.menu = [];
        return this.createMenuFromTreeStructure(
          treeNode.menuItem.menu,
          treeNode.children
        );
      } else {
        console.log(menu, "menu2");
        console.log(treeNode, "treeNode2");
        menu.push(treeNode.menuItem);
      }
    });
    return menu;
  },

  removeHeaderTreeRow: function(tree) {
    tree.shift();
  },

  exportTreeAsMenuJson: function(tree, menuConfig) {
    this.removeHeaderTreeRow(tree);
    menuConfig.menu = this.createMenuFromTreeStructure([], tree);
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
