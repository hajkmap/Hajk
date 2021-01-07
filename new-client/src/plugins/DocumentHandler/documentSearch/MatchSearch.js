export default class MatchSearch {
  constructor(searchOptions) {
    this.searchOptions = searchOptions;
  }

  getMatchRegexp = (searchString) => {
    const { wildcardAtEnd, wildcardAtStart, matchCase } = this.searchOptions;

    let regexpOptions = matchCase ? "g" : "gi";
    if (wildcardAtStart && !wildcardAtEnd) {
      return new RegExp(`.*${searchString}$`, regexpOptions);
    }

    if (!wildcardAtStart && wildcardAtEnd) {
      return new RegExp(`^${searchString}.*`, regexpOptions);
    }

    if (wildcardAtStart && wildcardAtEnd) {
      return new RegExp(`${searchString}`, regexpOptions);
    }
    return new RegExp(`^${searchString}$`, regexpOptions);
  };

  escapeSpecialChars = (string) => {
    return string.replace(/([.*+?^=!:${}()|[\]/\\])/g, "\\$1");
  };

  /**
   * Compare searchString agains keyword to se if it matches
   * @param {string} searchString The search string.
   * @param {string} keyword The keyword.
   * @returns Returns an object of the compare results.
   *
   * @memberof MatchSearch
   */
  compare = (searchString, searchword) => {
    const toSearchIn = this.escapeSpecialChars(searchString);
    const match = this.getMatchRegexp(toSearchIn).test(searchword);

    return {
      searchResults: {
        match: match,
      },
    };
  };
}
