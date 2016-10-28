var LegendButton = React.createClass({
  render: function () {
    var title = this.props.checked ? "Dölj teckenförklaring" : "Visa teckenförklaring";
    var className = this.props.checked ? "fa fa-times" : "fa fa-times rotate-45";
    return (
       <span className="clickable pull-right" title={title} style={{ position: 'relative', top: '2px' }}>
          <i className={className}></i>
       </span>
    );
  }
});

module.exports = LegendButton;