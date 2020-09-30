import React from "react";
import AcUnitIcon from "@material-ui/icons/AcUnit";
import MatchSearch from "./MatchSearch";

/**
 * @summary  DocumentHandler model that doesn't do much.
 * @description This model exposes only one method, getMap(),
 * so it does not do anything crucial. But you can see it
 * as an example of how a plugin can be separated in different
 * components.
 *
 * @class DocumentHandlerModel
 */

export default class DocumentHandlerModel {
  internalId = 0;

  constructor(settings) {
    this.settings = settings;
    this.allDocuments = settings.allDocuments;
  }

  implementSearchInterface = () => {
    return {
      getResults: this.getResults,
      getFunctionality: this.getFunctionality,
    };
  };

  getFunctionality = () => {
    return {
      name: "Dokumentverktyg",
      icon: <AcUnitIcon />,
      type: "EXTERNAL_PLUGIN",
      searchFunctionalityClickName: "documenthandler-searchfunctionality-click",
    };
  };

  createFeatureCollection = (document) => {
    return {
      value: {
        status: "fulfilled",
        type: "FeatureCollection",
        crs: { type: null, properties: { name: null } },
        features: this._matchedChapters,
        numberMatched: this._matchedChapters.length,
        numberReturned: this._matchedChapters.length,
        timeStamp: null,
        totalFeatures: this._matchedChapters.length,
      },
      source: {
        id: `${document.documentTitle}`,
        caption: document.documentTitle,
        displayFields: ["header"],
        searchFields: [...this.keywords],
      },
      origin: "DOCUMENT",
    };
  };

  getResults = (searchString, searchOptions) => {
    this.keywords = [];
    let featureCollections = [];
    this.allDocuments.forEach((document) => {
      this._matchedChapters = [];
      this.lookup(document, searchString, searchOptions);
      if (this._matchedChapters.length > 0) {
        featureCollections.push(this.createFeatureCollection(document));
      }
    });

    return new Promise((resolve, reject) => {
      resolve({ featureCollections: featureCollections, errors: [] });
    });
  };

  splitAndTrimOnCommas = (searchString) => {
    return searchString.split(",").map((string) => {
      return string.trim();
    });
  };

  getStringArray = (searchString) => {
    let tempStringArray = this.splitAndTrimOnCommas(searchString);
    return tempStringArray.join(" ").split(" ");
  };

  getPossibleSearchCombinations = (searchString, searchOptions) => {
    let possibleSearchCombinations = [];
    let wordsInTextField = this.getStringArray(searchString);

    for (let i = 0; i < wordsInTextField.length; i++) {
      let combination = wordsInTextField.slice(wordsInTextField.length - i);
      combination.unshift(
        wordsInTextField
          .slice(0, wordsInTextField.length - i)
          .join()
          .replace(/,/g, " ")
      );
      possibleSearchCombinations.push(combination);
    }
    return this.addPotentialWildCards(
      possibleSearchCombinations,
      searchOptions
    );
  };

  addPotentialWildCards = (possibleSearchCombinations, searchOptions) => {
    return possibleSearchCombinations.map((wordArray) => {
      return wordArray.map((word) => {
        word = searchOptions.wildcardAtStart ? `*${word}` : word;
        word = searchOptions.wildcardAtEnd ? `${word}*` : word;
        return word;
      });
    });
  };

  addHeaderToKeywords = (chapter) => {
    if (chapter.keywords) {
      chapter.keywords.push(chapter.header);
    } else {
      chapter.keywords = [chapter.header];
    }
    return chapter;
  };

  getChaptersMatchingSearchCombination = (
    document,
    chapter,
    searchCombination
  ) => {
    if (chapter.chapters && chapter.chapters.length > 0) {
      chapter.chapters.forEach((subChapter) => {
        this.getChaptersMatchingSearchCombination(
          document,
          subChapter,
          searchCombination
        );
      });
    }
    chapter = this.addHeaderToKeywords(chapter);

    let matchedKeywords = this.chapterMatchSearchInput(
      chapter,
      searchCombination
    );

    if (matchedKeywords.length > 0) {
      this._matchedChapters.push(
        this.createFeatureFromChapter(document, chapter, matchedKeywords)
      );
    }
  };

  createFeatureFromChapter = (document, chapter, matchedKeywords) => {
    let properties = {
      header: chapter.header,
      geoids: chapter.geoids,
      headerIdentifier: chapter.headerIdentifier,
      documentTitle: document.documentTitle,
      documentFileName: document.documentFileName,
    };

    matchedKeywords.map((keyword, index) => {
      if (!this.arrayContainsString(this.keywords, `keyword${index}`, true)) {
        this.keywords.push(`keyword${index}`);
      }
      if (this.arrayContainsString(matchedKeywords, keyword, true)) {
        return (properties[`keyword${index}`] = keyword);
      } else {
        return (properties[`keyword${index}`] = "");
      }
    });

    return {
      type: "Feature",
      geometry: null,
      id: `${document.documentTitle}${Math.floor(Math.random() * 1000)}`,
      onClickName: "documenthandler-searchresult-clicked",
      properties: properties,
    };
  };

  chapterMatchSearchInput = (chapter, searchCombination) => {
    let matchedKeywords = [];
    let match = searchCombination.every((word) => {
      matchedKeywords = matchedKeywords.concat(
        this.searchStringMatchKeywords(word, chapter.keywords)
      );
      return matchedKeywords.length > 0;
    });

    if (match) {
      return matchedKeywords;
    } else {
      return [];
    }
  };

  lookup = (document, searchString, searchOptions) => {
    let possibleSearchCombinations = [];

    if (searchString !== "") {
      possibleSearchCombinations.push(this.splitAndTrimOnCommas(searchString));
      possibleSearchCombinations = this.addPotentialWildCards(
        possibleSearchCombinations,
        searchOptions
      );
    }

    document.chapters.forEach((chapter) => {
      possibleSearchCombinations.map((searchCombination) => {
        return this.getChaptersMatchingSearchCombination(
          document,
          chapter,
          searchCombination
        );
      });
    });
  };

  arrayContainsString(array, string, ignoreCase) {
    return array.some((word) => {
      if (ignoreCase) {
        return word.toLowerCase() === string.toLowerCase();
      } else {
        return word === string;
      }
    });
  }

  /**
   * Perform a search match between the search string and all keywords.
   * @param {string} searchString The search string.
   * @param {array} keywords The chapter's keywords.
   * @return Returns true if a match is found.
   *
   */
  searchStringMatchKeywords = (searchString, keywords) => {
    let matchSearch = new MatchSearch(0.8);
    let matchedKeywords = [];
    keywords.forEach((keyword) => {
      let compareResults = matchSearch.compare(searchString, keyword);
      if (
        compareResults.searchResults.match &&
        !this.arrayContainsString(matchedKeywords, keyword, true)
      ) {
        matchedKeywords.push(keyword);
      }
    });

    return matchedKeywords;
  };

  getDocumentsFromMenus(menu) {
    return menu.filter((menuItem) => {
      return menuItem.document || menuItem.menu.length > 0;
    });
  }

  getFlattenedMenu(menu) {
    let flattenedMenu = [];
    menu.forEach((menuItem) => {
      if (menuItem.menu.length > 0) {
        flattenedMenu = flattenedMenu.concat(
          this.getFlattenedMenu(menuItem.menu)
        );
      } else {
        flattenedMenu.push(menuItem);
      }
    });
    return flattenedMenu;
  }

  getAllDocumentsContainedInMenu() {
    return new Promise((resolve, reject) => {
      if (this.allDocuments.length > 0) {
        resolve(this.allDocuments);
      }
      Promise.all(
        this.getFlattenedMenu(
          this.getDocumentsFromMenus(this.settings.menu)
        ).map((menuItem) => {
          return this.fetchJsonDocument(menuItem.document).then((doc) => {
            doc.documentColor = menuItem.color;
            doc.documentFileName = menuItem.document;
            doc.documentTitle = menuItem.title;
            return doc;
          });
        })
      )
        .then((documents) => {
          resolve(documents);
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}
