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
    if (this.props.onAddChapter) {
      this.props.onAddChapter(this.state.title);
      this.cancel();
    }
  }

  cancel() {
    this.setState({
      title: "",
      inputVisible: false
    });
  }

  setTitle(e) {
    this.setState({
      title: e.target.value
    });
  }

  render() {
    if (this.state.inputVisible) {
      return (
        <div style={{ display: "inline-block" }}>
          <input
            style={{ position: "relative", top: "2px" }}
            placeholder="Ange rubrik"
            value={this.state.title}
            type="text"
            name="chapter-title"
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
