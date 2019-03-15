import React from "react";

export default class Reparentable extends React.Component {
  ref = React.createRef();

  componentDidMount() {
    this.ref.current.appendChild(this.props.el);
  }

  render() {
    return <div ref={this.ref} />;
  }
}
