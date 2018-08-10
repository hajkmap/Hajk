import React, { Component } from "react";

class PanelHeader extends Component {
  render() {
    return (
      <div className="header">
        <div className="icons pull-right">
          <i className="material-icons">visibility_off</i>
          <i className="material-icons">minimize</i>
          <i
            className="material-icons"
            onClick={() => {
              this.props.toggle();
            }}
          >
            close
          </i>
        </div>
        <h1>{this.props.title}</h1>
      </div>
    );
  }
}

export default PanelHeader;
