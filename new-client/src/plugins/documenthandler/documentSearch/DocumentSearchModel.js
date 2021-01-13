import MatchSearch from "./MatchSearch";
import { v4 as uuidv4 } from "uuid";
import { getStringArray, splitAndTrimOnCommas } from "../utils/helpers";

export default class DocumentSearchModel {
  constructor(settings) {
    this.documentCollections = this.createDocumentCollectionsToSearch(
      settings.allDocuments
    );
  }

  createDocumentCollectionsToSearch = (allDocuments) => {
    return allDocuments.reduce((documentCollection, document) => {
      return [
        ...documentCollection,
        {
          documentFileName: document.documentFileName,
          documentTitle: document.documentTitle,
          features: this.getFeatures(document.chapters, document),
        },
      ];
    }, []);
  };

  getFeatures = (chapters, document) => {
    return chapters.reduce((features, chapter) => {
      if (chapter.chapters) {
        features = [
          ...features,
          ...this.getFeatures(chapter.chapters, document),
        ];
      }
      features = [
        ...features,
        this.createFeatureFromChapter(chapter, document),
      ];
      return features;
    }, []);
  };

  createFeatureFromChapter = (chapter, document) => {
    let searchValues = [];

    if (chapter.header) {
      searchValues.push(chapter.header);
    }
    if (chapter.keywords && chapter.keywords.length > 0) {
      searchValues = [...searchValues, ...chapter.keywords];
    }

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
      searchValues: searchValues,
      id: `${chapter.headerIdentifier}${Math.floor(Math.random() * 1000)}`,
      onClickName: "documentHandlerSearchResultClicked",
      properties: properties,
    };
  };

  implementSearchInterface = () => {
    return {
      getResults: this.getResults,
      getFunctionality: this.getFunctionality,
    };
  };

  // getFunctionality is called by searchComponent in core (Part of searchInterface)
  // The search-component demands this method, and if it is not present in the interface,
  // the plugin will not be used in the search-component at all.
  // The getFunctionality-method is supposed to return an object as follows:
  // return {
  //   name: "TOOL DISPLAY NAME",
  //   icon: TOOL ICON,
  //   type: "EXTERNAL_PLUGIN",
  //   searchFunctionalityClickName: "GLOBAL OBSERVER EVENT NAME",
  // };
  // If we want to make use of the plugin in the search-component regardless (without the functionality)
  // we can just let the method return null.
  getFunctionality = () => {
    return null;
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
      let possibleSearchCombinations = searchOptions.getPossibleCombinations
        ? this.getPossibleSearchCombinations(searchString, searchOptions)
        : [splitAndTrimOnCommas(searchString)];

      // The searchString will be encoded if the search has been initiated
      // by selecting an alternative in the autocomplete.
      possibleSearchCombinations = this.decodePotentialSpecialCharsFromFeatureProps(
        possibleSearchCombinations
      );

      resolve({
        featureCollections: this.getFeatureCollectionsForMatchingDocuments(
          possibleSearchCombinations
        ),
        errors: [],
      });
    });
  };

  decodePotentialSpecialCharsFromFeatureProps = (searchCombinations) => {
    return searchCombinations.map((combination) => {
      return combination.map((word) => {
        return decodeURIComponent(word);
      });
    });
  };

  getSearchFields = (matchedFeatures) => {
    return matchedFeatures.reduce((searchFields, feature) => {
      if (feature.matchedSearchValues.length > 0) {
        searchFields = [
          ...searchFields,
          ...this.getMockedSearchFieldForChapter(feature),
        ];
      }
      return searchFields;
    }, []);
  };

  getMatchedFeatures = (docFeatureCollection, possibleSearchCombinations) => {
    return docFeatureCollection.features.reduce((matchedFeatures, feature) => {
      feature.matchedSearchValues = this.getMatchedSearchValues(
        possibleSearchCombinations,
        feature.properties.documentTitle,
        feature.searchValues
      );

      return feature.matchedSearchValues.length > 0
        ? [...matchedFeatures, feature]
        : matchedFeatures;
    }, []);
  };

  createFeatureCollection = (
    matchedFeatures,
    searchFields,
    docFeatureCollection
  ) => {
    return {
      value: {
        status: "fulfilled",
        type: "FeatureCollection",
        crs: { type: null, properties: { name: null } },
        features: matchedFeatures,
        numberMatched: matchedFeatures.length,
        numberReturned: matchedFeatures.length,
        timeStamp: new Date().toISOString(),
        totalFeatures: matchedFeatures.length,
      },
      source: {
        id:
          docFeatureCollection.documentTitle ||
          docFeatureCollection.documentFileName,
        caption:
          docFeatureCollection.documentTitle ||
          docFeatureCollection.documentFileName,
        displayFields: ["header"],
        searchFields: [...searchFields],
      },
      origin: "DOCUMENT",
    };
  };

  getFeatureCollectionsForMatchingDocuments = (possibleSearchCombinations) => {
    return this.documentCollections.reduce(
      (featureCollections, documentCollection) => {
        const matchedFeatures = this.getMatchedFeatures(
          documentCollection,
          possibleSearchCombinations
        );
        const searchFields = this.getSearchFields(matchedFeatures);
        const featureCollection = this.createFeatureCollection(
          matchedFeatures,
          searchFields,
          documentCollection
        );

        return featureCollection
          ? [...featureCollections, featureCollection]
          : featureCollections;
      },
      []
    );
  };

  getPossibleSearchCombinations = (searchString) => {
    let possibleSearchCombinations = [[searchString]];
    let wordsInTextField = getStringArray(searchString);

    for (let i = 0; i < wordsInTextField.length; i++) {
      let combination = wordsInTextField.slice(wordsInTextField.length - i);
      let word = wordsInTextField
        .slice(0, wordsInTextField.length - i)
        .join()
        .replace(/,/g, " ");

      combination.unshift(word);
      possibleSearchCombinations.push(combination);
    }
    return possibleSearchCombinations;
  };

  getMockedSearchFieldForChapter = (feature) => {
    return feature.matchedSearchValues.reduce((searchFields, searchValue) => {
      const searchField = uuidv4();
      feature.properties[searchField] = searchValue;
      return [...searchFields, searchField];
    }, []);
  };

  documentTitleInSearchCombination = (searchCombination, documentTitle) => {
    return searchCombination.some((word) => {
      return documentTitle.toLowerCase().search(word.toLowerCase()) !== -1;
    });
  };

  getAllMatchedSearchValues = (word, searchValues) => {
    const allMatched = new Set();
    const matchedSearchValues = this.getMatched(word, searchValues);
    matchedSearchValues.forEach((matched) => {
      allMatched.add(matched);
    });
    return allMatched;
  };

  /**
   * TODO - Try to refactor, difficult though
   * If any (some-function) of the searchcombinations is hit, that is a match
   * a searchCombination can be a hit if the documentTitle is present in the combination, results in adding all as matched
   * a searchCombination can be hit if every combination has a searchhit
   */
  getMatchedSearchValues = (
    searchCombinations,
    documentTitle,
    searchValues
  ) => {
    let allMatched = new Set();
    let match = searchCombinations.some((searchCombination) => {
      if (
        documentTitle &&
        this.documentTitleInSearchCombination(searchCombination, documentTitle)
      ) {
        searchValues.forEach(allMatched.add, allMatched);
        return true;
      } else {
        return searchCombination.every((word) => {
          let matchedSet = this.getAllMatchedSearchValues(word, searchValues);
          allMatched = [...allMatched, ...matchedSet];
          return matchedSet.size > 0;
        });
      }
    });

    return match ? Array.from(allMatched) : [];
  };

  getMatched = (searchString, searchFields) => {
    return searchFields.reduce((matchedSearchFields, searchField) => {
      if (this.matchSearch.compare(searchString, searchField)) {
        return [...matchedSearchFields, searchField];
      }
      return matchedSearchFields;
    }, []);
  };
}
