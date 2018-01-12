import React, {
	Component
} from 'react';

const defaultState = {
	properties: []
};

export default class ListProperties extends Component {
	constructor(props) {
		super(props);
		this.state = defaultState;
	}

	/**
	 * Kräver en string-array och returnerar list
	 * items för varje plats i arrayen
	 * @param {*} properties 
	 */
	renderProperties(properties) {
		return (
			properties.map((name) => {
				return <li>{name}</li>
			})
		);
	}

	render() {
		if (this.props.show) {
			return (
				<div>
					<ul className="properties-list"> 
						{this.renderProperties()}
					</ul>
				</div>
				
			);
		} else {
			return (
				<div></div>
			);
		}

	}
}