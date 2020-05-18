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
import { blue, green, red } from "@material-ui/core/colors";
import MenuEditorModel from "../../models/menuEditorModel";
import Grid from "@material-ui/core/Grid";
import Modal from "@material-ui/core/Modal";
import ArrowRightIcon from "@material-ui/icons/ArrowRight";
import DescriptionIcon from "@material-ui/icons/Description";
import RoomIcon from "@material-ui/icons/Room";
import LanguageIcon from "@material-ui/icons/Language";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import FormControl from "@material-ui/core/FormControl";
import TableCell from "@material-ui/core/TableCell";
import Popover from "@material-ui/core/Popover";
import TextField from "@material-ui/core/TextField";
import DeleteIcon from "@material-ui/icons/Delete";
import SettingsIcon from "@material-ui/icons/Settings";
import WarningIcon from "@material-ui/icons/Warning";
import DragHandle from "@material-ui/icons/DragHandle";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import { withStyles } from "@material-ui/core/styles";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import { IconButton } from "@material-ui/core";
import Tree from "antd/es/tree"; //Specific import to keep bundle-size small
import "antd/es/tree/style/css"; //Specific import to keep bundle-size small
import { Typography } from "@material-ui/core";

const MENU_CONNECTION_TYPES = {
  documentConnection: "Koppla dokument",
  mapLink: "Koppla karta och lager",
  link: "Koppla webblänk",
  subMenu: "Inget valt"
};

const getPopoverMenuItemTitle = label => {
  return <Typography variant="h6">{label}: </Typography>;
};

const getTextField = (value, onChangeFunction, variant) => {
  return (
    <TextField
      id="icon-picker"
      label={""}
      type="icon"
      variant={variant}
      value={value}
      onChange={onChangeFunction}
    />
  );
};

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
              onClick={e => {
                e.preventDefault();
                this.addNewItem();
              }}
            >
              Ny menylänk
            </ColorButtonGreen>
            <ColorButtonBlue
              variant="contained"
              className="btn"
              onClick={e => {
                e.preventDefault();
                this.setState({ openMenuEditor: false });
                this.save();
              }}
              startIcon={<SaveIcon />}
            >
              Spara
            </ColorButtonBlue>
          </Grid>
          <Grid xs={1} item></Grid>
          <Grid xs={1} item>
            <ColorButtonRed
              variant="contained"
              className="btn"
              onClick={e => {
                e.preventDefault();
                this.setState({ openMenuEditor: false, tree: [] });
              }}
            >
              Avbryt
            </ColorButtonRed>
          </Grid>
        </Grid>
      </Grid>
    );
  };

  addNewItem = () => {
    let menuItem = {
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

    let newTree = [...this.state.tree];
    newTree.push(this.createTreeChild(menuItem));
    this.setState({ tree: newTree });
  };

  loadTreeView = () => {
    this.model.loadMenuConfigForMap("map_1").then(menuConfig => {
      this.menuConfig = menuConfig.options.menuConfig;
      let treeData = this.createTreeStructure(this.menuConfig.menu);
      treeData.unshift({
        title: this.getHeader(),
        disabled: true,
        children: [],
        menuItem: [],
        key: -2
      });
      this.setState({ tree: treeData });
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

  isSelectionValid = (children, menuItem) => {
    if (
      (menuItem.mapLink || menuItem.document || menuItem.link) &&
      children.length > 0
    ) {
      return false;
    }

    return true;
  };

  createTreeChild = menuItem => {
    let children = [];
    if (menuItem.menu.length > 0) {
      children = this.createTree(menuItem.menu);
    }

    let key = this.getNewTreeKey().toString();

    return {
      title: (
        <TreeRow
          updateMenuItem={this.updateMenuItem}
          deleteMenuItem={this.deleteMenuItem}
          model={this.model}
          availableDocuments={this.availableDocuments}
          menuItem={menuItem}
          validSelection={this.isSelectionValid(children, menuItem)}
          treeNodeId={key}
        ></TreeRow>
      ),
      children: children,
      selectable: false,
      menuItem: this.model.getMenuItemWithoutChildren(menuItem),
      key: key
    };
  };

  //Can this recursion be written better????
  findInTree = (tree, key) => {
    return tree
      .map(treeNode => {
        var found = this.findTreeNode(treeNode, key);
        return found;
      })
      .filter(res => {
        return res !== undefined;
      })[0];
  };
  //Can this recursion be written better????
  findTreeNode = (treeNode, key) => {
    if (treeNode.key === key) {
      return treeNode;
    } else {
      if (treeNode.children.length > 0) {
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
      this.setState({ tree: newTree });
    }
  };

  updateMenuItem = (treeNodeId, objectWithKeyValuesToUpdate) => {
    let newTreeState = [...this.state.tree];
    let treeNode = this.findInTree(newTreeState, treeNodeId);
    if (treeNode) {
      treeNode.menuItem = {
        ...treeNode.menuItem,
        ...objectWithKeyValuesToUpdate
      };

      treeNode.title = (
        <TreeRow
          updateMenuItem={this.updateMenuItem}
          deleteMenuItem={this.deleteMenuItem}
          hasChildren={treeNode.children > 0}
          menuItem={treeNode.menuItem}
          validSelection={this.isSelectionValid(
            treeNode.children,
            treeNode.menuItem
          )}
          availableDocuments={this.availableDocuments}
          model={this.model}
          treeNodeId={treeNode.key}
        ></TreeRow>
      );

      this.setState({ tree: newTreeState });
    }
    return treeNode;
  };

  deleteTreeNode = (nodeArrayToSearch, treeNodeToDelete) => {
    nodeArrayToSearch.forEach((child, index) => {
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
    let treeNode = this.findInTree(newTreeState, treeNodeId);
    if (this.isRootNode(treeNode)) {
      this.deleteTreeNode(newTreeState, treeNode);
    } else {
      this.deleteTreeNode(treeNode.parent.children, treeNode);
    }
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

  renderTableHeader = () => {
    return <></>;
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
              onClick={e => {
                e.preventDefault();
                this.loadTreeView();
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

const SettingsPopover = withStyles(theme => {
  return {
    test: { padding: "100px" }
  };
})(
  class SettingsPopover extends React.Component {
    state = {
      color: this.props.menuItem.color,
      icon: this.props.menuItem.icon
    };

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

    renderSettings = () => {
      return (
        <form
          style={{ width: "400px", height: "350px" }}
          noValidate
          autoComplete="off"
        >
          <Grid container>
            <Grid xs={12} item>
              {getPopoverMenuItemTitle("Ikon")}
              {getTextField(
                this.state.icon.materialUiIconName,
                this.updateIconState,
                "standard"
              )}
            </Grid>
            <Grid xs={12} item>
              {getPopoverMenuItemTitle("Färg")}
              {getTextField(
                this.state.color,
                this.updateColorState,
                "standard"
              )}
            </Grid>
          </Grid>
        </form>
      );
    };

    render = () => {
      const { anchorEl, open } = this.props;
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
);

const TreeRow = withStyles(theme => {
  return {
    test: { padding: "100px" }
  };
})(
  class TreeRow extends React.Component {
    state = { menuItemTitle: this.props.menuItem.title };

    componentWillUnmount = () => {
      const { updateMenuItem, treeNodeId } = this.props;
      updateMenuItem(treeNodeId, { title: this.state.menuItemTitle });
    };

    constructor(props) {
      super(props);
    }

    renderConnectionSelect = () => {
      const {
        model,
        treeNodeId,
        updateMenuItem,
        availableDocuments,
        menuItem
      } = this.props;

      return (
        <MenuConnectionSelector
          rowHasChildren={this.props.hasChildren}
          validSelection={this.props.validSelection}
          treeNodeId={treeNodeId}
          updateMenuItem={updateMenuItem}
          availableDocuments={availableDocuments}
          model={model}
          menuItem={menuItem}
        ></MenuConnectionSelector>
      );
    };

    renderRemoveButton = () => {
      const { deleteMenuItem, treeNodeId } = this.props;
      return (
        <IconButton
          style={{ padding: "0px" }}
          onClick={() => {
            deleteMenuItem(treeNodeId);
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

    renderSettingsMenu = () => {
      const { settingsMenuAnchorEl } = this.state;
      const { updateMenuItem, menuItem, treeNodeId } = this.props;
      return (
        <>
          <IconButton size="small" onClick={this.openSettingsMenu}>
            <SettingsIcon></SettingsIcon>
          </IconButton>
          <SettingsPopover
            treeNodeId={treeNodeId}
            menuItem={menuItem}
            updateMenuItem={updateMenuItem}
            anchorEl={settingsMenuAnchorEl}
            open={Boolean(settingsMenuAnchorEl)}
            close={this.closeSettingsMenu}
          ></SettingsPopover>
        </>
      );
    };

    renderMenuTitle = () => {
      const { menuItem } = this.props;

      return getTextField(
        this.state.menuItemTitle,
        e => {
          this.setState({ menuItemTitle: e.target.value });
        },
        "standard"
      );
    };

    render = () => {
      return (
        <Grid
          style={{
            border: "1px solid rgba(153,164,161,0.5)",
            borderRadius: "8px"
          }}
          justify="flex-end"
          container
        >
          <Grid xs={1} item>
            <DragHandle></DragHandle>
          </Grid>
          <Grid xs={2} item>
            {this.renderMenuTitle()}
          </Grid>
          <Grid xs={9} container item>
            <Grid xs={3} item>
              {this.renderSettingsMenu()}
            </Grid>
            <Grid xs={3} item>
              {this.renderConnectionSelect()}
            </Grid>
            <Grid xs={3} item>
              {this.renderRemoveButton()}
            </Grid>
          </Grid>
        </Grid>
      );
    };
  }
);

const MenuConnectionSelector = withStyles(theme => {
  return {
    popoverActionArea: { paddingTop: "10px" },
    menuItem: {
      "&:focus": {
        backgroundColor: theme.palette.primary.light
      }
    }
  };
})(
  class MenuConnectionSelector extends React.Component {
    state = {
      open: false,
      mapLinkValue: this.props.menuItem.maplink,
      linkValue: this.props.menuItem.link,
      documentValue: this.props.menuItem.document,
      activeMenu: ""
    };

    componentDidMount = () => {
      this.setState({
        value: this.getInitialValue()
      });
    };

    getInitialValue = () => {
      const { menuItem } = this.props;

      if (menuItem.menu.length > 0) {
        return MENU_CONNECTION_TYPES.subMenu;
      }

      if (menuItem.document !== "") {
        return MENU_CONNECTION_TYPES.documentConnection;
      }

      if (menuItem.link) {
        return MENU_CONNECTION_TYPES.link;
      }

      if (menuItem.maplink) {
        return MENU_CONNECTION_TYPES.mapLink;
      }
    };

    openConnectionsMenu = e => {
      this.setState({
        connectionsMenuAnchorEl: e.currentTarget
      });
    };

    closeConnectionsMenu = () => {
      this.setState({ connectionsMenuAnchorEl: null, open: false });
    };

    renderConnectionMenuSelectOption = (value, index) => {
      return (
        <MenuItem key={index} value={value}>
          <ListItemIcon>
            <SettingsIcon></SettingsIcon>
          </ListItemIcon>
          <Typography>{value}</Typography>
          {value !== MENU_CONNECTION_TYPES.subMenu && (
            <ArrowRightIcon></ArrowRightIcon>
          )}
        </MenuItem>
      );
    };

    renderMenuConnectionSettings = () => {
      const { connectionsMenuAnchorEl } = this.state;
      const { classes } = this.props;
      return (
        <Popover
          PaperProps={{
            style: { width: "500px", height: "500px", padding: "20px" }
          }}
          open={Boolean(connectionsMenuAnchorEl)}
          onClose={this.closeConnectionsMenu}
          anchorEl={connectionsMenuAnchorEl}
          anchorOrigin={{
            vertical: "top",
            horizontal: "right"
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "left"
          }}
        >
          <Grid container>
            <Grid xs={12} item>
              {this.renderPopoverContent()}
            </Grid>
            <Grid className={classes.popoverActionArea} xs={12} item>
              <ColorButtonGreen
                variant="contained"
                className="btn"
                onClick={this.update}
              >
                OK
              </ColorButtonGreen>
            </Grid>
          </Grid>
        </Popover>
      );
    };

    update = e => {
      const { treeNodeId, updateMenuItem } = this.props;
      const { activeMenu } = this.state;
      e.preventDefault();
      let newMenuItem = {
        maplink: "",
        link: "",
        document: ""
      };
      if (activeMenu === MENU_CONNECTION_TYPES.documentConnection) {
        newMenuItem = { ...newMenuItem, document: this.state.documentValue };
      }

      if (activeMenu === MENU_CONNECTION_TYPES.link) {
        newMenuItem = { ...newMenuItem, link: this.state.linkValue };
      }

      if (activeMenu === MENU_CONNECTION_TYPES.mapLink) {
        newMenuItem = { ...newMenuItem, maplink: this.state.mapLinkValue };
      }

      updateMenuItem(treeNodeId, newMenuItem);

      this.setState({
        connectionsMenuAnchorEl: null,
        open: false,
        value: this.state.activeMenu
      });
    };

    renderDocumentList = () => {
      const { availableDocuments, classes } = this.props;
      const { documentValue } = this.state;
      return (
        <Grid item>
          <List component="nav">
            {availableDocuments.map((availableDocument, index) => {
              return (
                <ListItem
                  autoFocus={availableDocument === documentValue ? true : false}
                  className={classes.menuItem}
                  key={index}
                  onClick={e => {
                    this.setState({ documentValue: availableDocuments[index] });
                  }}
                  button
                >
                  <ListItemText primary={availableDocument}></ListItemText>
                </ListItem>
              );
            })}
          </List>
        </Grid>
      );
    };

    getLink = (label, value, onChangeFunction) => {
      return (
        <Grid xs={12} item>
          {getPopoverMenuItemTitle(label)}
          {getTextField(value, onChangeFunction, "standard")}
        </Grid>
      );
    };

    renderMapLink = () => {
      return this.getLink("Kartlänk", this.state.mapLinkValue, e => {
        this.setState({ mapLinkValue: e.target.value });
      });
    };

    renderLink = () => {
      return this.getLink("Webblänk", this.state.linkValue, e => {
        this.setState({ linkValue: e.target.value });
      });
    };

    renderPopoverContent = () => {
      const { activeMenu } = this.state;
      if (activeMenu === MENU_CONNECTION_TYPES.subMenu) {
        return null;
      }
      if (activeMenu === MENU_CONNECTION_TYPES.documentConnection) {
        return this.renderDocumentList();
      }

      if (activeMenu === MENU_CONNECTION_TYPES.link) {
        return this.renderLink();
      }

      if (activeMenu === MENU_CONNECTION_TYPES.mapLink) {
        return this.renderMapLink();
      }
    };

    handleChange = e => {
      if (e.target.value !== MENU_CONNECTION_TYPES.subMenu) {
        this.setState({
          activeMenu: e.target.value,
          connectionsMenuAnchorEl: e.currentTarget,
          open: true
        });
      } else {
        this.setState({
          value: e.target.value
        });
      }
    };

    getRenderedSelectionText = (label, icon) => {
      return (
        <Grid container>
          {icon && <Grid item>{icon}</Grid>}
          <Grid item>
            <Typography>{label}</Typography>
          </Grid>
        </Grid>
      );
    };

    getRenderValue = () => {
      const { menuItem } = this.props;
      if (this.state.value === MENU_CONNECTION_TYPES.documentConnection) {
        return this.getRenderedSelectionText(
          menuItem.document,
          <DescriptionIcon></DescriptionIcon>
        );
      }

      if (this.state.value === MENU_CONNECTION_TYPES.subMenu) {
        return this.getRenderedSelectionText("Undermeny");
      }

      if (this.state.value === MENU_CONNECTION_TYPES.link) {
        return this.getRenderedSelectionText("Webblänk", <RoomIcon></RoomIcon>);
      }

      if (this.state.value === MENU_CONNECTION_TYPES.mapLink) {
        return this.getRenderedSelectionText(
          "Karta",
          <LanguageIcon></LanguageIcon>
        );
      }

      return this.getRenderedSelectionText("Ingen koppling");
    };

    render = () => {
      const { value, open } = this.state;
      const { validSelection } = this.props;

      if (value) {
        console.log(validSelection, "validSelection");
        return (
          <>
            <FormControl>
              <Grid container>
                <Grid item>
                  {!validSelection && <WarningIcon></WarningIcon>}
                </Grid>

                <Grid item>
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
                    onOpen={() => {
                      this.setState({ open: true });
                    }}
                    onClose={() => {
                      this.setState({ open: false });
                    }}
                    renderValue={this.getRenderValue}
                    onChange={this.handleChange}
                    open={open}
                    value={value}
                  >
                    {Object.values(MENU_CONNECTION_TYPES).map(
                      (value, index) => {
                        return this.renderConnectionMenuSelectOption(
                          value,
                          index
                        );
                      }
                    )}
                  </Select>
                  {this.renderMenuConnectionSettings()}
                </Grid>
              </Grid>
            </FormControl>
          </>
        );
      } else {
        return null;
      }
    };
  }
);

const ColorButtonGreen = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(green[500]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700]
    },
    marginRight: theme.spacing(2)
  }
}))(Button);

const ColorButtonRed = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700]
    }
  }
}))(Button);

const ColorButtonBlue = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700]
    }
  }
}))(Button);

export default withStyles(styles)(ToolOptions);
