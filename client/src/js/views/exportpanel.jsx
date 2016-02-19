var Panel = require('views/panel');

module.exports = React.createClass({

	getInitialState: function() {
		return {
		};
	},

	exportImage: function () {
		var node = $(this.getDOMNode()).find('#image');
		node.html('');
		this.props.model.exportImage((anchor) => {
			node.html(anchor);
		});
	},

	exportPDF: function () {
		var node = $(this.getDOMNode()).find('#pdf');
		node.html('');
		this.props.model.exportPDF((anchor) => {
			node.html(anchor);
		});
	},

	render: function () {
		return (
			<Panel title="Exportera karta" onCloseClicked={this.props.onCloseClicked}>
				<div onClick={this.exportImage}>
					<button className="btn btn-default">Skapa export som bild</button>
					<div id="image"></div>
				</div>
				<br/>
				<div onClick={this.exportPDF}>
					<button className="btn btn-default">Skapa export som pdf</button>
					<div id="pdf"></div>
				</div>
			</Panel>
		);
	}
});
