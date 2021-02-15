import React from "react";
import { Component } from "react";
import Button from "@material-ui/core/Button";
import AddIcon from "@material-ui/icons/Add";
import DoneIcon from "@material-ui/icons/DoneOutline";
import CancelIcon from "@material-ui/icons/Cancel";
import { withStyles } from "@material-ui/core/styles";
import { green, blue } from "@material-ui/core/colors";

const ColorButtonGreen = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(green[700]),
    backgroundColor: green[500],
    "&:hover": {
      backgroundColor: green[700]
    }
  }
}))(Button);

const ColorButtonBlue = withStyles(theme => ({
  root: {
    color: theme.palette.getContrastText(blue[500]),
    backgroundColor: blue[500],
    "&:hover": {
      backgroundColor: blue[700]
    }
  }
}))(Button);
class ChapterAdder extends Component {
  constructor(props) {
    super(props);
    this.state = {
      title: "",
      inputVisible: false
    };
  }

  toggleInputVisibility() {
    this.setState({
      inputVisible: !this.state.inputVisible
    });
  }

  addChapter() {
    if (this.props.onAddChapter && this.state.title !== "") {
      this.props.onAddChapter(this.state.title);
      this.cancel();
    } else {
      this.setState({
        invalid: true
      });
    }
  }

  cancel() {
    this.setState({
      title: "",
      inputVisible: false,
      invalid: false
    });
  }

  setTitle(e) {
    this.setState({
      title: e.target.value,
      invalid: e.target.value.length === 0
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
            placeholder="Ange rubrik"
            value={this.state.title}
            type="text"
            name="chapter-title"
            ref="input"
            style={style}
            onKeyPress={e => {
              if (e.key === "Enter") {
                this.addChapter();
              }
            }}
            onChange={e => {
              this.setTitle(e);
            }}
          />
          &nbsp;
          <ColorButtonGreen
            variant="contained"
            className="btn"
            onClick={() => this.addChapter()}
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
          <ColorButtonGreen
            variant="contained"
            className="btn"
            onClick={() => this.toggleInputVisibility()}
            startIcon={<AddIcon />}
          >
            Lägg till kapitel
          </ColorButtonGreen>
        </div>
      );
    }
  }
}

export default ChapterAdder;
