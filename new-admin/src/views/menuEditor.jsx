import React, { Component } from "react";
import MenuEditorModel from "../models/menuEditorModel";
import Grid from "@material-ui/core/Grid";
import Table from "@material-ui/core/Table";

import InputLabel from "@material-ui/core/InputLabel";

import FormControl from "@material-ui/core/FormControl";

import TableCell from "@material-ui/core/TableCell";

import DeleteIcon from "@material-ui/icons/Delete";
import SettingsIcon from "@material-ui/icons/Settings";
import DragHandle from "@material-ui/icons/DragHandle";
import TableHead from "@material-ui/core/TableHead";
import ListItemIcon from "@material-ui/core/ListItemIcon";

import TableRow from "@material-ui/core/TableRow";
import { withStyles } from "@material-ui/core/styles";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import { IconButton } from "@material-ui/core";
import Tree from "antd/es/tree"; //Specific import to keep bundle-size small
import "antd/es/tree/style/css"; //Specific import to keep bundle-size small
import { Typography } from "@material-ui/core";

const MENU_CONNECTION_TYPES = [
  "Koppla dokument",
  "Koppla karta och lager",
  "Koppla webblänk"
];

const styles = theme => ({
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

class MenuConnectionSelector extends React.Component {
  state = { value: this.props.menuItem.title };

  renderConnectionMenuSelectOption = (title, index) => {
    return (
      <MenuItem key={index} value={title}>
        <ListItemIcon>
          <SettingsIcon></SettingsIcon>
        </ListItemIcon>
        <Typography>{title}</Typography>
      </MenuItem>
    );
  };

  handleChange = e => {
    console.log(e, "e");
    this.setState({ value: e.target.value });
  };
  render = () => {
    return (
      <FormControl>
        <Select
          MenuProps={{
            disableScrollLock: true,
            anchorOrigin: {
              vertical: "bottom",
              horizontal: "left"
            },
            transformOrigin: {
              vertical: "top",
              horizontal: "left"
            },
            getContentAnchorEl: null
          }}
          onChange={this.handleChange}
          renderValue={value => {
            return value;
          }}
          value={this.state.value}
        >
          {MENU_CONNECTION_TYPES.map((title, index) => {
            return this.renderConnectionMenuSelectOption(title, index);
          })}
        </Select>
      </FormControl>
    );
  };
}

class MenuEditor extends Component {
  state = {
    menuConfig: null
  };

  treeKeys = [];

  constructor(props) {
    super(props);
    this.model = this.getModel();
  }

  componentDidMount = () => {
    this.model.loadMenuConfigForMap("map_1").then(menu => {
      let treeData = this.create(menu);
      console.log(treeData, "treeData");
      this.setState({ tree: treeData }, () => {});
    });
  };

  getModel = () => {
    return new MenuEditorModel({
      config: this.props.config
    });
  };

  create = menu => {
    console.log(menu, "menu");
    this.treeKeys = [];
    let tree = this.createTree(menu);
    tree.forEach(treeNode => {
      this.setParent(treeNode, undefined);
    });
    return tree;
  };

  setParent(treeNode, parent) {
    treeNode.parent = parent;

    if (treeNode.children.length > 0) {
      treeNode.children.forEach(child => {
        this.setParent(child, treeNode);
      });
    }
  }

  createTree = menu => {
    return menu.map(menuItem => {
      console.log(menuItem, "menuItem");
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

  createTreeChild = menuItem => {
    let children = [];
    if (menuItem.menu.length > 0) {
      console.log(menuItem.menu, "menuitemmenu");
      children = this.createTree(menuItem.menu);
    }
    return {
      title: this.renderMenuRow(menuItem),
      children: children,
      menuItem: menuItem,
      key: this.getNewTreeKey().toString()
    };
  };

  renderSettingsMenu = () => {
    return (
      <IconButton>
        <SettingsIcon></SettingsIcon>
      </IconButton>
    );
  };

  renderConnectionSelect = menuItem => {
    return (
      <MenuConnectionSelector menuItem={menuItem}></MenuConnectionSelector>
    );
  };

  deleteMenuItem = menuItem => {
    let newState = [...this.state.menuConfig];
    newState.splice(this.state.menuConfig.indexOf(menuItem), 1);
    this.setState({ menuConfig: newState });
  };

  updateMenuItem = menuItem => {
    let newMenuItem = { ...menuItem, title: "hej" };
    console.log(newMenuItem, "newMenuItem");
    let newState = [...this.state.menuConfig];
    newState[this.state.menuConfig.indexOf(menuItem)] = newMenuItem;
    this.setState({ menuConfig: newState });
  };

  findMenuItem = menuItem => {
    if (this.state.menuConfig.indexOf(menuItem)) {
      return this.state.menuConfig;
    }
  };

  renderRemoveButton = menuItem => {
    return (
      <IconButton
        onClick={() => {
          this.deleteMenuItem(menuItem);
        }}
      >
        <DeleteIcon></DeleteIcon>
      </IconButton>
    );
  };

  renderMenuTitle = menuItem => {
    return <Typography>{menuItem.title}</Typography>;
  };

  renderMenuRow = menuItem => {
    return (
      <Grid justify="flex-end" container>
        <Grid xs={1} item>
          <DragHandle></DragHandle>
        </Grid>
        <Grid xs={2} item>
          {this.renderMenuTitle(menuItem)}
        </Grid>
        <Grid xs={9} container item>
          <Grid xs={3} item>
            {this.renderSettingsMenu()}
          </Grid>
          <Grid xs={3} item>
            {this.renderConnectionSelect(menuItem)}
          </Grid>
          <Grid xs={3} item>
            {this.renderRemoveButton(menuItem)}
          </Grid>
        </Grid>
      </Grid>
    );
  };

  renderTableCell = columnName => {
    const { classes } = this.props;
    return (
      <TableCell key={columnName} className={classes.cell}>
        <Typography>{columnName}</Typography>
      </TableCell>
    );
  };

  renderTableHeader = () => {
    const { classes } = this.props;
    return (
      <Table className={classes.background}>
        <TableHead>
          <TableRow>
            {["Namn", "Koppling", "Färg", "Synlig"].map(columnName => {
              return this.renderTableCell(columnName);
            })}
          </TableRow>
        </TableHead>
      </Table>
    );
  };

  find = (tree, key) => {
    console.log(tree, "tree");
    let foundNode = null;
    tree.forEach(treeNode => {
      let found = this.findNode(treeNode, key);
      if (found) {
        foundNode = found;
        console.log(foundNode, "foundNode");
      }
    });
    return foundNode;
  };

  findNode = (treeNode, key) => {
    if (treeNode.key == key) {
      console.log(treeNode, "treeNode", key, "key");
      return treeNode;
    } else {
      if (treeNode.children.length > 0) {
        return this.find(treeNode.children, key);
      }
    }
  };

  getTreeObject = (newTree, node) => {
    return newTree.find(treeNode => {
      if (treeNode.key == node.key) {
        console.log(treeNode, "treeNode");
        return treeNode;
      } else {
        if (treeNode.children.length > 0) {
          return this.getTreeObject(treeNode.children, node);
        }
      }
    });
  };

  getNodeFromTree = (tree, key) => {
    return this.find(tree, key);
  };

  addToDropNode = (nodeToBeAddedTo, nodeToAdd) => {
    nodeToBeAddedTo.children.push(nodeToAdd);
    nodeToBeAddedTo.menuItem.menu.push(nodeToAdd.menuItem);
  };

  updateDragNode = (newTree, dragNode, dropNode) => {
    console.log(dragNode.parent, "dragNode.parent");
    if (dragNode.parent) {
      dragNode.parent.children.splice(
        dragNode.parent.children.indexOf(dragNode),
        1
      );
    } else {
      newTree.splice(newTree.indexOf(dragNode), 1);
    }
    dragNode.parent = { ...dropNode };
  };

  rearrangeTree = info => {
    const dropKey = info.node.props.eventKey;
    const dragKey = info.dragNode.props.eventKey;
    console.log(dropKey, "dropKey");
    console.log(dragKey, "dragKey");
    let foundDropNode = null;
    let foundDragNode = null;
    let newTree = [...this.state.tree];

    foundDragNode = this.getNodeFromTree(newTree, dragKey);
    foundDropNode = this.getNodeFromTree(newTree, dropKey);
    console.log(foundDropNode, "foundDropNode");
    console.log(foundDragNode, "foundDragNode");
    if (foundDropNode.key != foundDragNode.key) {
      this.updateDragNode(newTree, foundDragNode, foundDropNode);
      this.addToDropNode(foundDropNode, foundDragNode);

      this.setState({ tree: newTree });
    }
  };

  onDrop = (info, tree) => {};

  render() {
    let expandedKeys = this.treeKeys.map(key => {
      return key.toString();
    });

    const { classes } = this.props;
    console.log(this.state.tree);
    return (
      <section className="tab-pane active">
        {this.renderTableHeader()}
        <Grid>
          {this.state.tree && expandedKeys && (
            <Tree
              className={classes.background}
              blockNode
              onDrop={this.rearrangeTree}
              expandedKeys={expandedKeys}
              treeData={this.state.tree}
              draggable
            ></Tree>
          )}
        </Grid>
      </section>
    );
  }
}

export default withStyles(styles)(MenuEditor);
