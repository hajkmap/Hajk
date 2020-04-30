import React, { Component } from "react";
import MenuEditorModel from "../models/menuEditorModel";
import Grid from "@material-ui/core/Grid";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import DeleteIcon from "@material-ui/icons/Delete";
import SettingsIcon from "@material-ui/icons/Settings";
import DragHandle from "@material-ui/icons/DragHandle";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import TableHead from "@material-ui/core/TableHead";
import ListItemIcon from "@material-ui/core/ListItemIcon";

import TableRow from "@material-ui/core/TableRow";
import { withStyles } from "@material-ui/core/styles";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import Switch from "@material-ui/core/Switch";
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
    this.model.loadMenuConfigForMap("map_1").then(data => {
      console.log(data, "data");
      this.setState({ menuConfig: data }, () => {});
    });
  };

  getModel = () => {
    return new MenuEditorModel({
      config: this.props.config
    });
  };

  create = () => {
    this.treeKeys = [];
    let menu = this.state.menuConfig;
    return this.createTree(menu);
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
      title: this.getComponent(menuItem),
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

  renderConnectionMenuSelectOption = title => {
    return (
      <MenuItem value={<Typography>{title}</Typography>}>
        <ListItemIcon>
          <SettingsIcon></SettingsIcon>
          <Typography>{title}</Typography>
        </ListItemIcon>
      </MenuItem>
    );
  };

  renderConnectionSelect = menuItem => {
    return (
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
        renderValue={value => {
          return value;
        }}
        inputProps={{
          name: "age",
          id: "age-native-simple"
        }}
      >
        {MENU_CONNECTION_TYPES.map(title => {
          return this.renderConnectionMenuSelectOption(title);
        })}
      </Select>
    );
  };

  deleteMenuItem = menuItem => {
    let newState = [...this.state.menuConfig];
    newState.splice(this.state.menuConfig.indexOf(menuItem), 1);
    this.setState({ menuConfig: newState });
  };

  updateMenuItem = menuItem => {
    let newMenuItem = { ...menuItem, title: "hej" };
    let newState = [...this.state.menuConfig];
    newState[this.state.menuConfig.indexOf(menuItem)] = newMenuItem;
    this.setState({ menuConfig: newState });
  };

  renderRemoveButton = menuItem => {
    return (
      <IconButton>
        <DeleteIcon
          onClick={() => {
            this.deleteMenuItem(menuItem);
          }}
        ></DeleteIcon>
      </IconButton>
    );
  };

  getComponent = menuItem => {
    return (
      <Grid justify="flex-end" container>
        <Grid xs={1} item>
          <DragHandle></DragHandle>
        </Grid>
        <Grid xs={2} item>
          <Typography>{menuItem.title}</Typography>
        </Grid>
        <Grid xs={9} container item>
          <Grid xs={1}>{this.renderSettingsMenu()}</Grid>
          <Grid xs={2} item>
            {this.renderConnectionSelect(menuItem)}
          </Grid>

          <Grid xs={2} item>
            {this.renderRemoveButton(menuItem)}
            <IconButton>
              <FileCopyIcon></FileCopyIcon>
            </IconButton>
          </Grid>
        </Grid>
      </Grid>
    );
  };

  renderTableCell = columnName => {
    const { classes } = this.props;
    return (
      <TableCell className={classes.cell}>
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
    let tree = this.state.menuConfig ? this.create() : null;
    let expandedKeys = this.treeKeys.map(key => {
      return key.toString();
    });
    console.log(tree, "tree");
    console.log(expandedKeys, "render");

    const { classes } = this.props;
    return (
      <section className="tab-pane active">
        {this.renderTableHeader()}
        <Grid>
          {this.state.menuConfig && expandedKeys && (
            <Tree
              className={classes.background}
              blockNode
              expandedKeys={expandedKeys}
              treeData={tree}
              draggable
            ></Tree>
          )}
        </Grid>
      </section>
    );
  }
}

export default withStyles(styles)(MenuEditor);
