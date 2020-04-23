import React, { PureComponent } from "react";
import MenuEditorModel from "../models/menuEditorModel";
import Grid from "@material-ui/core/Grid";
import Tree from "antd/es/tree"; //Specific import to keep bundle-size small
import "antd/es/tree/style/css"; //Specific import to keep bundle-size small

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
    return { title: menuItem.title, children: children, key: this.index };
  };

  render() {
    return (
      <section className="tab-pane active">
        <Grid style={{ border: "solid" }} justify="flex-start" container>
          <Grid>
            {this.state.treeData && (
              <Tree
                defaultExpandAll
                treeData={this.state.treeData}
                draggable
              ></Tree>
            )}
          </Grid>
        </Grid>
      </section>
    );
  }
}

export default MenuEditor;
