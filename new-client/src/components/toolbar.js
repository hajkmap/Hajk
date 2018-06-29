import React, { Component } from "react";
import "./Toolbar.css";

class Toolbar extends Component {
  componentDidMount() {}

  renderTools() {
    return this.props.tools.map((tool, i) => {
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
