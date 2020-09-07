export default class DocumentSearch {
  constructor(allDocuments) {
    this.allDocuments = allDocuments;
    this.chaptersMatchSearch = [];
  }

  /**
   * Performs a search in all documents.
   * @param {string} searchString The search string.
   * @param {object} searchOptions The search options.
   *
   * @memberof DocumentSearch
   */
  getResults = (searchString, searchOptions) => {
    this.chaptersMatchSearch = [];
    this.allDocuments.forEach((document) => {
      document.chapters.forEach((chapter) => {
        this.keywordsMatchSearchString(
          document.documentTitle,
          chapter,
          searchString
        );
      });
    });
    const featureCollection = {
      status: "fulfilled",
      value: {
        type: "FeatureCollection",
        onClickName: "",
        crs: { type: null, properties: { name: null } },
        features: this.chaptersMatchSearch,
        numberMatched: this.chaptersMatchSearch.length,
        numberReturned: this.chaptersMatchSearch.length,
        timeStamp: null,
        totalFeatures: this.chaptersMatchSearch.length,
      },
      sources: this.getMatchDocumentsFromSearch(),
      source: {
        id: "999",
        caption: "Documenthandler",
        displayFields: ["header"],
      },
      origin: "DOCUMENT",
    };

    return new Promise((resolve, reject) => {
      resolve({ featureCollections: [featureCollection], errors: [] });
    });
  };

  /**
   * Checks if the any keywords will match the search string.
   * @param {object} chapter The chapter to be examined.
   * @param {string} searchString The search string.
   * @return {object} The chapters that match the search string.
   *
   * @memberof DocumentSearch
   */
  keywordsMatchSearchString = (documentTitle, chapter, searchString) => {
    if (
      chapter.hasOwnProperty("keywords") &&
      this.searchStringMatchKeywords(searchString, chapter.keywords)
    )
      this.chaptersMatchSearch.push({
        type: "Feature",
        geometry: null,
        properties: {
          documentTitle: documentTitle,
          header: chapter.header,
          headerIdentifier: chapter.headerIdentifier,
        },
      });

    if (chapter.hasOwnProperty("chapters"))
      chapter.chapters.forEach((subChapter) => {
        this.keywordsMatchSearchString(documentTitle, subChapter, searchString);
      });
  };

  /**
   * Perform a search match between the search string and all keywords.
   * @param {string} searchString The search string.
   * @param {array} keywords The chapter's keywords.
   * @return Returns true if a match is found.
   *
   * @memberof DocumentSearch
   */
  searchStringMatchKeywords = (searchString, keywords) => {
    let match = false;
    keywords.forEach((keyword) => {
      if (keyword.toLowerCase() === searchString.toLowerCase()) match = true;
    });
    return match;
  };

  /**
   * Gets all documents that are affected by the search match.
   * @return {array} Returns an array with all documents affected by the search match.
   */
  getMatchDocumentsFromSearch = () => {
    let uniqueDocumentNames = [];
    this.chaptersMatchSearch.forEach((match) => {
      const documentTitle = match.properties.documentTitle;
      if (!uniqueDocumentNames.includes(documentTitle))
        uniqueDocumentNames.push(documentTitle);
    });

    return uniqueDocumentNames;
  };
}
