import React from "react";

class StyleButton extends React.Component {
  constructor() {
    super();
    this.onToggle = e => {
      e.preventDefault();
      this.props.onToggle(this.props.style);
    };
  }

  render() {
    let btnStyle = styles.styleButton;
    if (this.props.active) {
      btnStyle = styles.activeButton;
    }

    return (
      <span style={btnStyle} onMouseDown={this.onToggle}>
        {this.props.label}
      </span>
    );
  }
}

const styles = {
  styleButton: {
    width: "40px",
    height: "40px",
    color: "#333",
    cursor: "pointer",
    display: "inline-block",
    padding: 8,
    borderLeft: "1px solid #f0f0f0"
  },
  activeButton: {
    width: "40px",
    height: "40px",
    color: "#333",
    cursor: "pointer",
    display: "inline-block",
    padding: 8,
    borderLeft: "1px solid #ccc",
    background: "#C7CBCF",
    boxShadow: "1px 1px 3px #f0f0f0"
  }
};

export default StyleButton;
