/**
 *
 *
 */
var Toolbar = React.createClass({
  /**
   *
   *
   */
  getInitialState: function() {
    return {};
  },
  /**
   *
   *
   */
  render: function () {
    var tools = this.props.model.filter(t => t.get('toolbar')).map((tool, index) => {
      return (
        <button
          type="button"
          className="btn btn-default"
          onClick={tool.clicked.bind(tool)}
          key={index}
          title={tool.get("title")}>
          <i className={ tool.get("icon") }></i>
        </button>
      );
    });

    return (
      <div className="map-toolbar-wrapper">
        <div
          className="btn-group btn-group-lg map-toolbar"
          role="group"
          aria-label="toolbar">
          {tools}
        </div>
      </div>
    );
  }

});

module.exports = Toolbar;