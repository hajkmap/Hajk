import React from "react";
import { Component } from "react";

class LayerListItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      checked: props.checked
    };
  }

  componentDidRecieveProps() {}

  componentDidUpdate() {}

  componentDidMount() {}

  render() {
    var checkedClass = this.state.checked
      ? "fa fa-check-square-o"
      : "fa fa-square-o";
    return (
      <li
        className="layer-list-item"
        key={this.props.layer.id}
        onClick={() => {
          var checked = !this.state.checked;
          this.setState({ checked: checked });
          this.props.onChange(checked);
        }}
      >
        <span>
          <span className={checkedClass} />
          <span className="label">{this.props.layer.name}</span>
        </span>
      </li>
    );
  }
}

export default LayerListItem;
