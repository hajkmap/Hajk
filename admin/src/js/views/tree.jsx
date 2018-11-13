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
        layer.value = '';
      } else {
        layer.hidden = false;
      }
    }
  }

  buildList () {
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
                  <input ref={layer.id} type='text' hidden='true' placeholder='Tillträde' onChange={(e) => { this.props.handleAddSearchable(e, layer); }} />
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
