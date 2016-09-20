/**
 * React Class Feature Info
 * @class
 */
var FeatureInfo = React.createClass({

  objectAsMarkdown: function (o) {
    return Object
      .keys(o)
      .reduce((str, next, index, arr) =>
        /^geom$|^geometry$|^the_geom$/.test(arr[index]) ?
        str : str + `**${arr[index]}**: ${o[arr[index]]}\r`
      , "");
  },

  /**
   *
   *
   */
  render: function name() {
    if (!this.props.info) {
      return false;
    }

    var html = ""
    ,   icon = ''
    ,   info = this.props.info.information
    ;

    if (typeof info === 'object') {
      info = this.objectAsMarkdown(this.props.info.information);
    }

    html = marked(info, { sanitize: false, gfm: true, breaks: true });

    if (this.props.info.iconUrl != '') {
      icon = <img src={this.props.info.iconUrl}></img>;
    }

    return (
      <div>
        <div className="header">{icon}<h1>{this.props.info.caption}</h1></div>
        <div className="information">
          <span dangerouslySetInnerHTML={{__html: html}} />
        </div>
      </div>
    );
  }

});

module.exports = FeatureInfo;