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
      <div>
        <div
          className="toolbar-toggler fa fa-list"
          onClick={() => {
            this.toggleToolbar();
          }}
        />
        <div id="toolbar" className={c}>
          {this.renderTools()}
        </div>
      </div>
    );
  }
}

export default Toolbar;
