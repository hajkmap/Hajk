// Copyright (C) 2016 Göteborgs Stad
//
// Denna programvara är fri mjukvara: den är tillåten att distribuera och modifiera
// under villkoren för licensen CC-BY-NC-SA 4.0.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the CC-BY-NC-SA 4.0 licence.
//
// http://creativecommons.org/licenses/by-nc-sa/4.0/
//
// Det är fritt att dela och anpassa programvaran för valfritt syfte
// med förbehåll att följande villkor följs:
// * Copyright till upphovsmannen inte modifieras.
// * Programvaran används i icke-kommersiellt syfte.
// * Licenstypen inte modifieras.
//
// Den här programvaran är öppen i syfte att den skall vara till nytta för andra
// men UTAN NÅGRA GARANTIER; även utan underförstådd garanti för
// SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST SYFTE.
//
// https://github.com/hajkmap/Hajk

import React from "react";
import { Component } from "react";
import Button from "@material-ui/core/Button";
import SaveIcon from "@material-ui/icons/SaveSharp";
import { blue } from "@material-ui/core/colors";
import MenuEditorModel from "../../models/menuEditorModel";
import Grid from "@material-ui/core/Grid";
import Table from "@material-ui/core/Table";
import Modal from "@material-ui/core/Modal";

import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormLabel from "@material-ui/core/FormLabel";

import FormControl from "@material-ui/core/FormControl";

import TableCell from "@material-ui/core/TableCell";
import Popover from "@material-ui/core/Popover";
import TextField from "@material-ui/core/TextField";

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
  "Koppla webblÃ¤nk"
];

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

class SettingsPopover extends React.Component {
  state = { color: this.props.menuItem.color, icon: this.props.menuItem.icon };

  constructor(props) {
    super(props);
  }

  updateColorState = e => {
    this.setState({ color: e.target.value });
  };

  updateIconState = e => {
    let value = e.target.value;
    this.setState(prevState => {
      prevState.icon.materialUiIconName = value;
      return {
        icon: prevState.icon
      };
    });
  };

  saveAndClosePopover = () => {
    const { close, updateMenuItem, treeNodeId } = this.props;
    let objectWithKeyValuesToUpdate = this.state;
    updateMenuItem(treeNodeId, objectWithKeyValuesToUpdate);
    close();
  };

  renderTextField = (label, value, onChangeFunction) => {
    return (
      <TextField
        id="icon-picker"
        label={label}
        type="icon"
        variant="outlined"
        value={value}
        onChange={onChangeFunction}
      />
    );
  };

  renderSettings = () => {
    return (
      <form
        style={{ width: "400px", height: "350px" }}
        noValidate
        autoComplete="off"
      >
        <Grid container>
          <Grid item>
            {this.renderTextField(
              "Ikon",
              this.state.icon.materialUiIconName,
              this.updateIconState
            )}
          </Grid>
          <Grid item>
            {this.renderTextField(
              "Färg",
              this.state.color,
              this.updateColorState
            )}
          </Grid>
        </Grid>
      </form>
    );
  };

  render = () => {
    const { anchorEl, open, close } = this.props;
    return (
      <>
        <Popover
          open={open}
          onClose={this.saveAndClosePopover}
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right"
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left"
          }}
        >
          {this.renderSettings()}
        </Popover>
      </>
    );
  };
}

class TreeRow extends React.Component {
  state = { settingsMenuOpen: false };

  constructor(props) {
    super(props);
    console.log(props, "props");
  }

  renderConnectionSelect = menuItem => {
    return (
      <MenuConnectionSelector menuItem={menuItem}></MenuConnectionSelector>
    );
  };

  renderRemoveButton = menuItem => {
    const { classes } = this.props;
    return (
      <IconButton
        style={{ padding: "0px" }}
        onClick={() => {
          this.deleteMenuItem(menuItem);
        }}
      >
        <DeleteIcon></DeleteIcon>
      </IconButton>
    );
  };

  openSettingsMenu = e => {
    this.setState({
      settingsMenuAnchorEl: e.currentTarget
    });
  };

  closeSettingsMenu = () => {
    this.setState({ settingsMenuAnchorEl: null });
  };

  renderSettingsMenu = (menuItem, treeNodeId) => {
    const { settingsMenuAnchorEl } = this.state;
    return (
      <>
        <IconButton size="small" onClick={this.openSettingsMenu}>
          <SettingsIcon></SettingsIcon>
        </IconButton>
        <SettingsPopover
          treeNodeId={treeNodeId}
          menuItem={menuItem}
          updateMenuItem={this.props.updateMenuItem}
          anchorEl={settingsMenuAnchorEl}
          open={Boolean(settingsMenuAnchorEl)}
          close={this.closeSettingsMenu}
        ></SettingsPopover>
      </>
    );
  };

  renderMenuTitle = menuItem => {
    return <Typography>{menuItem.title}</Typography>;
  };

  render = () => {
    const { menuItem, treeNodeId } = this.props;
    return (
      <Grid justify="flex-end" container>
        <Grid xs={1} item>
          <DragHandle></DragHandle>
        </Grid>
        <Grid xs={2} item>
          {this.renderMenuTitle(menuItem, treeNodeId)}
        </Grid>
        <Grid xs={9} container item>
          <Grid xs={3} item>
            {this.renderSettingsMenu(menuItem, treeNodeId)}
          </Grid>
          <Grid xs={3} item>
            {this.renderConnectionSelect(menuItem, treeNodeId)}
          </Grid>
          <Grid xs={3} item>
            {this.renderRemoveButton(menuItem, treeNodeId)}
          </Grid>
        </Grid>
      </Grid>
    );
  };
}

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

const ColorButtonBlue = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700]
    }
  }
}))(Button);

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
    openMenuEditor: false
  };
  treeKeys = [];
  menuConfig = null;

  constructor(props) {
    super(props);
    this.type = "documenthandler";
    this.model = this.getModel();
  }

  getModel = () => {
    return new MenuEditorModel({
      config: this.props.model.get("config")
    });
  };

  loadTreeView = () => {
    this.model.loadMenuConfigForMap("map_1").then(menuConfig => {
      this.menuConfig = menuConfig.options.menuConfig;
      let treeData = this.createTreeStructure(
        menuConfig.options.menuConfig.menu
      );
      this.setState({ tree: treeData }, () => {});
    });
  };

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
        menuConfig: tool.options.menuConfig
      });
    } else {
      this.setState({
        active: false
      });
    }

    this.loadTreeView();
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

  remove(tool) {
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
    console.log(this.state.active, "active");
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

    let key = this.getNewTreeKey().toString();

    let returnObject = {
      title: (
        <TreeRow
          updateMenuItem={this.updateMenuItem}
          menuItem={menuItem}
          treeNodeId={key}
        ></TreeRow>
      ),
      children: children,
      menuItem: this.model.getMenuItemWithoutChildren(menuItem),
      key: key
    };
    return returnObject;
  };

  findInTree = (tree, key) => {
    return tree
      .map(treeNode => {
        var found = this.findTreeNode(treeNode, key);
        console.log(found, "found");
        return found;
      })
      .filter(x => {
        return x != undefined;
      })[0];
  };

  findTreeNode = (treeNode, key) => {
    if (treeNode.key == key) {
      return treeNode;
    } else {
      if (treeNode.children.length > 0) {
        console.log(treeNode, "TreeNode");
        return this.findInTree(treeNode.children, key);
      }
    }
  };

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
        this.menuConfig = this.model.exportTreeAsMenuJson(
          this.state.tree,
          this.menuConfig
        );
      });
    }
  };

  updateMenuItem = (treeNodeId, objectWithKeyValuesToUpdate) => {
    let newTreeState = [...this.state.tree];
    let treeNode = this.findInTree(newTreeState, treeNodeId);
    console.log(treeNode, "treeNode");
    console.log(objectWithKeyValuesToUpdate, "objectWithKeyValuesToUpdate");
    treeNode.menuItem = {
      ...treeNode.menuItem,
      ...objectWithKeyValuesToUpdate
    };

    treeNode.title = (
      <TreeRow
        updateMenuItem={this.updateMenuItem}
        menuItem={treeNode.menuItem}
        treeNodeId={treeNode.key}
      ></TreeRow>
    );

    this.setState({ tree: newTreeState }, () => {
      console.log(this.state.tree, "tree");
    });
  };

  deleteMenuItem = menuItem => {
    let newState = [...this.state.menuConfig];
    newState.splice(this.state.menuConfig.indexOf(menuItem), 1);
    this.setState({ menuConfig: newState });
  };

  renderMenuRow = (menuItem, key) => {};

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
            {["Namn", "Koppling"].map(columnName => {
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
    if (this.state.tree) {
    }

    const { classes } = this.props;
    return (
      <div>
        <form>
          <p>
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={e => {
                e.preventDefault();
                this.save();
              }}
              startIcon={<SaveIcon />}
            >
              Spara
            </ColorButtonBlue>
          </p>
          <p>
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={e => {
                e.preventDefault();
                this.setState({ openMenuEditor: true });
              }}
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
              onBackdropClick={() => {
                this.setState({ openMenuEditor: false }, () => {
                  console.log(this.state, "state");
                });
              }}
              style={{
                position: "absolute",
                top: "100px",
                left: "100px",
                right: "100px"
              }}
              open={this.state.openMenuEditor}
            >
              <>
                {this.renderTableHeader()}
                <Grid>
                  {this.state.tree && expandedKeys && (
                    <Tree
                      className={classes.background}
                      blockNode
                      height="1000px"
                      onDrop={this.onDropNode}
                      expandedKeys={expandedKeys}
                      treeData={this.state.tree}
                      draggable
                    ></Tree>
                  )}
                </Grid>
              </>
            </Modal>
          </section>
        </form>
      </div>
    );
  }
}

export default withStyles(styles)(ToolOptions);
