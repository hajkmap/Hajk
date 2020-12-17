import React from "react";
import AcUnitIcon from "@material-ui/icons/AcUnit";
import MatchSearch from "./MatchSearch";

export default class DocumentSearchModel {
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

  //Method called by searchComponent in core (Part of searchInterface)
  getFunctionality = () => {
    return {
      name: "Dokumentverktyg",
      icon: <AcUnitIcon />,
      type: "EXTERNAL_PLUGIN",
      searchFunctionalityClickName:
        "search.documentHandlerSearchFunctionalityClick",
    };
  };

  //Method called by searchComponent in core (Part of searchInterface)
  getResults = (searchString, searchOptions) => {
    this.matchSearch = new MatchSearch(1.0, searchOptions);
    return this.getDocumentHandlerResults(searchString, searchOptions);
  };

  getDocumentHandlerResults = (searchString, searchOptions) => {
    return new Promise((resolve, reject) => {
      if (searchString === "") {
        resolve({ featureCollections: [], errors: [] });
      }

      let possibleSearchCombinations = this.getPossibleSearchCombinations(
        searchOptions,
        searchString
      );

      let featureCollections = this.getFeatureCollectionsForMatchingDocuments(
        possibleSearchCombinations
      );

      resolve({ featureCollections: featureCollections, errors: [] });
    });
  };

  createFeatureCollection = (document, matchedFeatures, searchFields) => {
    return {
      value: {
        status: "fulfilled",
        type: "FeatureCollection",
        crs: { type: null, properties: { name: null } },
        features: matchedFeatures,
        numberMatched: matchedFeatures.length,
        numberReturned: matchedFeatures.length,
        timeStamp: null,
        totalFeatures: matchedFeatures.length,
      },
      source: {
        id: `${document.documentTitle}`,
        caption: document.documentTitle,
        displayFields: ["header"],
        searchFields: [...searchFields],
      },
      origin: "DOCUMENT",
    };
  };

  createFeatureCollectionForDocument = (document) => {
    let matchedFeatures = [];
    let documentSearchFields = [];

    const recursivelyCreateFeaturesFromChapters = (chapters) => {
      for (var i = 0; i < chapters.length; i++) {
        if (this.hasSubChapters(chapters[i])) {
          recursivelyCreateFeaturesFromChapters(chapters[i].chapters);
        }
        if (chapters[i].matchedSearchValues.length > 0) {
          let matchedFeature = this.createFeatureFromChapter(
            chapters[i],
            document
          );

          let chapterSearchFields = this.getMockedSearchFieldForChapter(
            chapters[i],
            matchedFeature.properties
          );

          documentSearchFields = [documentSearchFields, ...chapterSearchFields];

          matchedFeatures.push(matchedFeature);
        }
      }
    };

    recursivelyCreateFeaturesFromChapters(document.chapters);

    if (matchedFeatures.length > 0) {
      return this.createFeatureCollection(
        document,
        matchedFeatures,
        documentSearchFields
      );
    }
    return null;
  };

  getFeatureCollectionsForMatchingDocuments = (possibleSearchCombinations) => {
    let featureCollections = [];
    this.allDocuments.forEach((document) => {
      document.chapters.forEach((chapter) => {
        this.setmatchedSearchValuesOnChapter(
          document,
          chapter,
          possibleSearchCombinations
        );
      });

      let featureCollection = this.createFeatureCollectionForDocument(
        document,
        possibleSearchCombinations
      );

      if (featureCollection) {
        featureCollections.push(featureCollection);
      }
    });
    return featureCollections;
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

  setSearchValuesForChapter = (chapter) => {
    chapter.searchValues = [];
    if (chapter.keywords) {
      chapter.searchValues = chapter.searchValues.concat(chapter.keywords);
    }
    chapter.searchValues.push(chapter.header);
  };

  hasSubChapters = (chapter) => {
    return chapter.chapters && chapter.chapters.length > 0;
  };

  setmatchedSearchValuesOnChapter = (document, chapter, searchCombinations) => {
    if (this.hasSubChapters(chapter)) {
      chapter.chapters.forEach((subChapter) => {
        this.setmatchedSearchValuesOnChapter(
          document,
          subChapter,
          searchCombinations
        );
      });
    }
    this.setmatchedSearchValues(chapter, searchCombinations);
  };

  getMockedSearchFieldForChapter = (chapter, properties) => {
    let searchFields = [];
    chapter.matchedSearchValues.forEach((searchValue, index) => {
      if (
        !this.arrayContainsString(searchFields, `searchField${index}`, true)
      ) {
        searchFields.push(`searchField${index}`);
      }
      if (
        this.arrayContainsString(chapter.matchedSearchValues, searchValue, true)
      ) {
        properties[`searchField${index}`] = searchValue;
      } else {
        properties[`searchField${index}`] = "";
      }
    });
    return searchFields;
  };

  createFeatureFromChapter = (chapter, document) => {
    let properties = {
      header: chapter.header,
      geoids: chapter.geoids,
      headerIdentifier: chapter.headerIdentifier,
      documentTitle: document.documentTitle,
      documentFileName: document.documentFileName,
    };

    return {
      type: "Feature",
      geometry: null,
      id: `${chapter.documentTitle}${Math.floor(Math.random() * 1000)}`,
      onClickName: "documentHandlerSearchResultClicked",
      properties: properties,
    };
  };

  /**
   * Sets matchedsearchvalues for each chapter
   * If any (some-function) of the searchcombinations is hit, that is a match
   * For a searchCombination to be a match must every (every-function) searchword in that combination
   * find a match
   * @param {chapter} chapter chapter.
   * @param {array} searchCombinations array with arrays containing searchwords.
   * @return Returns true if a match is found.
   *
   */
  setmatchedSearchValues = (chapter, searchCombinations) => {
    this.setSearchValuesForChapter(chapter);
    let allMatched = [];
    let match = searchCombinations.some((searchCombination) => {
      let everyResult = searchCombination.every((word) => {
        let matchedSearchValues = this.getMatchSearchValues(
          word,
          chapter.searchValues
        );
        allMatched = allMatched.concat(matchedSearchValues);

        return matchedSearchValues.length > 0;
      });

      return everyResult;
    });

    if (match) {
      chapter.matchedSearchValues = allMatched;
    } else {
      chapter.matchedSearchValues = [];
    }
  };

  getPossibleSearchCombinations = (searchOptions, searchString) => {
    let possibleSearchCombinations = [];
    possibleSearchCombinations.push(this.splitAndTrimOnCommas(searchString));
    // possibleSearchCombinations = this.addPotentialWildCards(
    //   possibleSearchCombinations,
    //   searchOptions
    // );
    return possibleSearchCombinations;
  };

  setMatchInformationForDocument = (document, possibleSearchCombinations) => {
    document.chapters.forEach((chapter) => {
      possibleSearchCombinations.forEach((searchCombination) => {
        this.setMatchedSearchValuesOnChapter(
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
  getMatchSearchValues = (searchString, searchFields) => {
    let matchedSearchValues = [];
    searchFields.forEach((searchField) => {
      let compareResults = this.matchSearch.compare(searchString, searchField);

      if (
        compareResults.searchResults.match &&
        !this.arrayContainsString(matchedSearchValues, searchField, true)
      ) {
        matchedSearchValues.push(searchField);
      }
    });

    return matchedSearchValues;
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
