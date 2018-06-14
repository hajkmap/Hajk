import React, { Component } from 'react';
import DrawModel from './model.js';

class Draw extends Component {

  constructor(map) {
    super();
    console.log("Constructor", map);
  }

  componentDidMount() {
    this.drawModel = new DrawModel();
  }

  render() {
    return (
      <div>Draw View</div>
    );
  }
}

export default Draw;