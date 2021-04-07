import React from "react";
import { Component } from "react";
import Button from "@material-ui/core/Button";
import DoneIcon from "@material-ui/icons/DoneOutline";
import CancelIcon from "@material-ui/icons/Cancel";
import { withStyles } from "@material-ui/core/styles";
import { green, blue } from "@material-ui/core/colors";

import AddBoxIcon from "@material-ui/icons/AddBox";
import IconButton from "@material-ui/core/IconButton";
import Tooltip from "@material-ui/core/Tooltip";

const ColorButtonGreen = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700],
    },
  },
}))(Button);

const ColorButtonBlue = withStyles((theme) => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700],
    },
  },
}))(Button);

class AddKeyword extends Component {
  constructor(props) {
    super(props);
    this.state = {
      keyword: "",
      inputVisible: false,
    };
  }

  toggleInputVisibility() {
    this.setState({
      inputVisible: !this.state.inputVisible,
    });
  }

  addKeyword() {
    if (this.props.onAddKeyword && this.state.keyword !== "") {
      this.props.onAddKeyword(this.state.keyword);
      this.cancel();
    } else {
      this.setState({
        invalid: true,
      });
    }
  }

  cancel() {
    this.setState({
      keyword: "",
      inputVisible: false,
      invalid: false,
    });
  }

  setKeyword(e) {
    this.setState({
      keyword: e.target.value,
      invalid: e.target.value.length === 0,
    });
  }

  componentDidUpdate() {
    if (this.refs.input) {
      this.refs.input.focus();
    }
  }

  render() {
    var style = this.state.invalid ? { backgroundColor: "#d9534f" } : {};
    if (this.state.inputVisible) {
      return (
        <div style={{ display: "inline-block" }}>
          <input
            placeholder="Lägg till nyckelord"
            value={this.state.keyword}
            type="text"
            name="keyword-title"
            ref="input"
            style={style}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                this.addKeyword();
              }
            }}
            onChange={(e) => {
              this.setKeyword(e);
            }}
          />
          &nbsp;
          <ColorButtonGreen
            variant="contained"
            className="btn"
            onClick={() => this.addKeyword()}
            startIcon={<DoneIcon />}
          >
            Ok
          </ColorButtonGreen>
          &nbsp;
          <ColorButtonBlue
            variant="contained"
            className="btn btn-danger"
            onClick={() => this.cancel()}
            startIcon={<CancelIcon />}
          >
            Avbryt
          </ColorButtonBlue>
        </div>
      );
    } else {
      return (
        <div style={{ display: "inline-block" }}>
          <Tooltip title="Lägg till ett nyckelord">
            <IconButton
              size="small"
              onClick={() => this.toggleInputVisibility()}
            >
              <AddBoxIcon />
            </IconButton>
          </Tooltip>
        </div>
      );
    }
  }
}

export default AddKeyword;
