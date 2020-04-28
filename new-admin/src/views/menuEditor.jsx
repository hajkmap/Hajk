import React, { PureComponent } from "react";
import MenuEditorModel from "../models/menuEditorModel";
import Grid from "@material-ui/core/Grid";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableContainer from "@material-ui/core/TableContainer";
import DeleteIcon from "@material-ui/icons/Delete";
import DragHandle from "@material-ui/icons/DragHandle";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import { withStyles } from "@material-ui/core/styles";
import Select from "@material-ui/core/Select";
import Switch from "@material-ui/core/Switch";
import { IconButton } from "@material-ui/core";
import Tree from "antd/es/tree"; //Specific import to keep bundle-size small
import "antd/es/tree/style/css"; //Specific import to keep bundle-size small
import { Typography } from "@material-ui/core";

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

class MenuEditor extends PureComponent {
  state = {
    menuConfig: null
  };

  index = 0;

  constructor(props) {
    super(props);
    this.model = this.getModel();
  }

  componentDidMount = () => {
    this.model.loadMenuConfigForMap("map_1").then(data => {
      console.log(data, "data");
      this.setState({ menuConfig: data }, () => {
        this.setState({ treeData: this.create() }, () => {
          console.log(this.state, "state");
        });
      });
    });
  };

  getModel = () => {
    return new MenuEditorModel({
      config: this.props.config
    });
  };

  create = () => {
    let menu = this.state.menuConfig;
    return this.createTree(menu);
  };

  createTree = menu => {
    return menu.map(menuItem => {
      return this.createTreeChild(menuItem);
    });
  };

  createTreeChild = menuItem => {
    let children = [];
    if (menuItem.menu.length > 0) {
      children = this.createTree(menuItem.menu);
    }
    this.index = this.index + 1;
    return {
      title: this.getComponent(menuItem),
      children: children,

      key: this.index
    };
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
          <Grid xs={2} item>
            <Select
              native
              value={10}
              inputProps={{
                name: "age",
                id: "age-native-simple"
              }}
            >
              <option value="" />
              <option value={10}>Ten</option>
              <option value={20}>Twenty</option>
              <option value={30}>Thirty</option>
            </Select>
          </Grid>
          <Grid xs={2} item>
            <Select
              native
              value={10}
              inputProps={{
                name: "age",
                id: "age-native-simple"
              }}
            >
              <option value="" />
              <option value={10}>Ten</option>
              <option value={20}>Twenty</option>
              <option value={30}>Thirty</option>
            </Select>
          </Grid>
          <Grid xs={2} item>
            <Switch
              name="checkedA"
              inputProps={{ "aria-label": "secondary checkbox" }}
            />
          </Grid>
          <Grid xs={2} item>
            <IconButton>
              <DeleteIcon></DeleteIcon>
            </IconButton>
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
    const { classes } = this.props;
    return (
      <section className="tab-pane active">
        {this.renderTableHeader()}
        <Grid>
          {this.state.treeData && (
            <Tree
              className={classes.background}
              defaultExpandAll
              blockNode
              treeData={this.state.treeData}
              draggable
            ></Tree>
          )}
        </Grid>
      </section>
    );
  }
}

export default withStyles(styles)(MenuEditor);
