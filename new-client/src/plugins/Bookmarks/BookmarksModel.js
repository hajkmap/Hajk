/**
 * @summary Handles the users bookmarks in localStorage
 * @description  Read/Writes bookmarks
 *
 * @class BookmarksModel
 */

/**
 * Store bookmarks using a key with version.
 * In future we might want to create backwardcompatibility if we add functionality.
 */

import { isValidLayerId } from "../../utils/Validator";

const bookmarksVersion = "1.0";
const storageKey = `bookmarks_v${bookmarksVersion}`;

class BookmarksModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.bookmarks = [];

    this.readFromStorage();
  }

  getVisibleLayers() {
    return this.map
      .getLayers()
      .getArray()
      .filter(
        (layer) =>
          layer.getVisible() &&
          layer.getProperties().name &&
          isValidLayerId(layer.getProperties().name)
      )
      .map((layer) => layer.getProperties().name)
      .join(",");
  }

  setVisibleLayers(strLayers) {
    let layers = strLayers.split(",");
    this.map
      .getLayers()
      .getArray()
      .filter(
        (layer) =>
          layer.getProperties().name &&
          isValidLayerId(layer.getProperties().name)
      )
      .forEach((layer) => {
        layer.setVisible(layers.indexOf(layer.getProperties().name) > -1);
      });
  }

  getMapState() {
    const view = this.map.getView();
    const viewCenter = view.getCenter();
    const pos = {
      x: viewCenter[0],
      y: viewCenter[1],
      z: view.getZoom(),
    };

    return {
      m: this.app.config.activeMap,
      l: this.getVisibleLayers(),
      ...pos,
    };
  }

  setMapStateFromBookmarkIndex(index) {
    let bookmark = this.bookmarks[index];
    if (bookmark) {
      this.setMapState(bookmark);
    }
  }

  setMapState(bookmark) {
    if (!bookmark) {
      return;
    }

    let bm = this.getDecodedBookmark(bookmark);
    this.setVisibleLayers(bm.settings.l);
    let view = this.map.getView();
    view.setCenter([bm.settings.x, bm.settings.y]);
    view.setZoom(bm.settings.z);
    bm = null;
  }

  readFromStorage() {
    let storedBookmarks = localStorage.getItem(storageKey);
    if (!storedBookmarks) {
      let emptyJSONArr = "[]";
      // TODO: Describe in https://github.com/hajkmap/Hajk/wiki/Cookies-in-Hajk and add the functionalOk() hook
      localStorage.setItem(storageKey, emptyJSONArr);
      storedBookmarks = emptyJSONArr;
    }
    this.bookmarks = JSON.parse(storedBookmarks);
  }

  writeToStorage() {
    // TODO: Describe in https://github.com/hajkmap/Hajk/wiki/Cookies-in-Hajk and add the functionalOk() hook
    localStorage.setItem(storageKey, JSON.stringify(this.bookmarks));
  }

  getDecodedBookmark(bookmark) {
    let decoded = null;
    if (bookmark) {
      decoded = { ...bookmark };
      decoded.settings = JSON.parse(atob(bookmark.settings));
    }
    return decoded;
  }

  bookmarkWithNameExists(name) {
    return this.bookmarks.find((bookmark) => bookmark.name === name);
  }

  replaceBookmark(bookmark) {
    if (bookmark) {
      bookmark.settings = btoa(JSON.stringify(this.getMapState()));
      this.writeToStorage();
    }
  }

  addBookmark(name, allowReplace = false) {
    // Check if bookmark exist and if we should replace it.
    if (this.bookmarkWithNameExists(name) && allowReplace) {
      this.replaceBookmark(this.bookmarks[name]);
      return;
    }

    this.bookmarks[name] = {
      settings: btoa(JSON.stringify(this.getMapState())),
    };
    this.writeToStorage();
  }

  removeBookmark(bookmark) {
    let index = this.bookmarks.indexOf(bookmark);
    if (index > -1) {
      this.bookmarks.splice(index, 1);
      this.writeToStorage();
    }
  }

  getBookmarks() {
    return this.bookmarks;
  }
}

export default BookmarksModel;
