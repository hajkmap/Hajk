import React from "react";

export default class FeatureInfo extends React.PureComponent {
  state = {
    html: null,
  };

  render() {
    return this.props.value.__html;
  }
}
