import React, { Component } from "react";
import ToggleButton, { ToggleButtonGroup } from "@material-ui/lab/ToggleButton";

import "./Toolbar.css";

class Toolbar extends Component {
  state = {
    selectedTool: null
  };

  renderTools() {
    return this.props.tools.map((tool, i) => {
      return <tool.component key={i} tool={tool} toolbar={this} />;
    });
  }

  hide() {
    this.setState({
      toolbarVisible: false
    });
  }

  toggleToolbar() {
    this.setState({
      toolbarVisible: !this.state.toolbarVisible
    });
  }

  handleToolbarClick = selectedTool => {
    console.log("handleToolbarClick");

    this.setState({ selectedTool });
  };

  render() {
    const { selectedTool } = this.state;
    var c = this.state.toolbarVisible ? "toolbar visible" : "toolbar";
    return (
      <div id="toolbar-group">
        <div
          className="toolbar-toggler material-icons"
          onClick={() => {
            this.toggleToolbar();
          }}
        >
          list
        </div>
        {/* <div id="toolbar" className={c}>
          {this.renderTools()}
        </div> */}
        <ToggleButtonGroup
          value={selectedTool}
          exclusive
          onChange={this.handleToolbarClick}
        >
          <ToggleButton value="draw">Hello</ToggleButton>
          {this.renderTools()}
        </ToggleButtonGroup>
      </div>
    );
  }
}

export default Toolbar;
