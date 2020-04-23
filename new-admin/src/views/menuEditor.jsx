import React, { PureComponent } from "react";
import Tree from "antd/es/tree"; //Specific import to keep bundle-size small
import "antd/es/tree/style"; //Specific import to keep bundle-size small

//import Tree, { TreeNode } from "rc-tree";

class MenuEditor extends PureComponent {
  constructor(props) {
    super(props);
    //props.model.loadMapSettings();
  }

  fetchMenu = () => {};

  render() {
    return (
      <section className="tab-pane active">
        <Tree
          expandedKeys={["0-2"]}
          showIcon={false}
          switcherIcon={<div></div>}
          blockNode
          selectable={false}
          treeData={[
            { title: "0-0", key: "0-0" },
            { title: "0-1", key: "0-1" },
            {
              title: "0-2",
              key: "0-2",
              children: [{ title: "0-2-0", key: "0-2-0" }]
            }
          ]}
          draggable
        ></Tree>
      </section>
    );
  }
}

export default MenuEditor;
