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
    treeData: []
  };

  treeKeys = [];
  menuConfig = null;

  constructor(props) {
    super(props);
    this.model = this.getModel();
  }

  componentDidMount = () => {
    this.model.loadMenuConfigForMap("map_1").then(menuConfig => {
      this.menuConfig = menuConfig;
      let treeData = this.createTreeStructure(
        menuConfig.options.menuConfig.menu
      );
      this.setState({ tree: treeData }, () => {});
    });
  };

  getModel = () => {
    return new MenuEditorModel({
      config: this.props.config
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

  createTreeChild = menuItem => {
    let children = [];
    if (menuItem.menu.length > 0) {
      children = this.createTree(menuItem.menu);
    }

    return {
      title: this.renderMenuRow(menuItem),
      children: children,
      menuItem: this.model.getMenuItemWithoutChildren(menuItem),
      key: this.getNewTreeKey().toString()
    };
  };

  /*WIP
  deleteMenuItem = (menuItem) => {
    let newState = [...this.state.menuConfig];
    newState.splice(this.state.menuConfig.indexOf(menuItem), 1);
    this.setState({ menuConfig: newState });
  };

  updateMenuItem = (menuItem) => {
    let newMenuItem = { ...menuItem, title: "hej" };
    console.log(newMenuItem, "newMenuItem");
    let newState = [...this.state.menuConfig];
    newState[this.state.menuConfig.indexOf(menuItem)] = newMenuItem;
    this.setState({ menuConfig: newState });
  };
  */

  isSameNode = (foundDropNode, foundDragNode) => {
    return foundDropNode.key === foundDragNode.key;
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

      this.setState({ tree: newTree }, () => {
        this.model.exportTreeAsMenuJson(this.state.tree, this.menuConfig);
      });
    }
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

  render() {
    let expandedKeys = this.treeKeys.map(key => {
      return key.toString();
    });

    const { classes } = this.props;
    return (
      <section className="tab-pane active">
        {this.renderTableHeader()}
        <Grid>
          {this.state.tree && expandedKeys && (
            <Tree
              className={classes.background}
              blockNode
              onDrop={this.onDropNode}
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
