class CookieLevel {
  static Required = new CookieLevel(1);
  static Functional = new CookieLevel(2);
  static ThirdPart = new CookieLevel(4);

  constructor(name) {
    this.name = name;
  }

  toInt(cookieLevel) {
    switch (cookieLevel) {
      case CookieLevel.Required:
        return 1;
      case CookieLevel.Functional:
        return 2;
      case CookieLevel.ThirdPart:
        return 4;
      default:
        return 0;
    }
  }
}

class CookieManager {
  constructor(config) {
    this.cookieLevels = 0; // Value = 0 -> Not Set yet
    if (
      config.mapConfig.map.showCookieNotice === undefined ||
      config.mapConfig.map.showCookieNotice === false
    ) {
      this.cookieLevels = -1; // Value = -1 -> Cookies should not be used
      return;
    }
    const cookieLevels = window.localStorage.getItem("cookieLevels");
    if (cookieLevels !== null) {
      this.cookieLevels = cookieLevels;
    }
  }

  setCookieLevels(cookieLevels) {
    this.cookieLevels = cookieLevels;
    window.localStorage.setItem("cookieLevels", this.cookieLevels);
  }

  isCookieLevelOk(cookieLevel) {
    if (this.cookieLevels === 0) return false; // Not Set
    if (this.cookieLevels === -1) return true; // Cookies not used, set in config by Admin

    const cLevel = cookieLevel.toInt(cookieLevel);
    if ((this.cookieLevels & cLevel) === cLevel) return true; // Bitwise check
    return false;
  }

  showCookieNotice() {
    return this.cookieLevels === 0;
  }
}

export { CookieManager as default, CookieLevel };
