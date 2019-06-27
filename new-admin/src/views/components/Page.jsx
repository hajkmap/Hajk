import React from "react";
import { Component } from "react";

class Page extends Component {
  state = {
    header: "",
    text: ""
  };

  render() {
    return (
      <div className="page">
        <div className="page-header">
          <input
            className="nodrag"
            type="text"
            placeholder="ange rubrik"
            value={this.state.header}
            onChange={e => {
              this.setState(
                {
                  header: e.target.value
                },
                () => {
                  this.props.onUpdate();
                }
              );
            }}
          />
          <div>
            <span
              className="btn btn-danger"
              onClick={() => {
                this.props.onRemove(this.props.page.id);
              }}
            >
              Ta bort sida
            </span>
          </div>
        </div>
        <div className="page-body">
          <textarea
            className="nodrag"
            value={this.state.text}
            onChange={e => {
              this.setState(
                {
                  text: e.target.value
                },
                () => {
                  this.props.onUpdate();
                }
              );
            }}
          />
        </div>
      </div>
    );
  }
}

export default Page;
