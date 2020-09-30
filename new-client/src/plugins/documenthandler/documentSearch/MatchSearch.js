export default class MatchSearch {
  constructor(percentageLimit) {
    this.percentageLimit = percentageLimit;
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
    const exactMatchLowerCase = this.exactMatchLowerCase(searchString, keyword);
    const lengthMatchLowerCase = this.lengthMatchLowerCase(
      searchString,
      keyword
    );
    const percentageMatchLowerCase = this.percentageMatchLowerCase(
      searchString,
      keyword
    );
    const match =
      exactMatchLowerCase ||
      lengthMatchLowerCase ||
      percentageMatchLowerCase >= this.percentageLimit;
    return {
      searchResults: {
        match: match,
        details: {
          exactMatchLowerCase: exactMatchLowerCase,
          lengthMatchLowerCase: lengthMatchLowerCase,
          percentageMatchLowerCase: percentageMatchLowerCase,
        },
      },
    };
  };

  /**
   * Performs an exact match independent of upper- or lower cases.
   * @param {string} searchString The search string.
   * @param {string} keyword The keyword.
   * @returns Returns true of a match is found.
   */
  exactMatchLowerCase = (searchString, keyword) => {
    return keyword.toLowerCase() === searchString.toLowerCase();
  };

  /**
   * Performs an exact match, using only the length of the search string, independent of upper- or lower cases.
   * @param {string} searchString The search string.
   * @param {string} keyword The keyword.
   * @returns Returns true of a match is found.
   */
  lengthMatchLowerCase = (searchString, keyword) => {
    keyword = this.shortenKeyword(searchString, keyword);
    return this.exactMatchLowerCase(searchString, keyword);
  };

  /**
   * Help method that shortens the keyword to the same length of the search string if possible.
   * @param {string} searchString The search string.
   * @param {string} keyword The keyword.
   * @returns A keyword that matches the length of the search string or is shorter.
   */
  shortenKeyword = (searchString, keyword) => {
    if (keyword.length > searchString.length)
      keyword = keyword.substr(0, searchString.length);
    return keyword;
  };

  /**
   * Compares the individual characters the search string and the keyword for a percentage match.
   * @param {string} searchString The search string.
   * @param {string} keyword The keyword.
   */
  percentageMatchLowerCase = (searchString, keyword) => {
    // keyword = this.shortenKeyword(searchString, keyword);
    // let matches = 0;
    // for (var i = 0; i < keyword.length; i++)
    //   if (this.letterMatch(keyword[i], searchString[i])) matches++;

    // if (matches === 0) return 0.0;
    // return keyword.length / matches;

    let matches = 0;
    for (let iSS = 0; iSS < searchString.length; iSS++) {
      let first = true;
      let up = true;
      let add = 0;

      for (let iK = 0; iK < keyword.length; iK++) {
        let index = iSS;

        if (!first && up) add++;
        if (!first && up) index += add;
        if (!first && !up && index - add >= 0) index -= add;
        if (!first && !up && index - add < 0) index += add;
        first = false;

        if (index >= keyword.length) break;

        if (this.letterMatch(keyword[index], searchString[iSS])) {
          const divider = add + 1;
          matches += 1 / (divider * divider);
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
    return keywordLetter.toLowerCase() === searchStringLetter.toLowerCase();
  };
}
