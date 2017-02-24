// Copyright (C) 2016 Göteborgs Stad
//
// Denna programvara är fri mjukvara: den är tillåten att distribuera och modifiera
// under villkoren för licensen CC-BY-NC-SA 4.0.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the CC-BY-NC-SA 4.0 licence.
//
// http://creativecommons.org/licenses/by-nc-sa/4.0/
//
// Det är fritt att dela och anpassa programvaran för valfritt syfte
// med förbehåll att följande villkor följs:
// * Copyright till upphovsmannen inte modifieras.
// * Programvaran används i icke-kommersiellt syfte.
// * Licenstypen inte modifieras.
//
// Den här programvaran är öppen i syfte att den skall vara till nytta för andra
// men UTAN NÅGRA GARANTIER; även utan underförstådd garanti för
// SÄLJBARHET eller LÄMPLIGHET FÖR ETT VISST SYFTE.
//
// https://github.com/Johkar/Hajk2

var Panel = require('views/panel');
/**
 * @class
 */
var BookmarkPanelView = {
  /**
   * Get initial state.
   * @instance
   * @return {object}
   */
  getInitialState: function() {
    return {
    };
  },

  /**
   * Triggered when component updates.
   * @instance
   */
  componentDidUpdate: function () {
    this.bind();
  },

  /**
   * Triggered when the component is successfully mounted into the DOM.
   * @instance
   */
  componentDidMount: function () {
    this.bind();
  },

  /**
   * Bind DOM events.
   * @instance
   */
  bind: function () {
    var node = $(ReactDOM.findDOMNode(this));
    node.find('li').mousedown(() => false);
  },

  /**
   * Delegate to handle insertion of bookmarks.
   * @instance
   * @param {object} e - Syntetic DOM event.
   */
  onSubmitForm: function (e) {
    e.preventDefault();
    var name = ReactDOM.findDOMNode(this.refs.name).value;
    this.props.model.addBookmark(name, () => this.forceUpdate());
  },

  /**
   * Remove a bookmark from the view.
   * @instance
   * @param {number} id - ID of bookmark.
   * @param {object} e - Syntetic DOM event.
   */
  removeBookmark: function (id, e) {
    this.props.model.removeBookmark(id, () => this.forceUpdate());
    e.stopPropagation();
  },

  /**
   * Update a bookmark in the view.
   * @instance
   * @param {number} id - ID of bookmark.
   * @param {object} e - Syntetic DOM event.
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
   * @instance
   * @param {object} bookmark
   */
  loadBookmark: function (bookmark) {
    this.props.model.updateApplication(bookmark);
  },

  /**
   * Render the view.
   * @instance
   * @return {external:ReactElement}
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
      <Panel title="Bokmärken" onCloseClicked={this.props.onCloseClicked} onUnmountClicked={this.props.onUnmountClicked} minimized={this.props.minimized}>
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
};

/**
 * BookmarkPanelView module.<br>
 * Use <code>require('views/bookmarkpanel')</code> for instantiation.
 * @module BookmarkPanelView-module
 * @returns {BookmarkPanelView}
 */
module.exports = React.createClass(BookmarkPanelView);
