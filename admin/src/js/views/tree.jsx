import React, { Component } from 'react';

export default class Tree extends Component {
	constructor(props) {
		super(props);
		this.state = {
			searchableLayers: []
		};
		this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
		
	}

	handleCheckboxChange(event, layer) {
		console.log("e", event);
		console.log("layer", layer);
	}

	buildList () {
        return (
					<div>
						<label>Tillgängliga söktjänster</label>
            <div className="layer-list">
                <ul>
                    {this.props.layers.map((layer) => {
                        return (
												<li key={ layer.id } className="">
													<input type="checkbox" 
																 className={"checkbox_" + layer.id} 
																 onChange={(e) => this.props.handleAddSearchable(e, layer)}
													/>&nbsp;
													<label>{ layer.caption }</label>
													<input className={ "input_" + layer.id } type="text" onChange={(e) => {
														this.props.handleAddSearchable(e, layer)
														if (e.target.checked === false ) {
															// TODO: rensa inmatning
														}
													}} />
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