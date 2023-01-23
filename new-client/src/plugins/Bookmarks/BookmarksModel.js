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

import { useState, useEffect } from "react";
import { isValidLayerId } from "../../utils/Validator";

const bookmarksVersion = "1.0";
const storageKey = `bookmarks_v${bookmarksVersion}`;

const BookmarksModel = (settings) => {
  const map = useState(settings.map);
  const app = useState(settings.app);
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    readFromStorage();
  }, []);

  const getVisibleLayers = () => {
    return map
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
  };

  const setVisibleLayers = (strLayers) => {
    let layers = strLayers.split(",");
    map
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
  };

  const getMapState = () => {
    const view = map.getView();
    const viewCenter = view.getCenter();
    const pos = {
      x: viewCenter[0],
      y: viewCenter[1],
      z: view.getZoom(),
    };

    return {
      m: app.config.activeMap,
      l: getVisibleLayers(),
      ...pos,
    };
  };

  const setMapStateFromBookmarkIndex = (index) => {
    let bookmark = bookmarks[index];
    if (bookmark) {
      setMapState(bookmark);
    }
  };

  const setMapState = (bookmark) => {
    if (!bookmark) {
      return;
    }

    let bm = getDecodedBookmark(bookmark);
    setVisibleLayers(bm.settings.l);
    let view = map.getView();
    view.setCenter([bm.settings.x, bm.settings.y]);
    view.setZoom(bm.settings.z);
    bm = null;
  };

  const readFromStorage = () => {
    let storedBookmarks = localStorage.getItem(storageKey);
    if (!storedBookmarks) {
      let emptyJSONArr = "[]";
      // TODO: Describe in https://github.com/hajkmap/Hajk/wiki/Cookies-in-Hajk and add the functionalOk() hook
      localStorage.setItem(storageKey, emptyJSONArr);
      storedBookmarks = emptyJSONArr;
    }
    setBookmarks(JSON.parse(storedBookmarks));
  };

  const writeToStorage = () => {
    // TODO: Describe in https://github.com/hajkmap/Hajk/wiki/Cookies-in-Hajk and add the functionalOk() hook
    localStorage.setItem(storageKey, JSON.stringify(bookmarks));
  };

  const getDecodedBookmark = (bookmark) => {
    let decoded = null;
    if (bookmark) {
      decoded = { ...bookmark };
      decoded.settings = JSON.parse(atob(bookmark.settings));
    }
    return decoded;
  };

  const bookmarkWithNameExists = (name) => {
    return bookmarks.find((bookmark) => bookmark.name === name);
  };

  const replaceBookmark = (bookmark) => {
    if (bookmark) {
      bookmark.settings = btoa(JSON.stringify(getMapState()));
      writeToStorage();
    }
  };

  const addBookmark = (name, allowReplace = false) => {
    let bookmark = bookmarkWithNameExists(name);

    if (bookmark) {
      if (allowReplace === true) {
        replaceBookmark(bookmark);
      }
      return false;
    }

    let settings = getMapState();
    bookmarks.push({
      name: name,
      settings: btoa(JSON.stringify(settings)),
      sortOrder: 0,
      favorite: false,
    });
    writeToStorage();

    return true;
  };

  const removeBookmark = (bookmark) => {
    let index = bookmarks.indexOf(bookmark);
    if (index > -1) {
      bookmarks.splice(index, 1);
      writeToStorage();
    }
  };

  const getBookmarks = () => {
    return bookmarks;
  };

  return {
    bookmarks,
    setBookmarks,
    getVisibleLayers,
    setVisibleLayers,
    getMapState,
    setMapStateFromBookmarkIndex,
    setMapState,
    readFromStorage,
    writeToStorage,
    getDecodedBookmark,
    bookmarkWithNameExists,
    replaceBookmark,
    addBookmark,
    removeBookmark,
    getBookmarks,
  };
};

export default BookmarksModel;
