import React, { Component } from 'react';
import Observer from 'react-event-observer';
import EditModel from './model.js';

class Draw extends Component {

  constructor() {
    super();
    this.toggle = this.toggle.bind(this);
    this.state = {
      toggled: false
    };
  }

  componentDidMount() {
    this.observer = Observer();
    this.observer.subscribe('myEvent', message => {
      console.log(message);
    });
    this.editModel = new EditModel({
      map: this.props.tool.map,
      app: this.props.tool.app,
      observer: this.observer
    });
    this.props.tool.instance = this;
  }

  open() {
    console.log("Open edit tool");
    this.setState({
      toggled: true
    })
  }

  close() {
    this.setState({
      toggled: false
    })
  }

  minimize() {
    this.setState({
      toggled: false
    })
  }

  toggle() {
    this.setState({
      toggled: !this.state.toggled
    });
    this.props.tool.app.togglePlugin("edit");
  }

  getActiveClass() {
    return this.state.toggled ? 'tool-toggle-button active' : 'tool-toggle-button';
  }

  getVisibilityClass() {
    return this.state.toggled ? 'tool-panel' : 'tool-panel hidden';
  }

  render() {
    return (
      <div>
        <div className={this.getActiveClass()} onClick={this.toggle}>Edit tool</div>
        <div className={this.getVisibilityClass()}>
          <div>Redigera linje</div>
          <div>Redigera yte</div>
          <div>Redigera text</div>
        </div>
      </div>
    );
  }
}

export default Draw;