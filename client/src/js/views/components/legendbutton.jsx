/**
 * React Class Legend Button
 * @class
 */
var LegendButton = React.createClass({
  /**
   *
   *
   */
  render: function () {

    var title = this.props.checked ? "Dölj teckenförklaring" : "Visa teckenförklaring";
    var className = this.props.checked ? "fa fa-minus-square" : "fa fa-plus-square";

    return (
       <span className="clickable pull-right" title={title}>
          <i className={className}></i>
       </span>
    );
  }

});

module.exports = LegendButton;