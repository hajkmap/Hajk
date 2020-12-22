import React from "react";
import AcUnitIcon from "@material-ui/icons/AcUnit";
import MatchSearch from "./MatchSearch";
import { v4 as uuidv4 } from "uuid";

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
      searchFunctionalityClickName: "documenthandler-searchfunctionality-click",
    };
  };

  //Method called by searchComponent in core (Part of searchInterface)
  getResults = (searchString, searchOptions) => {
    this.matchSearch = new MatchSearch(searchOptions);
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

      resolve({
        featureCollections: this.getFeatureCollectionsForMatchingDocuments(
          possibleSearchCombinations
        ),
        errors: [],
      });
    });
  };

  createFeatureCollection = (document, matchedFeatures, searchFields) => {
    console.log(document, "document");
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
        id: `${document.documentFileName}`,
        caption: document.documentTitle,
        displayFields: ["header"],
        searchFields: [...searchFields],
      },
      origin: "DOCUMENT",
    };
  };

  getSearchFields = (chapters, matchedFeatures) => {
    return chapters.reduce((searchFields, chapter) => {
      if (this.hasSubChapters(chapter)) {
        return [
          ...searchFields,
          ...this.getSearchFields(chapter.chapters, matchedFeatures),
        ];
      }
      const matchedFeature = matchedFeatures.find((matchedFeature) => {
        return chapter.id === matchedFeature.internalChapterRef;
      });
      console.log(matchedFeature, "matchedFeature");
      if (chapter.matchedSearchValues.length > 0) {
        searchFields = [
          ...searchFields,
          this.getMockedSearchFieldForChapter(
            chapter,
            matchedFeature.properties
          ),
        ];
      }
      return searchFields;
    }, []);
  };

  getMatchedFeatures = (chapters, possibleSearchCombinations, document) => {
    return chapters.reduce((matchedFeatures, chapter) => {
      this.setmatchedSearchValuesOnChapter(chapter, possibleSearchCombinations);
      if (this.hasSubChapters(chapter)) {
        return [
          ...matchedFeatures,
          ...this.getMatchedFeatures(
            chapter.chapters,
            possibleSearchCombinations,
            document
          ),
        ];
      }

      if (chapter.matchedSearchValues.length > 0) {
        const matchedFeature = this.createFeatureFromChapter(chapter, document);
        return [...matchedFeatures, matchedFeature];
      }
      return matchedFeatures;
    }, []);
  };

  setSearchValues = (chapters) => {
    chapters.forEach((chapter) => {
      chapter.searchValues = [];
      if (chapter.chapters && chapter.chapters.length > 0) {
        this.setSearchValues(chapter.chapters);
      }
      if (chapter.header) {
        chapter.searchValues = [...chapter.searchValues, chapter.header];
      }
      if (chapter.keywords && chapter.keywords.length > 0) {
        chapter.searchValues = [...chapter.searchValues, chapter.keywords];
      }
    });
  };

  setSearchValuesForChapters = (chapters, title) => {
    chapters[0].searchValues = title; //Set title as a searchvalue for first chapter
    this.setSearchValues(chapters);
  };

  getFeatureCollectionsForMatchingDocuments = (possibleSearchCombinations) => {
    return this.allDocuments.reduce((featureCollections, document) => {
      this.setSearchValuesForChapters(document.chapters, document.title);
      const matchedFeatures = this.getMatchedFeatures(
        document.chapters,
        possibleSearchCombinations,
        document
      );
      const searchFields = this.getSearchFields(
        document.chapters,
        matchedFeatures
      );

      const featureCollection =
        matchedFeatures.length > 0
          ? this.createFeatureCollection(
              document,
              matchedFeatures,
              searchFields
            )
          : null;

      return featureCollection
        ? [...featureCollections, featureCollection]
        : featureCollections;
    }, []);
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

  getSearchValuesForChapter = (chapter) => {
    let searchValues = chapter.searchValues ? chapter.searchValues : [];
    if (chapter.header) {
      searchValues = [...searchValues, chapter.header];
    }
    if (chapter.keywords && chapter.keywords.length > 0) {
      searchValues = [...searchValues, chapter.keywords];
    }
    console.log(searchValues, "searchVBalues");
    return searchValues;
  };

  hasSubChapters = (chapter) => {
    return chapter.chapters && chapter.chapters.length > 0;
  };

  setmatchedSearchValuesOnChapter = (chapter, searchCombinations) => {
    if (this.hasSubChapters(chapter)) {
      chapter.chapters.forEach((subChapter) => {
        this.setmatchedSearchValuesOnChapter(subChapter, searchCombinations);
      });
    } else {
      chapter.matchedSearchValues = this.getMatchedSearchValues(
        searchCombinations,
        chapter.searchValues
      );
    }
  };

  getMockedSearchFieldForChapter = (chapter, properties) => {
    let searchFields = [];

    chapter.matchedSearchValues.forEach((searchValue, index) => {
      const searchField = uuidv4();
      if (!this.arrayContainsString(searchFields, searchField, true)) {
        searchFields.push(searchField);
      }
      if (
        this.arrayContainsString(chapter.matchedSearchValues, searchValue, true)
      ) {
        properties[searchField] = searchValue;
      } else {
        properties[searchField] = "";
      }
    });
    console.log(searchFields, "searchFields");
    return searchFields;
  };

  createFeatureFromChapter = (chapter, document) => {
    console.log(document, "document");
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
      id: `${chapter.headerIdentifier}${Math.floor(Math.random() * 1000)}`,
      onClickName: "documenthandler-searchresult-clicked",
      internalChapterRef: chapter.id,
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
  getMatchedSearchValues = (searchCombinations, searchValues) => {
    let allMatched = [];
    let match = searchCombinations.some((searchCombination) => {
      let everyResult = searchCombination.every((word) => {
        let matchedSearchValues = this.getMatchSearchValues(word, searchValues);
        allMatched = allMatched.concat(matchedSearchValues);
        return matchedSearchValues.length > 0;
      });

      return everyResult;
    });

    return match ? allMatched : [];
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
}
