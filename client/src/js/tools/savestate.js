
var ToolModel = require('tools/tool');

module.exports = ToolModel.extend({

  defaults: {
    type: 'savestate',
    panel: 'bookmarkpanel',
    toolbar: 'bottom',
    icon: 'fa fa-bookmark icon',
    title: 'Bokmärken',
    visible: false,
    shell: undefined,
    settingsUrl: "",
    bookmarks: []
  },
  /**
   * @desc Create savestate tool.
   * @constructor
   * @param {object} options | Options loaded from the configuration.
   * @return {undefined}
   */
  initialize: function (options) {
    ToolModel.prototype.initialize.call(this);
  },
  /**
   * @desc Configure the tool when the Applicatiion (shell) is ready.
   * @param {object} options | Options loaded from the configuration.
   * @return {undefined}
   */
  configure: function (shell) {
     var url = this.get('settingsUrl'), req;
     this.set('shell', shell);
     if (!shell.getBookmarks()) {
        req = $.ajax({
           url: url,
           type: 'get',
           crossDomain: true,
           contentType: 'application/json',
           dataType: 'json'
        });
        req.success((bookmarks) => {
          shell.setBookmarks(bookmarks);
        });
     }
  },
  /**
   * @desc Reload the application with given bookmark.
   * @param {object} bookmark | Bookmark with settings to be loaded.
   * @return {undefined}
   */
  updateApplication: function (bookmark) {
    var json = atob(bookmark.settings);
    var settings = JSON.parse(json);
    this.get('shell').setConfig(settings);
  },
  /**
   * @desc Add and save a new bookmark.
   * @param {string} name | Name of the bookmark.
   * @param {function} callback | Fn to be called when the save is complete.
   * @return {undefined}
   */
  addBookmark: function (name, callback) {
    var numBookmarks = this.getBookmarks() &&
        this.getBookmarks().length ?
        this.getBookmarks().length : 0;
    var model = this.get('shell').toJSON();
    var b64 = btoa(model);
    var data = JSON.stringify({
      name: name,
      settings: b64,
      favourite: numBookmarks === 0 ? true : false
    });
    $.ajax({
      url: this.get('settingsUrl'),
      type: 'post',
      contentType: 'application/json',
      dataType: 'json',
      data: data,
      success: bookmarks => {
        this.get('shell').setBookmarks(bookmarks);
        callback();
      }
    });
  },

  /**
  * @desc Update an existing bookmark.
  * @param {object} bookmark | Bookmark to be updated.
  * @param {function} callback | Fn to be called when the update is complete.
  * @return {undefined}
  */
  updateBookmark: function(bookmark, callback) {
    $.ajax({
      url: this.get('settingsUrl'),
      type: 'put',
      contentType: 'application/json',
      data: JSON.stringify(bookmark),
      dataType: 'json',
      success:(bookmarks) => {
        this.get('shell').setBookmarks(bookmarks);
        callback();
      }
    });
  },

  /**
   * @desc Update an existing bookmark.
   * @param {number} id | ID of bookmark to be removed.
   * @param {function} callback | Fn to be called when the removal is complete.
   * @return {undefined}
   */
  removeBookmark: function(id, callback) {
    $.ajax({
      url: this.get('settingsUrl') + id,
      type: 'delete',
      contentType: 'application/json',
      dataType: 'json',
      success:(bookmarks) => {
        this.get('shell').setBookmarks(bookmarks);
        callback();
      }
    });
  },
  /**
   * @desc Get bookmarks from shell.
   * @return {[object]} bookmarks
   */
  getBookmarks: function () {
    return this.get('shell').getBookmarks();
  },
  /**
   * @desc Event handler triggered when the tool is clicked.
   * @return {undefined}
   */
  clicked: function () {
    this.set('visible', true);
  }

});
