import React from "react";
import { Component } from "react";
import SaveIcon from "@material-ui/icons/SaveSharp";
import MenuEditorModel from "../../../models/menuEditorModel";
import Grid from "@material-ui/core/Grid";
import Modal from "@material-ui/core/Modal";
import DragHandle from "@material-ui/icons/DragHandle";
import TreeRow from "./treerow.jsx";
import { withStyles, ThemeProvider } from "@material-ui/core/styles";
import { Typography } from "@material-ui/core";

import {
  ColorButtonBlue,
  ColorButtonGreen,
  ColorButtonRed
} from "./custombuttons.jsx";

import Tree from "antd/es/tree"; //Specific import to keep bundle-size small
import "antd/es/tree/style/css"; //Specific import to keep bundle-size small

const HEADER_KEY = -2;

const styles = theme => ({
  background: {
    backgroundColor: "#e8e8e8"
  },
  header: {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1)
  }
});

class ToolOptions extends Component {
  state = {
    active: false,
    index: 0,
    title: "Visa informationsruta",
    overlayLogoUrl: "http://localhost:3000/logo-share.png",
    openOverlayButtonColor: "#ffffff",
    showScrollButtonLimit: 400,
    width: 600,
    height: "90vh",
    menuConfig: {},
    iconLibraryLink: "https://material.io/resources/icons/?style=baseline",
    openMenuEditor: false,
    validationErrors: []
  };
  treeKeys = [];
  menuConfig = null;
  availableDocuments = [];

  constructor(props) {
    super(props);
    this.type = "documenthandler";
    this.mapSettingsModel = props.model;
    this.menuEditorModel = this.getMenuEditorModel();
    this.menuEditorModel.listAllAvailableDocuments().then(list => {
      this.availableDocuments = list;
    });
  }

  getMenuEditorModel = () => {
    return new MenuEditorModel({
      config: this.props.model.get("config")
    });
  };

  // Methods copied from other admin-tools to save settings correctly
  //
  //
  componentDidMount = () => {
    var tool = this.getTool();
    if (tool) {
      this.setState({
        active: true,
        index: tool.index,
        title: tool.options.title || "",
        overlayLogoUrl: tool.options.overlayLogoUrl,
        openOverlayButtonColor: tool.options.openOverlayButtonColor,
        showScrollButtonLimit: tool.options.showScrollButtonLimit,
        width: tool.options.width,
        height: tool.options.height,
        menuConfig: tool.options.menuConfig,
        iconLibraryLink: tool.options.iconLibraryLink
      });
    } else {
      this.setState({
        active: false
      });
    }
  };

  handleInputChange(event) {
    const target = event.target;
    const name = target.name;
    var value = target.type === "checkbox" ? target.checked : target.value;
    if (typeof value === "string" && value.trim() !== "") {
      value = !isNaN(Number(value)) ? Number(value) : value;
    }
    this.setState({
      [name]: value
    });
  }

  getTool() {
    return this.props.model
      .get("toolConfig")
      .find(tool => tool.type === this.type);
  }

  add(tool) {
    this.props.model.get("toolConfig").push(tool);
  }

  remove() {
    this.props.model.set({
      toolConfig: this.props.model
        .get("toolConfig")
        .filter(tool => tool.type !== this.type)
    });
  }

  replace(tool) {
    this.props.model.get("toolConfig").forEach(t => {
      if (t.type === this.type) {
        t.options = tool.options;
        t.index = tool.index;
      }
    });
  }

  save() {
    this.menuConfig = this.menuEditorModel.exportTreeAsMenuJson(
      this.state.tree,
      this.menuConfig
    );
    var tool = {
      type: this.type,
      index: this.state.index,
      options: {
        title: this.state.title,
        overlayLogoUrl: this.state.overlayLogoUrl,
        openOverlayButtonColor: this.state.openOverlayButtonColor,
        showScrollButtonLimit: this.state.showScrollButtonLimit,
        iconLibraryLink: this.state.iconLibraryLink,
        width: this.state.width,
        height: this.state.height,
        menuConfig: this.menuConfig
      }
    };

    var existing = this.getTool();

    function update() {
      this.props.model.updateToolConfig(
        this.props.model.get("toolConfig"),
        () => {
          this.props.parent.props.parent.setState({
            alert: true,
            alertMessage: "Uppdateringen lyckades"
          });
        }
      );
    }
    if (!this.state.active) {
      if (existing) {
        this.props.parent.props.parent.setState({
          alert: true,
          confirm: true,
          alertMessage:
            "Verktyget kommer att tas bort. Nuvarande inställningar kommer att gå förlorade. Vill du fortsätta?",
          confirmAction: () => {
            this.remove();
            update.call(this);
          }
        });
      } else {
        this.remove();
        update.call(this);
      }
    } else {
      if (existing) {
        this.replace(tool);
      } else {
        this.add(tool);
      }
      update.call(this);
    }
  }
  //
  //
  //END

  onCloseMenuEditorClick = e => {
    e.preventDefault();
    this.setState({ openMenuEditor: false, tree: [] });
  };

  onSaveMenuEditsClick = e => {
    e.preventDefault();
    this.setState({ openMenuEditor: false }, () => {
      this.save();
    });
  };

  onNewTreeRowClick = e => {
    e.preventDefault();
    this.addNewItem();
  };

  getHeader = canSave => {
    const { classes } = this.props;
    return (
      <Grid
        className={classes.header}
        spacing={1}
        alignItems="center"
        justify="flex-end"
        container
      >
        <Grid xs={1} item>
          <DragHandle></DragHandle>
        </Grid>
        <Grid xs={1} item></Grid>
        <Grid xs={2} item>
          <Typography variant="h5">Namn</Typography>
        </Grid>

        <Grid xs={8} container item>
          <Grid xs={3} item>
            <Typography variant="h5">Inställningar</Typography>
          </Grid>
          <Grid xs={2} item>
            <Typography variant="h5">Koppling</Typography>
          </Grid>

          <Grid ref={this.buttonHeaderRef} xs={4} item>
            <ColorButtonGreen
              variant="contained"
              className="btn"
              onClick={this.onNewTreeRowClick}
            >
              <Typography variant="button">Ny menylänk</Typography>
            </ColorButtonGreen>
            <ColorButtonBlue
              variant="contained"
              className="btn"
              disabled={!canSave}
              onClick={this.onSaveMenuEditsClick}
              startIcon={<SaveIcon />}
            >
              <Typography variant="button">Spara</Typography>
            </ColorButtonBlue>
          </Grid>
          <Grid xs={1} item></Grid>
          <Grid xs={1} item>
            <ColorButtonRed
              variant="contained"
              className="btn"
              onClick={this.onCloseMenuEditorClick}
            >
              <Typography variant="button">Avbryt</Typography>
            </ColorButtonRed>
          </Grid>
        </Grid>
      </Grid>
    );
  };

  addNewItem = () => {
    let menuItem = this.menuEditorModel.getNewMenuItemObject();
    let newTree = [...this.state.tree];
    newTree.push(this.createTreeChild(menuItem));
    this.setState({ tree: newTree });
  };

  addHeaderRowToTreeStructure = treeData => {
    treeData.unshift({
      title: this.getHeader(
        this.menuEditorModel.canSave(this.getTreeWithoutHeader(treeData))
      ),
      disabled: true,
      children: [],
      menuItem: [],
      key: HEADER_KEY
    });
  };

  getTreeView = () => {
    return this.menuEditorModel
      .loadMenuConfigForMap(this.mapSettingsModel.get("mapFile"))
      .then(menuConfig => {
        this.menuConfig = menuConfig.options.menuConfig;
        let treeData = this.createTreeStructure(this.menuConfig.menu);
        return treeData;
      });
  };

  createTreeStructure = menu => {
    this.treeKeys = [];
    let tree = this.createTree(menu);
    this.menuEditorModel.setParentForAllTreeNodes(tree);
    return tree;
  };

  createTree = menu => {
    return menu.map(menuItem => {
      return this.createTreeChild(menuItem);
    });
  };

  getNewTreeKey = () => {
    let newKey = 0;
    if (this.treeKeys.length > 0) {
      newKey = this.treeKeys[this.treeKeys.length - 1] + 1;
    }
    this.treeKeys.push(newKey);
    return newKey;
  };

  getRowTitleComponent = (menuItem, children, key) => {
    return (
      <TreeRow
        iconLibraryLink={this.state.iconLibraryLink}
        updateMenuItem={this.updateMenuItem}
        deleteMenuItem={this.deleteMenuItem}
        model={this.menuEditorModel}
        availableDocuments={this.availableDocuments}
        menuItem={menuItem}
        updateValidationForTreeNode={this.updateValidationForTreeNode}
        valid={this.menuEditorModel.isSelectionValid(menuItem, children)}
        treeNodeId={key}
      ></TreeRow>
    );
  };

  //Need to manually update title-component because cant incorporate into render method
  updateTreeRowComponent = treeNode => {
    treeNode.title = this.getRowTitleComponent(
      treeNode.menuItem,
      treeNode.children,
      treeNode.key
    );
  };

  updateTreeValidation = tree => {
    tree.forEach(treeNode => {
      if (treeNode.key != HEADER_KEY) {
        this.updateValidation(treeNode);
      }
    });
  };

  updateValidationForTreeNode = treeNodeId => {
    let newTree = [...this.state.tree];
    let foundTreeNode = this.menuEditorModel.findInTree(newTree, treeNodeId);
    this.updateValidation(foundTreeNode);
    this.setState({ tree: newTree });
  };

  updateValidation = treeNode => {
    this.updateTreeRowComponent(treeNode);

    if (treeNode.children.length > 0) {
      treeNode.children.forEach(child => {
        this.updateValidation(child);
      });
    }
  };

  createTreeChild = menuItem => {
    let children = [];
    if (menuItem.menu && menuItem.menu.length > 0) {
      children = this.createTree(menuItem.menu);
    }
    let key = this.getNewTreeKey().toString();

    return {
      title: this.getRowTitleComponent(menuItem, children, key),
      children: children,
      selectable: false,
      menuItem: this.menuEditorModel.getMenuItemWithoutChildren(menuItem),
      key: key
    };
  };

  onDropNode = info => {
    const dropKey = info.node.props.eventKey;
    const dragKey = info.dragNode.props.eventKey;
    let newTree = [...this.state.tree];
    let foundDragNode = this.menuEditorModel.getNodeFromTree(newTree, dragKey);
    let foundDropNode = this.menuEditorModel.getNodeFromTree(newTree, dropKey);

    if (!this.menuEditorModel.isSameNode(foundDropNode, foundDragNode)) {
      if (info.dropToGap) {
        if (this.menuEditorModel.isParentRootOfTree(foundDropNode.parent)) {
          this.menuEditorModel.addToTreeRoot(
            newTree,
            foundDragNode,
            foundDropNode,
            info
          );
        } else {
          this.menuEditorModel.addToGap(
            newTree,
            foundDragNode,
            foundDropNode,
            info
          );
        }
      } else {
        this.menuEditorModel.addToDropNode(
          newTree,
          foundDragNode,
          foundDropNode
        );
      }

      this.saveNewTree(newTree);
    }
  };

  getTreeWithoutHeader = tree => {
    return tree.filter(treeNode => {
      return treeNode.key != HEADER_KEY;
    });
  };

  //Need to manually update title-component because cant incorporate into render method
  saveNewTree = newTree => {
    this.updateTreeValidation(newTree);
    newTree[0].title = this.getHeader(
      this.menuEditorModel.canSave(this.getTreeWithoutHeader(newTree))
    );
    this.setState({ tree: newTree });
  };

  updateMenuItem = (treeNodeId, objectWithKeyValuesToUpdate) => {
    let newTreeState = [...this.state.tree];
    let treeNode = this.menuEditorModel.findInTree(newTreeState, treeNodeId);
    if (treeNode) {
      treeNode.menuItem = {
        ...treeNode.menuItem,
        ...objectWithKeyValuesToUpdate
      };

      this.updateTreeRowComponent(treeNode);
      this.saveNewTree(newTreeState);
    }
    return treeNode;
  };

  deleteTreeNode = (nodeArrayToSearch, treeNodeToDelete) => {
    nodeArrayToSearch.forEach(child => {
      if (child.key === treeNodeToDelete.key) {
        nodeArrayToSearch.splice(
          nodeArrayToSearch.indexOf(treeNodeToDelete),
          1
        );
      }
    });
  };

  isRootNode = treeNode => {
    return treeNode.parent === undefined ? true : false;
  };

  deleteMenuItem = treeNodeId => {
    let newTreeState = [...this.state.tree];
    let treeNode = this.menuEditorModel.findInTree(newTreeState, treeNodeId);
    if (this.isRootNode(treeNode)) {
      this.deleteTreeNode(newTreeState, treeNode);
    } else {
      this.deleteTreeNode(treeNode.parent.children, treeNode);
    }
    this.saveNewTree(newTreeState);
  };

  onEditMenuClick = e => {
    e.preventDefault();
    this.getTreeView().then(treeData => {
      this.addHeaderRowToTreeStructure(treeData);
      this.setState({ openMenuEditor: true, tree: treeData });
    });
  };

  render() {
    const { classes } = this.props;
    let expandedKeys = this.treeKeys.map(key => {
      return key.toString();
    });

    return (
      <div>
        <form>
          <p>
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={this.onEditMenuClick}
              startIcon={<SaveIcon />}
            >
              <Typography variant="button">Redigera meny</Typography>
            </ColorButtonBlue>
          </p>

          <section className="tab-pane active">
            <Modal
              style={{
                position: "absolute",
                top: "100px",
                left: "100px",
                right: "100px"
              }}
              open={this.state.openMenuEditor}
            >
              {this.state.tree && expandedKeys ? (
                <Grid className={classes.background} container>
                  <Grid xs={12} item>
                    <Tree
                      blockNode
                      switcherIcon={<></>}
                      onDrop={this.onDropNode}
                      expandedKeys={expandedKeys}
                      treeData={this.state.tree}
                      draggable
                    ></Tree>
                  </Grid>
                </Grid>
              ) : (
                <></>
              )}
            </Modal>
          </section>
        </form>
      </div>
    );
  }
}

export default withStyles(styles)(ToolOptions);
