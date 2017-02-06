function arraySort(options) {

    function getTitle(hit, property) {
      if (Array.isArray(property)) {
        return property.map(item => hit.getProperties()[item]).join(', ');
      } else {
        return hit.getProperties()[property] || property
      }
    }
    // Sortera på nummer i sträng.
    // Tex Storgatan 9 < Storgatan 10
    function num(str) {
      var re = /\d+/
      ,   n  = re.exec(str)
      ;
      return n !== null ? parseInt(n) : -1
    }
    // Sortera på sträng
    // Tex Storgatan < Störgatan
    function str(str) {
      var re = /^[a-zA-ZåäöÅÄÖ\-:_ ]+/
      ,   s  = re.exec(str)
      ;
      return s != null ? s[0] : -1;
    }
    // Sortera på siffra efter nummer, eller siffra efter kolon.
    // Tex Storgatan 3A < Storgatan 3B
    // Tex Almlunden 1:42 < Almlunden 1:43
    function strnum(str) {
      var re = /(\d+)(:)?([a-zA-ZåäöÅÄÖ])?(\d+)?/
      ,   s  = re.exec(str)
      ;
      var r = s === null ? -1 : s[2] ? parseInt(s[4]) : s[3];
      return r;
    }
    // Jämför två strängar.
    function comparer(a, b) {
      var a_s = str(getTitle(a, options.index)) // Strängjämförare.
      ,   b_s = str(getTitle(b, options.index)) // Strängutmanare.
      ,   a_n = NaN // Nummerjämförare.
      ,   b_n = NaN // Nummerutmanare.
      ,   ans = NaN // Suffixutmanare.
      ,   bns = NaN // Suffixjämförare.
      ;

      // Hela strängen är samma.
      if (getTitle(a, options.index) === getTitle(b, options.index)) return 0;
      if (a_s > b_s) return  1;
      if (a_s < b_s) return -1;
      // Strängdelen är samma, jämför nummer.
      a_n = num(getTitle(a, options.index));
      b_n = num(getTitle(b, options.index));

      if (a_n > b_n) return 1;
      if (a_n < b_n) return -1;
      // Strängdelen och textdelen är samma,
      // jämför suffix.
      ans = strnum(getTitle(a, options.index));
      bns = strnum(getTitle(b, options.index));

      if (ans > bns) return 1;
      if (ans < bns) return -1;
      // Övriga matchningar sorteras alfabetiskt.
      return getTitle(a, options.index) > getTitle(b, options.index) ? 1 : -1;
    }

    return options.array.sort(comparer);
}

module.exports = arraySort;
