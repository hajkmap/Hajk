/**
 * React Class Feature Info
 * @class
 */
var FeatureInfo = React.createClass({
  /**
   *
   *
   */
  render: function () {
    if (!this.props.info) {
      return false;
    }

    var rawMarkup = marked(this.props.info.information, { sanitize: false, gfm: true, breaks: true });
    var icon = '';

    if (this.props.info.iconUrl != '') {
      icon = <img src={this.props.info.iconUrl}></img>;
    }

    return (
      <div>
        <div className="header">{icon}<h1>{this.props.info.caption}</h1></div>
        <div className="information">
          <span dangerouslySetInnerHTML={{__html: rawMarkup}} />
        </div>
      </div>
    );
  }
});

module.exports = FeatureInfo;