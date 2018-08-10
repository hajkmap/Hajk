import React, { Component } from "react";
import "./Toolbar.css";

class Toolbar extends Component {
  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {}

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

  render() {
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
        <div id="toolbar" className={c}>
          {this.renderTools()}
        </div>
      </div>
    );
  }
}

export default Toolbar;
