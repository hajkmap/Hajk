/**
 * React Class Label Panel
 * @class
 */
var LabelPanel = React.createClass({
  /**
   *
   *
   */
  render: function () {
    var showLabels = this.props.showLabels;
    if (!this.props.labelFields) {
      return false;
    }
    return (
      <span
        className="clickable"
        onClick={this.props.toggleLabels}
        title={showLabels ? "Dölj etiketter": "Visa etiketter"}>
        <i className={showLabels ? "fa fa-toggle-on fa-lg" : "fa fa-toggle-off fa-lg"}></i>&nbsp;
        <span>Etiketter</span>
      </span>
    );
   }
});

module.exports = LabelPanel;