var Shell = require('views/shell');
var ShellModel = require('models/shell');

/**
 * Backbone View Application
 * @class
 */
var Application = Backbone.View.extend({
  /**
   *
   *
   */
  el: "application",
  /**
   *
   *
   */
  load: function (config, isBookmark, bookmarks) {
    this.shell = new ShellModel(config);
    this.shell.setBookmarks(bookmarks);
    this.shell.on('change:configUpdated', () => {
      var currentBookmarks = this.shell.getBookmarks();
      this.load(this.shell.getConfig(), true, currentBookmarks);
    });
    if (isBookmark) {
      this.render(true);
    }
  },
  /**
   *
   *
   */
  initialize: function (config, bookmarks) {
    this.load(config, false, bookmarks);
  },
  /**
   *
   *
   */
  render: function (force) {

    var el = document.getElementById(this.$el.selector);
    var errorStyle = { 'margin-top': '50px', 'text-align': 'center' };

    if (!el) {
      return alert("Applikationen har stannat. Försök igen senare.");
    }

    if (force) {
      React.unmountComponentAtNode(el);
    }

    if (this.shell.get('canStart')) {
      ReactDOM.render(<Shell model={this.shell} />, el);
    } else {
      ReactDOM.render(
        <div className="container">
          <div className="alert alert-danger" style={errorStyle}>
            <h2>Kartan kunde inte startas upp.</h2>
            <p>Var god kontakta systemadminstratören.</p>
          </div>
        </div>,
        el
      );
    }
  }
});

module.exports = Application;
