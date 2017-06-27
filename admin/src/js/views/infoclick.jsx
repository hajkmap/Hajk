import React, { Component } from 'react'

class InfoClick extends React.Component {
	constructor(props) {
		super(props)
		this.state = {
			queryable: this.props.queryable,
			infobox: this.props.infobox
		};
	}



	render() {
		var addedLayerComponents = this.props.addedLayers.map((layer, i) => {
			return ( 
			<div key={"infoclick_row_" + i} className="row infoclick-box">
			<h3 className="infoclick-heading" key={"title_" + i}>{layer}</h3>
				<div key={"col_1_" + i} className="col-md-6">
					<div key={"form_grp_1_" + i} className="form-group">
						<label htmlFor="infoclickable">Infoklickbar</label>
						<input
							id="infoclickable"
							type="checkbox"
							ref="input_queryable"
							onChange={(e) => { this.setState({ queryable: e.target.checked }) }}
							checked={this.state.queryable}
							key={"checkbox_" + i}
						/>
					</div>
				</div>
				<div key={"col_2_" + i} className="col-md-6">
					<div key={"form_grp_2_" + i} className="form-group">
						<label>Inforuta</label>
						<textarea
							ref="input_infobox"
							value={this.state.infobox}
							onChange={(e) => this.setState({ 'infobox': e.target.value })}
							className="form-control"
							key={"textarea_" + i}
						/>
					</div>
				</div>
			</div>
			)
		});

		return (
			<div>{addedLayerComponents}</div>
		)
	}
}

export default InfoClick