
var ToolModel = require('tools/tool');

/**
 * @typedef {Object} SaveStateModel~SaveStateModelProperties
 * @property {string} type - Default: export
 * @property {string} panel - Default: exportpanel
 * @property {string} title - Default: Skriv ut
 * @property {string} toolbar - Default: bottom
 * @property {string} icon - Default: fa fa-bookmark icon
 * @property {string} title - Default: Kartlager
 * @property {Shell} shell
 * @property {string} settingsUrl
 * @property {object[]} bookmarks
 */
var SaveStateProperties = {
  type: 'savestate',
  panel: 'bookmarkpanel',
  toolbar: 'bottom',
  icon: 'fa fa-bookmark icon',
  title: 'Bokmärken',
  visible: false,
  shell: undefined,
  settingsUrl: "",
  bookmarks: []
};

/**
 * Prototype for creating a layerswitcher model.
 * @class
 * @augments {external:"Backbone.Model"}
 * @param {SaveStateModel~SaveStateModelProperties} options - Default options
 */
var SaveStateModel = {
  /**
   * @instance
   * @property {SaveStateModel~SaveStateModelProperties} defaults - Default settings
   */
  defaults: SaveStateProperties,

  initialize: function (options) {
    ToolModel.prototype.initialize.call(this);
  },

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
   * Reload the application with given bookmark.
   * @instance
   * @param {object} bookmark - Bookmark with settings to be loaded.
   */
  updateApplication: function (bookmark) {
    var json = atob(bookmark.settings);
    var settings = JSON.parse(json);
    this.get('shell').setConfig(settings);
  },

  /**
   * Add and save a new bookmark.
   * @instance
   * @param {string} name - Name of the bookmark.
   * @param {function} callback - Fn to be called when the save is complete.
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
  * Update an existing bookmark.
  * @instance
  * @param {object} bookmark - Bookmark to be updated.
  * @param {function} callback - Fn to be called when the update is complete.
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
   * Update an existing bookmark.
   * @instance
   * @param {number} id - ID of bookmark to be removed.
   * @param {function} callback - Fn to be called when the removal is complete.
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
   * Get bookmarks from shell.
   * @instance
   * @return {object[]} bookmarks
   */
  getBookmarks: function () {
    return this.get('shell').getBookmarks();
  },

  /**
   * @description
   *
   *   Handle click event on toolbar button.
   *   This handler sets the property visible,
   *   wich in turn will trigger the change event of navigation model.
   *   In pracice this will activate corresponding panel as
   *   "active panel" in the navigation panel.
   *
   * @instance
   */
  clicked: function () {
    this.set('visible', true);
  }
};

/**
 * Save state model module.<br>
 * Use <code>require('models/savestate')</code> for instantiation.
 * @module SaveStateModel-module
 * @returns {SaveStateModel}
 */
module.exports = ToolModel.extend(SaveStateModel);