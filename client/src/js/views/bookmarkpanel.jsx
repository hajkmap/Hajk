var Panel = require('views/panel');
/**
 * React Class Bookmark Panel
 * @class
 */
var BookmarkPanel = React.createClass({
  /**
   * Get initial state
   *
   * @override
   * @return {object}
   */
  getInitialState: function() {
    return {
    };
  },
  /**
   * Triggered when component updates.
   *
   * @override
   * @return {undefined}
   */
  componentDidUpdate: function () {
    this.bind();
  },
  /**
   * Triggered when the component is successfully mounted into the DOM.
   *
   * @override
   * @return {undefined}
   */
  componentDidMount: function () {
    this.bind();
  },
  /**
   * Bind DOM events.
   *
   * @return {undefined}
   */
  bind: function () {
    var node = $(this.getDOMNode()); //Öh va?
    node.find('li').mousedown(() => false); //fortsättning på öh va.....
  },
  /**
   * Delegate to handle insertion of bookmarks.
   *
   * @param {SynteticEvent} e | event.
   * @return {undefined}
   */
  onSubmitForm: function (e) {
    var name = this.refs.name.getDOMNode().value;
    this.props.model.addBookmark(name, () => this.forceUpdate());
    e.preventDefault();
  },
  /**
   * Remove a bookmark from the view.
   *
   * @param {number} id | ID of bookmark.
   * @param {SynteticEvent} e | event.
   * @return {undefined}
   */
  removeBookmark: function (id, e) {
    this.props.model.removeBookmark(id, () => this.forceUpdate());
    e.stopPropagation();
  },
  /**
   * Update a bookmark in the view.
   *
   * @param {number} id | ID of bookmark.
   * @param {SynteticEvent} e | event.
   * @return {undefined}
   */
  updateBookmark: function (id, e) {
    var bookmarks = this.props.model.getBookmarks();
    var bookmark = bookmarks.filter(bookmark => bookmark.id === id)[0];
    bookmarks.forEach((bookmark) => { bookmark.favourite = false });

    if (bookmark) {
      bookmark.favourite = true;
      this.props.model.updateBookmark(bookmark, () => this.forceUpdate());
    }

    e.stopPropagation();
  },
  /**
   * Load a bookmark through the model.
   *
   * @param {object} bookmark
   * @return {undefined}
   */
  loadBookmark: function (bookmark) {
    this.props.model.updateApplication(bookmark);
  },
  /**
   * Render the view.
   *
   * @return {React.Component}
   */
  render: function () {

    var bookmarks = this.props.model.getBookmarks();
    var items = null;

    if (bookmarks) {
      items = bookmarks.map((bookmark, i) => {
        var iconClass = bookmark.favourite ?
          'favourite fa icon fa-check-circle' :
          'favourite fa icon fa-circle';
        return (
          <li key={i} onClick={this.loadBookmark.bind(this, bookmark)}>
            <i className={iconClass} onClick={this.updateBookmark.bind(this, bookmark.id)}></i>
            {bookmark.name}
            <i className="delete fa icon fa-remove" onClick={this.removeBookmark.bind(this, bookmark.id)}></i>
          </li>
        );
      });
    }

    return (
      <Panel title="Bokmärken" onCloseClicked={this.props.onCloseClicked}>
        <div className="bookmark-panel panel-content">
          <form onSubmit={this.onSubmitForm}>
            <div className="form-group">
              <label>Lägg till bokmärke</label>
              <div className="input-group">
                <div className="input-group-addon">
                  <i className="fa fa-bookmark"></i>
                </div>
                <input type="text"
                  ref="name"
                  className="form-control"
                  placeholder="Ange namn" />
              </div>
            </div>
          </form>
          <ul>{items}</ul>
        </div>
      </Panel>
    );
  }

});


module.exports = BookmarkPanel;