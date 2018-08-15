import React, { Component } from "react";

class PanelHeader extends Component {
  renderHideAllLayersButton() {
    if (this.props.hideAllLayersButton === true) {
      return (
        <i className="material-icons" onClick={this.props.hideAllLayers}>
          visibility_off
        </i>
      );
    }
  }

  render() {
    return (
      <div className="header">
        <div className="icons pull-right">
          {this.renderHideAllLayersButton()}
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
