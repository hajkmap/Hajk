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
import LocalStorageHelper from "../../utils/LocalStorageHelper";

class BookmarksModel {
  #storageKey;

  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.globalObserver = settings.app.globalObserver;
    this.bookmarks = this.readFromStorage() || {};
    this.#storageKey = settings.storageKey || "bookmarks";
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

  getVisibleSubLayers() {
    const partlyToggledGroupLayers = {};

    // Loop through the layers in the map
    this.map
      .getLayers()
      .getArray()
      .filter((layer) => {
        return (
          layer.getVisible() &&
          layer.getProperties().name &&
          isValidLayerId(layer.getProperties().name) &&
          layer.getProperties().layerType === "group" &&
          layer.subLayers?.length !==
            layer.getSource().getParams?.().LAYERS?.split(",").length
        );
      })
      .forEach((layer) => {
        partlyToggledGroupLayers[layer.getProperties().name] = layer
          .getSource()
          .getParams().LAYERS;
      });

    return partlyToggledGroupLayers;
  }

  setVisibleSubLayers(visibleSubLayers) {
    this.map
      .getLayers()
      .getArray()
      .forEach((layer) => {
        const layerName = layer.getProperties().name;

        if (visibleSubLayers[layerName]) {
          const subLayers = visibleSubLayers[layerName];

          layer.getSource().updateParams({
            LAYERS: subLayers,
          });
        }
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

    const state = {
      m: this.app.config.activeMap,
      l: this.getVisibleLayers(),
      gl: this.getVisibleSubLayers(),
      ...pos,
    };

    return state;
  }

  setMapState(bookmark) {
    if (!bookmark) {
      return;
    }

    bookmark = this.getDecodedBookmark(bookmark);

    this.setVisibleLayers(bookmark.settings.l);

    // Check if the 'gl' parameter exists in the bookmark, if so, apply it, otherwise skip
    if (bookmark.settings.gl) {
      this.setVisibleSubLayers(bookmark.settings.gl);
    }

    // Set map view
    let view = this.map.getView();
    view.setCenter([bookmark.settings.x, bookmark.settings.y]);
    view.setZoom(bookmark.settings.z);

    bookmark = null;
  }

  readFromStorage() {
    // Check if we have legacy bookmarks in localStorage.
    if (localStorage.getItem("bookmarks_v1.0")) {
      // TODO: Describe in https://github.com/hajkmap/Hajk/wiki/Cookies-in-Hajk and add the functionalOk() hook
      const legacyBookmarks = JSON.parse(
        localStorage.getItem("bookmarks_v1.0")
      );
      const newBookmarks = {};
      legacyBookmarks.forEach((bookmark) => {
        const decodedBookmark = this.getDecodedBookmark(bookmark);
        if (!decodedBookmark) return;
        const keyName = decodedBookmark.settings.m || this.app.config.activeMap;
        try {
          LocalStorageHelper.setKeyName(keyName);
        } catch (error) {
          console.log(
            `An error occurred while trying to set the bookmarks in localStorage: ${error}`
          );
        }

        const inStorage = LocalStorageHelper.get(
          this.#storageKey || "bookmarks"
        );
        newBookmarks[keyName] = inStorage || {};
        newBookmarks[keyName][decodedBookmark.name] = {
          settings: bookmark.settings,
        };

        LocalStorageHelper.set(
          this.#storageKey || "bookmarks",
          newBookmarks[keyName]
        );
      });

      localStorage.removeItem("bookmarks_v1.0");

      // Change back to current map.
      LocalStorageHelper.setKeyName(this.app.config.activeMap);
    }

    const inStorage = LocalStorageHelper.get(this.#storageKey);
    this.bookmarks = inStorage || {};
  }

  writeToStorage() {
    // TODO: Describe in https://github.com/hajkmap/Hajk/wiki/Cookies-in-Hajk and add the functionalOk() hook
    LocalStorageHelper.set(this.#storageKey, this.bookmarks);
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
    return Object.keys(this.bookmarks).includes(name);
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

  deleteBookmark(name) {
    delete this.bookmarks[name];
    this.writeToStorage();
  }

  handleChangeCookieSettingsClick = () => {
    this.globalObserver.publish("core.showCookieBanner");
  };
}

export default BookmarksModel;
