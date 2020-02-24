import DocumentWindowBase from "./documentWindow/DocumentWindowBase";

/**
 * @summary  DocumentHandler model that doesn't do much.
 * @description This model exposes only one method, getMap(),
 * so it does not do anything crucial. But you can see it
 * as an example of how a plugin can be separated in different
 * components.
 *
 * @class DocumentHandlerModel
 */

const fetchConfig = {
  credentials: "same-origin"
};

export default class DocumentHandlerModel {
  constructor(settings) {}

  async list(callback) {
    let response;
    try {
      response = await fetch(
        "http://localhost:55630/informative/list",
        fetchConfig
      );
      const text = await response.text();
      const document = await JSON.parse(text);
      callback(document);
    } catch (err) {}
  }

  setParentChapter(chapter, parent) {
    chapter.parent = parent;
    if (chapter.chapters.length > 0) {
      chapter.chapters.forEach(child => {
        this.setParentChapter(child, chapter);
      });
    }
  }

  async load(title, callback) {
    let response;
    try {
      response = await fetch(
        `http://localhost:55630/informative/load/${title}`,
        fetchConfig
      );
      const text = await response.text();
      const document = await JSON.parse(text);
      document.chapters.forEach(chapter => {
        this.setParentChapter(chapter, undefined);
      });

      callback(document);
    } catch (err) {}
  }
  /**
   * Returns the global Map object.
   *
   * @returns {object} Map
   * @memberof  DocumentHandlerModel
   */
  getMap() {
    return this.map;
  }
}
