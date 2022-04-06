import MatchSearch from "./MatchSearch";
import { v4 as uuidv4 } from "uuid";
import { splitAndTrimOnCommas } from "../utils/helpers";
import { decodeCommas } from "../../../utils/StringCommaCoder";

export default class DocumentSearchModel {
  constructor(settings) {
    this.globalSearchModel = settings.globalSearchModel;
    this.documentCollections = this.createDocumentCollectionsToSearch(
      settings.allDocuments
    );
    this.localObserver = settings.localObserver;
    this.app = settings.app;
    this.bindListenForSearchResultClick();
  }

  bindListenForSearchResultClick = () => {
    // The event published from the search component will be prepended
    // with "search.featureClicked", therefore we have to subscribe
    // to search.featureClicked.onClickName to catch the event.
    this.app.globalObserver.subscribe(
      "search.featureClicked.documentHandlerSearchResultClicked",
      (searchResultClick) => {
        this.localObserver.publish("document-link-clicked", {
          documentName: searchResultClick.properties.documentFileName,
          headerIdentifier: searchResultClick.properties.headerIdentifier,
        });
      }
    );
  };

  createDocumentCollectionsToSearch = (allDocuments) => {
    return allDocuments.reduce((documentCollection, document) => {
      return [
        ...documentCollection,
        {
          documentFileName: document.documentFileName,
          documentTitle: document.documentTitle,
          features: [
            ...this.getFeatures(document.chapters, document),
            this.getSpecialTitleFeature(
              document
            ) /*We need to add a special feature that is not working the same way 
            when autocomplete is initiated and when a search is initiated.*/,
          ],
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

  /*We add a special feature to with only document.title as searchfield.
  this feature is used when user is getting an autocomplete. 
  See method handleSpecialCaseWithTitleHit for more information.
  */

  getSpecialTitleFeature = (document) => {
    let properties = {
      header: document.documentTitle,
      geoids: [],
      headerIdentifier: document.documentTitle,
      documentTitle: document.documentTitle,
      documentFileName: document.documentFileName,
    };

    const id = `${document.documentTitle}${Math.floor(Math.random() * 1000)}`;

    return {
      type: "Feature",
      isTitleFeature: true,
      geometry: null,
      searchValues: [document.title],
      id: id,
      onClickName: "documentHandlerSearchResultClicked",
      properties: properties,
      get: (p) => properties[p],
      getGeometry: () => null,
      getId: () => id,
    };
  };

  createFeatureFromChapter = (chapter, document) => {
    let searchValues = [];

    if (chapter.header) {
      searchValues.push(chapter.header);
    }
    if (chapter.keywords && chapter.keywords.length > 0) {
      searchValues = [...searchValues, ...chapter.keywords];
    }

    const properties = {
      header: chapter.header,
      geoids: chapter.geoids,
      headerIdentifier: chapter.headerIdentifier,
      documentTitle: document.documentTitle,
      documentFileName: document.documentFileName,
    };

    const id = `${chapter.headerIdentifier}${Math.floor(Math.random() * 1000)}`;

    return {
      type: "Feature",
      geometry: null,
      isTitleFeature: false,
      searchValues: searchValues,
      id: id,
      onClickName: "documentHandlerSearchResultClicked",
      properties: properties,
      get: (p) => properties[p],
      getGeometry: () => null,
      getId: () => id,
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
    this.searchOptions = searchOptions;
    return this.getDocumentHandlerResults(searchString);
  };

  getDocumentHandlerResults = (searchString) => {
    return new Promise((resolve, reject) => {
      if (searchString === "") {
        resolve({ featureCollections: [], errors: [] });
      }
      let possibleSearchCombinations = this.searchOptions
        .getPossibleCombinations
        ? this.globalSearchModel.getPossibleSearchCombinations(searchString)
        : [splitAndTrimOnCommas(searchString)];

      // The searchString will be encoded if the search has been initiated
      // by selecting an alternative in the autocomplete.
      possibleSearchCombinations =
        this.decodePotentialSpecialCharsFromFeatureProps(
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
        return decodeCommas(word);
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

  /*When a search is initiated for autocomplete we search for the title of the document
  only in the special features created in getSpecialTitleFeature. When the user then
  clicks this feature in the searchresultlist, we add the documenttitle as a searchfield
  for all chapters/features in that document because we want to show the user all
  the chapters in that document*/

  getMatchedFeatures = (docFeatureCollection, possibleSearchCombinations) => {
    const { initiator } = this.searchOptions;
    return docFeatureCollection.features.reduce((matchedFeatures, feature) => {
      if (initiator === "search") {
        if (feature.isTitleFeature) {
          //If feature is a special titleFeature and we are making a search, it is not supposed to be in the resultlist
          return matchedFeatures;
        }
        feature.searchValues.push(docFeatureCollection.documentTitle);
      }

      if (initiator === "autocomplete" && !feature.isTitleFeature) {
        feature.searchValues = feature.searchValues.filter((searchValue) => {
          return searchValue !== docFeatureCollection.documentTitle;
        });
      }

      feature.matchedSearchValues = this.getMatchedSearchValues(
        possibleSearchCombinations,
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

  getMockedSearchFieldForChapter = (feature) => {
    return feature.matchedSearchValues.reduce((searchFields, searchValue) => {
      const searchField = uuidv4();
      feature.properties[searchField] = searchValue;
      return [...searchFields, searchField];
    }, []);
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
  getMatchedSearchValues = (searchCombinations, searchValues) => {
    let allMatched = new Set();
    let match = searchCombinations.some((searchCombination) => {
      return searchCombination.every((word) => {
        let matchedSet = this.getAllMatchedSearchValues(word, searchValues);
        allMatched = new Set([...allMatched, ...matchedSet]);
        return matchedSet.size > 0;
      });
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
