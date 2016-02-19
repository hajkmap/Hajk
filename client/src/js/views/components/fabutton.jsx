/**
 * React Class Fa Button
 * @class
 * Obsolite
 */
var FaButton = React.createClass({
  /**
   *
   *
   */
  getDefaultProps: function () {
    return {
      /** */
      onClick: function () { },
      /** */
      customClass: '',
      /** */
      icon: '',
      /** */
      right: false
    };
  },
  /**
   *
   *
   */
  render: function () {

    var onClick = this.props.onClick;
    var btnClassName = 'btn';
    var faClassName = 'fa ' + this.props.icon;

    if (this.props.right) {
       btnClassName += ' btn-right';
    }
    if (this.props.customClass) {
      btnClassName += ' ' + this.props.customClass;
    }
    return (
      <div className={btnClassName} title={this.props.title} onClick={onClick}>
        <i className={faClassName}></i>
      </div>
    );
  }
});

module.exports = FaButton;