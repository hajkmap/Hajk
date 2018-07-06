import React, { Component } from "react";
import "./Toolbar.css";

class Toolbar extends Component {
  componentDidMount() {}

  renderTools() {
    console.log(
      "renderTools() in Toolbar.js got following tools available:",
      this.props.tools
    );
    return this.props.tools.map((tool, i) => {
      console.log("renderTools, tool: ", tool);
      return <tool.component key={i} tool={tool} />;
    });
  }

  render() {
    return (
      <div id="toolbar" className="toolbar">
        {this.renderTools()}
      </div>
    );
  }
}

export default Toolbar;
