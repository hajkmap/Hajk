import React, { Component } from 'react';

export default class TableProperties extends Component {
	renderRows (data) {
		return data.map((layer) => {
			<tr key={layer.id}>
				<td>{layer.id}</td>
				<td>{layer.name}</td>
			</tr>
		});
	}

	render() {
		return (
			<div>
				<table className="table">
					<thead>
						<tr>
							<td>Id</td>
							<td>Namn</td>
						</tr>
					</thead>
					<tbody>
						{renderRows(this.props.data)}
					</tbody>
				</table>
			</div>	
		);
	}
}