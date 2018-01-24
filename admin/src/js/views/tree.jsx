import React, { Component } from 'react';

export default class Tree extends Component {
	constructor(props) {
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
		//this.setState({ checked: !this.state.checked });
		if (this.refs.hasOwnProperty(layerId)) {
			let layer = this.refs[layerId];
		
			if (!layer.hidden) {
				layer.hidden = true;
				layer.value = "";
			} else {
				layer.hidden = false;
			}
		} 
	}

	buildList () {
        return (
					<div>
						<label>Tillgängliga söktjänster</label>
            <div className="layer-list">
							<ul>
								{ this.props.layers.map((layer) => {
									return (
										<li key={ layer.id } className="">
											<input 
												type="checkbox"
												ref={ "cb_" + layer.id }
												className={ "checkbox_" + layer.id } 
												onChange={ (e) => { 
													this.props.handleAddSearchable(e, layer);
													this.toggleHide(layer.id)
												}} />&nbsp;
											<label>{ layer.caption }</label>
											<input ref={layer.id} type="text" hidden="true" placeholder="Tillträde" onChange={ (e) => { this.props.handleAddSearchable(e, layer) } } />
										</li>
									);
								})}
							</ul>
            </div>
					</div>
        );
    }
  
    render() {
				if (this.props.layers) {
					return <div>{this.buildList()}</div>
				} else {
					return <div></div>;
				}
    }
}

{/* <li key={"fromCapability_" + i} className="list-item">
            <div className="col-md-6 overflow-hidden">
              <input
                ref={layer.Name}
                id={"layer" + i}
                type="checkbox"
                data-type="wms-layer"
                checked={this.state.addedLayers.find(l => l === layer.Name)}
                onChange={(e) => {
                  this.setState({ 'caption': layer.Title });
                  this.setState({ 'content': layer.Abstract });
                  this.appendLayer(e, layer.Name);
                }} />&nbsp;
                <label htmlFor={"layer" + i}>{layer.Name}</label>{title}
            </div>
            <i style={{ display: "none" }} className={classNames} onClick={(e) => this.describeLayer(e, layer.Name)}></i>
            <span className={queryableIcon + " col-md-1"} />
          </li> */}