/**
 * @class
 */
var FeatureInfoView = {
  /**
   * Convert object to markdown
   * @instance
   * @param {object} object to transform
   * @return {string} markdown
   */
  objectAsMarkdown: function (o) {
    return Object
      .keys(o)
      .reduce((str, next, index, arr) =>
        /^geom$|^geometry$|^the_geom$/.test(arr[index]) ?
        str : str + `**${arr[index]}**: ${o[arr[index]]}\r`
      , "");
  },

  /**
   * Render the feature info component.
   * @instance
   * @return {external:ReactElement}
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
};

/**
 * BackgroundSwitcherView module.<br>
 * Use <code>require('views/backgroundswitcher')</code> for instantiation.
 * @module BackgroundSwitcherView-module
 * @returns {BackgroundSwitcherView}
 */
module.exports = React.createClass(FeatureInfoView);