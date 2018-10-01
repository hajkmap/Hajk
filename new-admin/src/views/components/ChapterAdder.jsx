import React from "react";
import { Component } from "react";

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
          <span className="btn btn-primary" onClick={() => this.addChapter()}>
            Ok
          </span>
          &nbsp;
          <span className="btn btn-danger" onClick={() => this.cancel()}>
            Avbryt
          </span>
        </div>
      );
    } else {
      return (
        <div style={{ display: "inline-block" }}>
          <span
            className="btn btn-success"
            onClick={() => this.toggleInputVisibility()}
          >
            Lägg till rubrik
          </span>
        </div>
      );
    }
  }
}

export default ChapterAdder;
