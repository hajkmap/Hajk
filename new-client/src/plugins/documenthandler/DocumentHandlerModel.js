import React from "react";

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
  internalId = 0;

  constructor(settings) {
    this.mapServiceUrl =
      settings.app.config.appConfig.proxy +
      settings.app.config.appConfig.mapserviceBase;
  }

  async listAllAvailableDocuments(callback) {
    let response;
    try {
      response = await fetch(
        `${this.mapServiceUrl}/informative/list`,
        fetchConfig
      );
      const text = await response.text();
      const document = await JSON.parse(text);
      callback(document);
    } catch (err) {}
  }

  async fetchJsonDocument(title, callback) {
    let response;
    try {
      response = await fetch(
        `${this.mapServiceUrl}/informative/load/${title}`,
        fetchConfig
      );
      const text = await response.text();
      const document = await JSON.parse(text);
      this.internalId = 0;
      document.chapters.forEach(chapter => {
        this.setParentChapter(chapter, undefined);
        this.setInternalId(chapter);
        this.setScrollReferences(chapter);
        this.internalId = this.internalId + 1;
      });

      callback(document);
    } catch (err) {}
  }

  findChapter(chapter, headerIdentifierToFind) {
    if (chapter.headerIdentifier === headerIdentifierToFind) {
      return chapter;
    }
    if (chapter.chapters.length > 0) {
      return chapter.chapters.find(child => {
        return this.findChapter(child, headerIdentifierToFind);
      });
    }
  }

  getHeaderRef = (activeDocument, headerIdentifierToFind) => {
    var foundChapter;
    activeDocument.chapters.some(chapter => {
      foundChapter = this.findChapter(chapter, headerIdentifierToFind);
      return foundChapter;
    });
    return foundChapter;
  };

  setScrollReferences = chapter => {
    chapter.scrollRef = React.createRef();
    if (chapter.chapters.length > 0) {
      chapter.chapters.forEach(child => {
        this.setScrollReferences(child);
      });
    }
  };

  setInternalId(chapter) {
    chapter.id = this.internalId;
    if (chapter.chapters.length > 0) {
      chapter.chapters.forEach(child => {
        this.internalId = this.internalId + 1;
        this.setInternalId(child);
      });
    }
  }

  setParentChapter(chapter, parent) {
    chapter.parent = parent;
    if (chapter.chapters.length > 0) {
      chapter.chapters.forEach(child => {
        this.setParentChapter(child, chapter);
      });
    }
  }
}
