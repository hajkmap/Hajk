import React from "react";
import { Component } from "react";
import Button from "@material-ui/core/Button";
import { withStyles } from "@material-ui/core/styles";
import { red } from "@material-ui/core/colors";
import RemoveIcon from "@material-ui/icons/Remove";

const ColorButtonRed = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(red[500]),
    backgroundColor: red[500],
    "&:hover": {
      backgroundColor: red[700]
    }
  }
}))(Button);
class Page extends Component {
  constructor(props) {
    super(props);
    this.state = {
      header: props.page.header || "",
      text: props.page.text || ""
    };
  }

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
            <ColorButtonRed
              variant="contained"
              className="btn"
              onClick={() => {
                this.props.onRemove(this.props.page.id);
              }}
              startIcon={<RemoveIcon />}
            >
              Ta bort sida
            </ColorButtonRed>
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
