import React from "react";
import ReactDOM from "react-dom";

class PrintPreview extends React.Component {
  constructor(props) {
    super(props);
    this.el = document.createElement("div");
    this.el.id = "printPreviewContent";
    this.el.style.width = `${21}cm`;
  }

  componentDidMount() {
    document.body.appendChild(this.el);
  }

  componentWillUnmount() {
    document.body.removeChild(this.el);
  }

  render() {
    return ReactDOM.createPortal(this.props.children, this.el);
  }
}

export default PrintPreview;
