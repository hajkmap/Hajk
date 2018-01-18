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

	componentDidMount () {
		this.setState({properties: this.props.properties});
	}
	/**
	 * Kräver en string-array och returnerar list
	 * items för varje plats i arrayen
	 * @param {*} properties 
	 */
	renderProperties() {
		return (
			this.state.properties.map((name) => {
				return <li key={name}>{name}</li>
			})
		);
	}

	render() {
		if (!this.props.show) {
			return (
				<div>
					<legend className="header-side">Tillgängliga AD-grupper</legend>
					<ul className="details properties-list"> 
						{this.renderProperties(this.props.properties)}
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