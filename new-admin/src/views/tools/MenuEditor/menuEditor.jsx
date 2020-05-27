import React from "react";
import { Component } from "react";
import SaveIcon from "@material-ui/icons/SaveSharp";
import { Typography } from "@material-ui/core";
import WarningDialog from "./warningdialog.jsx";
import MenuEditorModel from "../../../models/menuEditorModel";
import Grid from "@material-ui/core/Grid";
import Modal from "@material-ui/core/Modal";
import TableCell from "@material-ui/core/TableCell";
import DragHandle from "@material-ui/icons/DragHandle";
import { withStyles } from "@material-ui/core/styles";
import TreeRow from "./treerow.jsx";
import {
  ColorButtonBlue,
  ColorButtonGreen,
  ColorButtonRed
} from "./custombuttons.jsx";

import Tree from "antd/es/tree"; //Specific import to keep bundle-size small
import "antd/es/tree/style/css"; //Specific import to keep bundle-size small

const HEADER_KEY = -2;

const styles = () => ({
  container: {
    backgroundColor: "#e8e8e8"
  },
  cell: {
    borderRight: "none",
    borderLeft: "none",
    borderColor: "#6c6c6c"
  },

  background: {
    backgroundColor: "#e8e8e8"
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
    this.model = this.getModel();
    this.model.listAllAvailableDocuments().then(list => {
      this.availableDocuments = list;
    });
  }

  getModel = () => {
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
    this.menuConfig = this.model.exportTreeAsMenuJson(
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
    if (this.canSave(this.state.tree)) {
      console.log(this.state.tree, "tree");
      this.setState({ openMenuEditor: false }, () => {
        this.save();
      });
    } else {
      console.warn("Cant save");
    }
  };

  onNewTreeRowClick = e => {
    e.preventDefault();
    this.addNewItem();
  };

  getHeader = () => {
    return (
      <Grid
        style={{ paddingTop: "10px", paddingBottom: "10px" }}
        justify="flex-end"
        container
      >
        <Grid xs={1} item>
          <DragHandle></DragHandle>
        </Grid>
        <Grid xs={2} item>
          <Typography variant="h5">Namn</Typography>
        </Grid>

        <Grid xs={9} container item>
          <Grid xs={3} item>
            <Typography variant="h5">Inställningar</Typography>
          </Grid>
          <Grid xs={3} item>
            <Typography variant="h5">Koppling</Typography>
          </Grid>

          <Grid xs={4} item>
            <ColorButtonGreen
              variant="contained"
              onClick={this.onNewTreeRowClick}
            >
              <Typography variant="button">Ny menylänk</Typography>
            </ColorButtonGreen>
            <ColorButtonBlue
              variant="contained"
              className="btn"
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
    let menuItem = this.props.model.getNewMenuItemObject();
    let newTree = [...this.state.tree];
    newTree.push(this.createTreeChild(menuItem));
    this.setState({ tree: newTree });
  };

  addHeaderRowToTreeStructure = treeData => {
    treeData.unshift({
      title: this.getHeader(),
      disabled: true,
      children: [],
      menuItem: [],
      key: HEADER_KEY
    });
  };

  getTreeView = () => {
    return this.model.loadMenuConfigForMap("map_1").then(menuConfig => {
      this.menuConfig = menuConfig.options.menuConfig;
      let treeData = this.createTreeStructure(this.menuConfig.menu);
      this.addHeaderRowToTreeStructure(treeData);
      return treeData;
    });
  };

  createTreeStructure = menu => {
    this.treeKeys = [];
    let tree = this.createTree(menu);
    tree.forEach(treeNode => {
      this.model.setParent(treeNode, undefined);
    });
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

  getRowComponent = (menuItem, key, valid) => {
    console.log(menuItem, "menuItem");
    return (
      <TreeRow
        iconLibraryLink={this.state.iconLibraryLink}
        updateMenuItem={this.updateMenuItem}
        deleteMenuItem={this.deleteMenuItem}
        model={this.model}
        availableDocuments={this.availableDocuments}
        menuItem={menuItem}
        updateValidationForTreeNode={this.updateValidationForTreeNode}
        updateValidation={this.updateValidation}
        valid={valid}
        treeNodeId={key}
      ></TreeRow>
    );
  };

  updateValidationForTreeNode = treeNodeId => {
    let newTree = [...this.state.tree];
    let foundTreeNode = this.model.findInTree(newTree, treeNodeId);
    this.updateValidation(foundTreeNode);
  };

  updateValidation = treeNode => {
    var valid = this.isSelectionValid(treeNode.menuItem, treeNode.children);
    treeNode.title = this.getRowComponent(
      treeNode.menuItem,
      treeNode.key,
      valid
    );

    if (treeNode.children.length > 0) {
      treeNode.children.forEach(child => {
        this.updateValidation(child);
      });
    }
  };

  createTreeChild = menuItem => {
    let children = [];

    if (menuItem.menu.length > 0) {
      children = this.createTree(menuItem.menu);
    }

    let key = this.getNewTreeKey().toString();
    let valid = this.isSelectionValid(menuItem, children);

    return {
      title: this.getRowComponent(menuItem, key, valid),
      children: children,
      selectable: false,
      menuItem: this.model.getMenuItemWithoutChildren(menuItem),
      key: key
    };
  };

  canSave = tree => {
    return tree.some(treeNode => {
      return this.checkForInvalidTreeNodes(treeNode);
    });
  };

  checkForInvalidTreeNodes = treeNode => {
    console.log(treeNode, "treeNode");
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
  };

  isSameNode = (foundDropNode, foundDragNode) => {
    return foundDropNode.key === foundDragNode.key;
  };

  isSelectionValid = (menuItem, children) => {
    if (
      (menuItem.maplink || menuItem.document || menuItem.link) &&
      children.length > 0
    ) {
      return false;
    }

    return true;
  };

  updateTreeValidation = tree => {
    tree.forEach(treeNode => {
      if (treeNode.key != HEADER_KEY) {
        this.updateValidation(treeNode);
      }
    });
  };

  onDropNode = info => {
    const dropKey = info.node.props.eventKey;
    const dragKey = info.dragNode.props.eventKey;
    let newTree = [...this.state.tree];
    let foundDragNode = this.model.getNodeFromTree(newTree, dragKey);
    let foundDropNode = this.model.getNodeFromTree(newTree, dropKey);

    if (!this.isSameNode(foundDropNode, foundDragNode)) {
      this.model.updateDragNode(newTree, foundDragNode, foundDropNode);
      this.model.addToDropNode(foundDropNode, foundDragNode);
      this.updateTreeValidation(newTree);
      this.setState({ tree: newTree });
    }
  };

  updateMenuItem = (treeNodeId, objectWithKeyValuesToUpdate) => {
    let newTreeState = [...this.state.tree];
    let treeNode = this.model.findInTree(newTreeState, treeNodeId);
    if (treeNode) {
      treeNode.menuItem = {
        ...treeNode.menuItem,
        ...objectWithKeyValuesToUpdate
      };
      var valid = this.isSelectionValid(treeNode.menuItem, treeNode.children);
      console.log(treeNode.menuItem, "MENU");
      treeNode.title = this.getRowComponent(
        treeNode.menuItem,
        treeNode.key,
        valid
      );
      this.setState({ tree: newTreeState });
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
    let treeNode = this.model.findInTree(newTreeState, treeNodeId);
    if (this.isRootNode(treeNode)) {
      this.deleteTreeNode(newTreeState, treeNode);
    } else {
      this.deleteTreeNode(treeNode.parent.children, treeNode);
    }
    this.updateTreeValidation(newTreeState);
    this.setState({ tree: newTreeState });
  };

  renderTableCell = columnName => {
    const { classes } = this.props;
    return (
      <TableCell key={columnName} className={classes.cell}>
        <Typography>{columnName}</Typography>
      </TableCell>
    );
  };

  onEditMenuClick = e => {
    e.preventDefault();
    this.getTreeView().then(treeData => {
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
              Redigera meny
            </ColorButtonBlue>
          </p>
          <div>
            <input
              id="active"
              name="active"
              type="checkbox"
              onChange={e => {
                this.handleInputChange(e);
              }}
              checked={this.state.active}
            />
            &nbsp;
            <label htmlFor="active">Aktiverad</label>
          </div>

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
                      height="1000px"
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
