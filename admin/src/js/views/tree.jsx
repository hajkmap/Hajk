import React, { Component } from 'react';

export default class Tree extends Component {
  constructor (props) {
    super(props);
    this.state = {
      searchableLayers: [],
      checked: false
    };
  }

  componentDidMount () {
    this.props.loadLayers(this.refs);
  }

  toggleHide (layerId) {
    if (this.refs.hasOwnProperty(layerId)) {
      let layer = this.refs[layerId];

      if (!layer.hidden) {
        layer.hidden = true;
          if(this.props.type === "fir") {
              this.refs[layerId + "_fnrField"].hidden = true;
              this.refs[layerId + "_omradeField"].hidden = true;
          }
        layer.value = '';
      } else {
        layer.hidden = false;
          if(this.props.type === "fir") {
              this.refs[layerId + "_fnrField"].hidden = false;
              this.refs[layerId + "_omradeField"].hidden = false;
          }
      }
    }
  }

  buildLayerItem (layer){
      if(this.props.type === "fir"){
          if (this.props.authActive){
              return (
                  <div>
                      <input ref={layer.id + "_fnrField"} type='text' hidden='true' placeholder='fnrField' onChange={(e) => { this.props.handleAddSearchable(e, layer); }} />
                      <input ref={layer.id + "_omradeField"} type='text' hidden='true' placeholder='omradeField' onChange={(e) => { this.props.handleAddSearchable(e, layer); }} />
                      <input ref={layer.id} type='text' hidden='true' placeholder='Tillträde' onChange={(e) => { this.props.handleAddSearchable(e, layer); }} />
                  </div>
              );
          } else {
              return (
                  <div>
                      <input ref={layer.id + "_fnrField"} type='text' hidden='true' placeholder='fnrField' onChange={(e) => { this.props.handleAddSearchable(e, layer); }} />
                      <input ref={layer.id + "_omradeField"} type='text' hidden='true' placeholder='omradeField' onChange={(e) => { this.props.handleAddSearchable(e, layer); }} />
                  </div>
              );
          }

      } else {
          if(this.props.authActive){
              return (
                  <div>
                      <input ref={layer.id} type='text' hidden='true' placeholder='Tillträde' onChange={(e) => { this.props.handleAddSearchable(e, layer); }} />
                  </div>
              );
          }
      }
  }

  buildList () {
    console.log("tree.jsx");

    return (
      <div>
        <label>Tillgängliga tjänster</label>
        <div className='layer-list'>
          <ul>
            {this.props.layers.map((layer) => {
              return (
                <li key={layer.id}>
                  <input
                    type='checkbox'
                    ref={'cb_' + layer.id}
                    className={'checkbox_' + layer.id}
                    onChange={(e) => {
                      this.props.handleAddSearchable(e, layer);
                      this.toggleHide(layer.id);
                    }} />&nbsp;
                  <label>{layer.caption}</label>
                    {this.buildLayerItem(layer)}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    );
  }

  render () {
    if (this.props.layers) {
      return <div>{this.buildList()}</div>;
    } else {
      return <div />;
    }
  }
}
