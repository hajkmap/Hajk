/**
 * React Class Filter Result Button
 * @class
 */
var FilterResultButton = React.createClass ({
	/**
	 *
	 *
	 */
	getInitialState: function () {
		return {};
	},
	/**
	 *
	 *
	 */
	createId: function(p) {
		return '' + p.type + '_' + p.num + '_' + p.layer;
	},
	/**
	 *
	 *
	 */
	componentWillMount: function () {
		var style = { color: 'lightgray' };
		var title = 'Aktivera filter';
		var filterList = this.props.filterList;
		var filterApplied = false;
		var selectedFilter;
		var filterModel = {
			type: this.props.type,
			num: this.props.num,
			layer: this.props.layer,
			id: this.createId(this.props)
		};

		selectedFilter = _.find(filterList, filter => filterModel.id === filter.id);

		if (selectedFilter) {
			filterApplied = true;
			style.color = 'black';
			filterModel = selectedFilter;
			title = 'Avaktivera filter';
		}

		this.setState({
			filterModel: filterModel,
			title: title,
			style: style,
			filterApplied: filterApplied,
			caption: this.props.caption
		});
	},
	/**
	 *
	 *
	 */
	toggleFilter: function () {
		var toggleFilter = this.props.toggleFilter.bind(null, this.state.filterApplied, this.state.filterModel);
		toggleFilter();
		this.setState({
			style: {color: !this.state.filterApplied ? 'black' : 'lightgray' },
			filterApplied: !this.state.filterApplied
		});
	},
	/**
	 *
	 *
	 */
	render: function () {
		return (
			<button className="list-group-item" onClick={this.toggleFilter}>
				<span>Se alla {this.state.caption}</span>
				<i className="fa fa-filter pull-right" style={this.state.style} title={this.state.title}></i>
			</button>
		);
	}
});

module.exports = FilterResultButton;