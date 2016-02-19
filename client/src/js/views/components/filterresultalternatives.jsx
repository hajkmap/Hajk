var FilterResultButton = require('components/filterresultbutton');
/**
 * React Class Filter Result Alternatives
 * @class
 */
var FilterResultAlternatives = React.createClass ({
	/**
	 *
	 *
	 */
	toggleFilter: function (filterApplied, options) {
		if (filterApplied) {
			this.props.removeFilter(options);
		} else {
			this.props.addFilter(options);
		}
	},

	getAlternatives: function (props) {

		var filterButtons = [];
		var type = props.type;
		var num = props.num;
		var filterList = props.filterList;
		var toggleFilter = _.bind(this.toggleFilter, this);

		if (type !== 'tur') {
			filterButtons.push({
				filterList: filterList,
				type: props.type,
				num: props.num,
				layer: 'stoparea',
				caption: 'hållplatser',
				toggleFilter: toggleFilter
			});
		}

		filterButtons.push({
			filterList: filterList,
			type: props.type,
			num: props.num,
			layer: 'publicTrafic',
			caption: 'fordon',
			toggleFilter: toggleFilter
		});

		return _.map(filterButtons, (props, i) =>
			<FilterResultButton
				key={i}
				filterList={props.filterList}
				type={props.type}
				num={props.num}
				layer={props.layer}
				caption={props.caption}
				toggleFilter={props.toggleFilter} />
		);
	},
	/**
	 *
	 *
	 */
	render: function () {
		var filterAlternatives = this.getAlternatives(this.props);
		if (this.props.show) {
			return (<div>{filterAlternatives}</div>);
		} else {
			return false;
		}
	}
});

module.exports = FilterResultAlternatives;