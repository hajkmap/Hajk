export default class MatchSearch {
  constructor(percentageLimit, searchOptions) {
    this.percentageLimit = percentageLimit;
    this.searchOptions = searchOptions;
  }

  /**
   * Makes a deep compare of a search string and a keyword.
   * @param {string} searchString The search string.
   * @param {string} keyword The keyword.
   * @returns Returns an object of the compare results.
   *
   * @memberof MatchSearch
   */
  compare = (searchString, keyword) => {
    searchString = this.transformStringToLowercase(
      searchString,
      !this.searchOptions.matchCase
    );
    keyword = this.transformStringToLowercase(
      keyword,
      !this.searchOptions.matchCase
    );

    searchString = this.removeWildcardsFromSearchString(
      searchString,
      this.searchOptions.wildcardAtStart,
      this.searchOptions.wildcardAtEnd
    );

    keyword = this.shortenKeyword(
      searchString,
      keyword,
      this.searchOptions.wildcardAtStart,
      this.searchOptions.wildcardAtEnd
    );

    const percentageMatch = this.percentageMatchLowerCase(
      searchString,
      keyword
    );
    const match = this.calculateIfMatched(
      searchString,
      keyword,
      percentageMatch,
      this.searchOptions.wildcardAtStart,
      this.searchOptions.wildcardAtEnd
    );
    return {
      searchResults: {
        match: match,
        details: {
          percentageLimit: this.percentageLimit,
          percentageMatch: percentageMatch,
          matchCase: this.searchOptions.matchCase,
          wildcardAtStart: this.searchOptions.wildcardAtStart,
          wildcardAtEnd: this.searchOptions.wildcardAtEnd,
        },
      },
    };
  };

  /**
   * Transforms a string to lower case if given argument tells it to do so.
   * @param {string} string The string that might be transformed to lowercase.
   * @param {bool} transformToLowerCase Specifies if the string should be transformed to lowercase.
   *
   * @memberof MatchSearch
   */
  transformStringToLowercase = (string, transformToLowerCase) => {
    if (transformToLowerCase) return string.toLowerCase();
    return string;
  };

  /**
   * Removes the star (*) character from the search string, we don't need it in document search.
   * @param {string} searchString The search string.
   * @param {bool} wildcardAtStart A wildcard, i.e. a star (*), is in the first position.
   * @param {bool} wildcardAtEnd A wildcard, i.e. a star (*), is in the last position.
   *
   * @memberof MatchSearch
   */
  removeWildcardsFromSearchString = (
    searchString,
    wildcardAtStart,
    wildcardAtEnd
  ) => {
    if (wildcardAtStart)
      searchString = searchString.substring(1, searchString.length);

    if (wildcardAtEnd)
      searchString = searchString.substring(0, searchString.length - 1);

    return searchString;
  };

  /**
   * Shortens the keyword to that it matches the length of the search string.
   * @param {string} searchString The search string.
   * @param {string} keyword The keyword.
   * @param {bool} wildcardAtStart Specifies if the wildcard should be at the start of the search string.
   * @param {bool} wildcardAtEnd Specifies if the wildcard should be at the end of the search string.
   */
  shortenKeyword = (searchString, keyword, wildcardAtStart, wildcardAtEnd) => {
    if (wildcardAtEnd)
      keyword = this.#shortenKeywordFromStart(searchString, keyword);

    if (wildcardAtStart)
      keyword = this.#shortenKeywordFromEnd(searchString, keyword);

    return keyword;
  };

  /**
   * Shortens the keyword byt cutting of characters from the start, to match the length of the search string.
   * @param {string} searchString The search string.
   * @param {string} keyword The keyword.
   */
  #shortenKeywordFromStart = (searchString, keyword) => {
    const cutPosition = 0;
    return this.#shortenKeywordCut(searchString, keyword, cutPosition);
  };

  /**
   * Shortens the keyword byt cutting of characters from the end, to match the length of the search string.
   * @param {string} searchString The search string.
   * @param {string} keyword The keyword.
   */
  #shortenKeywordFromEnd = (searchString, keyword) => {
    const cutPosition = keyword.length - searchString.length;
    return this.#shortenKeywordCut(searchString, keyword, cutPosition);
  };

  /**
   * Cuts the keyword at a position to match the length of the search string.
   * @param {string} searchString The search string.
   * @param {string} keyword The keyword.
   * @param {int} cutPosition The position of the cut.
   */
  #shortenKeywordCut = (searchString, keyword, cutPosition) => {
    if (keyword.length > searchString.length)
      keyword = keyword.substr(cutPosition, searchString.length);
    return keyword;
  };

  /**
   * Compares the individual characters the search string and the keyword for a percentage match.
   * @param {string} searchString The search string.
   * @param {string} keyword The keyword.
   */
  percentageMatchLowerCase = (searchString, keyword) => {
    let matches = 0;
    for (let iSS = 0; iSS < searchString.length; iSS++) {
      let firstTimeInKeywordLoop = true;
      let up = true;
      let add = 0;

      for (let iK = 0; iK < keyword.length; iK++) {
        let index = iSS;

        if (!firstTimeInKeywordLoop && up) add++;
        if (!firstTimeInKeywordLoop && up) index += add;
        if (!firstTimeInKeywordLoop && !up && index - add >= 0) index -= add;
        if (!firstTimeInKeywordLoop && !up && index - add < 0) index += add;
        firstTimeInKeywordLoop = false;

        if (index >= keyword.length) break;

        if (this.letterMatch(keyword[index], searchString[iSS])) {
          const divider = add + 1;
          matches += 1 / divider;
          break;
        }
      }
    }

    if (matches === 0) return 0.0;
    return matches / searchString.length;
  };

  /**
   * Help method that compares individual letters.
   * @param {character} keywordLetter A letter from the keyword.
   * @param {character} searchStringLetter A letter from the search string.
   */
  letterMatch = (keywordLetter, searchStringLetter) => {
    return keywordLetter === searchStringLetter;
  };

  /**
   * Calculates if there is a match or not.
   * @param {string} searchString The search string.
   * @param {string} keyword The keyword.
   * @param {double} percentageMatch The similarity percentage of the match.
   * @param {bool} wildcardAtStart States if there is a wildcard at the start.
   * @param {bool} wildcardAtEnd States if there is a wildcard at the end.
   */
  calculateIfMatched = (
    searchString,
    keyword,
    percentageMatch,
    wildcardAtStart,
    wildcardAtEnd
  ) => {
    if (
      !this.#matchNoWildcards(
        searchString,
        keyword,
        wildcardAtStart,
        wildcardAtEnd
      )
    )
      return false;

    if (!this.#matchPercentage(percentageMatch)) return false;

    return true;
  };

  /**
   * Checks if there are no wildcards and that the search string and the keywords match exactly in length.
   * @param {string} searchString The search string
   * @param {string} keyword The keyword.
   * @param {bool} wildcardAtStart States if there is a wildcard at the start.
   * @param {bool} wildcardAtEnd States if there is a wildcard at the end.
   */
  #matchNoWildcards = (
    searchString,
    keyword,
    wildcardAtStart,
    wildcardAtEnd
  ) => {
    if (
      !wildcardAtStart &&
      !wildcardAtEnd &&
      searchString.length !== keyword.length
    )
      return false;

    return true;
  };

  /**
   * Checks if the similarity in percentage is enough.
   * @param {double} percentageMatch The similarity percentage of the match.
   */
  #matchPercentage = (percentageMatch) => {
    if (percentageMatch < this.percentageLimit) return false;

    return true;
  };
}
