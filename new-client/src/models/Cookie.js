// A simple class used to manage user-cookie-preferences. The default export from this module is
// an instance of the class, hence it should be seen as a singleton. The "setConfig"-method should
// be run early in the application-load-process, setting wether the cookie-notice should be shown to
// the users at all. If the "setConfig"-method is not run, the cookie-notice will never be shown to the users.

// The manager manages cookie-allowance using bitwise-checks, and there are six "allow-cookie-states" (this.#cookieLevel):
// - (-1): The application is set to not care about cookies at all, and all cookies will be allowed.
// - (0): The application is set to care about cookies, but the user has not made their decision yet. In this state,
//        the user should be prompted with the cookie-notice, so that they can make their choice. The application should
//        be unusable until they've made their choice. "functionalOk" and "thirdPartyOk" will obviously return false.
// - (1): The application is set to care about cookies, but only required cookies are accepted. We do not expose a method
//        that checks if required-cookies are accepted, since if the user has made it passed the cookie-notice (changed
//        this.#cookieLevel from 0 to 1) they have accepted the required cookies.
// - (2): The application allows for functional cookies. If set, the "functionalOk"-method will return true.
// - (4): The application allows for third-party-cookies. If set, the "thirdPartyOk"-method will return true.
// - (7): The application allows for both functional- and third-party-cookies. If set, both methods above will return true.

// The manager exposes a couple of methods that can be used trough-out the application to make sure we only use cookies
// that the user has accepted:
// - functionalOk(): Returns wether it is OK to store functional-cookies or not.
// - thirdPartyOk(): Returns wether it is OK to store third-party-cookies or not.
// - setLevel(<int> level): Updates this.#cookieLevel, should be used in the cookie-notice. Emits an event on the globalObserver (core.cookieLevelChanged).
// - setConfig(): Used to "initiate" the manager. Should be run early on application load so that we can catch if the application
//                should care about cookies at all.
// - shouldShowNotice(): Returns wether the cookie-notice should be shown or not.
class CookieManager {
  #cookieLevel;
  #functionalCookie;
  #thirdPartyCookie;
  #globalObserver;

  // We have to initiate the cookie-level (let's set it to -1 since we're not sure if we care about cookies yet).
  // We also have to set the functional- and third-party-cookie-levels. Remember that we're using bitwise-operators
  // to check which level is OK.
  constructor() {
    this.#cookieLevel = -1;
    this.#functionalCookie = 2;
    this.#thirdPartyCookie = 4;
    this.#globalObserver = null;
  }

  // Used to make sure we're allowing all cookies if "showCookieNotice" is set to false in
  // (or missing from) the map-configuration. This method should only be run once.
  setConfig = (settings) => {
    const { showCookieNotice, globalObserver } = settings;
    // If "showCookieNotice" is set to true in the map-configuration we'll check if the user has
    // interacted with the cookie-notice earlier. (If they did, a cookie-level will be set in LS).
    if (showCookieNotice) {
      this.setLevel(this.#getStoredCookieLevel());
      this.#globalObserver = globalObserver;
    } else {
      // Otherwise we set the level to -1, stating that all cookies are allowed, and that the cookie-notice
      // shouldn't be shown.
      this.#cookieLevel = -1;
    }
  };

  // Updates the cookie-level (both internally and in the store). It also emits an event on the
  // globalObserver so that the components can re-render when the level is changed.
  setLevel = (level) => {
    this.#cookieLevel = level;
    this.#globalObserver &&
      this.#globalObserver.publish("core.cookieLevelChanged", level);
    window.localStorage.setItem("cookieLevel", this.#cookieLevel);
  };

  // Returns wether the cookie-notice should be shown or not.
  shouldShowNotice = () => {
    return this.#cookieLevelNotSet();
  };

  // Returns wether the cookie-level has been set yet or not.
  #cookieLevelNotSet = () => {
    return this.#cookieLevel === 0;
  };

  // Returns wether any cookies are allowed or not. Remember, if the cookie-level is set to -1
  // we don't care about cookies at all in this application. (This is set in the map-configuration).
  #allCookiesAllowed = () => {
    return this.#cookieLevel === -1;
  };

  // Returns potentially stored cookie-level from LS. If nothing is set in LS, we return 0 (stating that
  // the cookie-level has not been set yet).
  #getStoredCookieLevel = () => {
    const levelInStorage = window.localStorage.getItem("cookieLevel");
    return levelInStorage ? parseInt(levelInStorage) : 0;
  };

  // Returns wether functional-cookies are OK to store or not.
  functionalOk = () => {
    // If the cookie-level is not set yet, we cannot store them.
    if (this.#cookieLevelNotSet()) {
      return false;
    }
    // If we don't care about cookies, we can do whatever we want.
    if (this.#allCookiesAllowed()) {
      return true;
    }
    // Otherwise we do a bitwise-comparison between the current cookie-level and a functional-
    // cookie-level. Remember that if both functional- and third-party-cookies are allowed (level 7)
    // this will return true, since 0111 & 0010 => 0010.
    return (
      (this.#cookieLevel & this.#functionalCookie) === this.#functionalCookie
    );
  };

  // Returns wether third-party-cookies are OK to store or not.
  thirdPartyOk = () => {
    // If the cookie-level is not set yet, we cannot store them.
    if (this.#cookieLevelNotSet()) {
      return false;
    }
    // If we don't care about cookies, we can do whatever we want.
    if (this.#allCookiesAllowed()) {
      return true;
    }
    // Otherwise we do a bitwise-comparison between the current cookie-level and a third-party-
    // cookie-level. Remember that if both functional- and third-party-cookies are allowed (level 7)
    // this will return true, since 0111 & 0101 => 0101.
    return (
      (this.#cookieLevel & this.#thirdPartyCookie) === this.#thirdPartyCookie
    );
  };
}

// Initiate the singleton. Note: it never gets exported from this module.
const CM = new CookieManager();
// Setup the exports that allow us to modify certain aspects of the singleton-instance.
// Usage: e.g. import { setLevel } from "./Cookie";
export const setConfig = (settings) => CM.setConfig(settings);
export const setLevel = (level) => CM.setLevel(level);
export const shouldShowNotice = () => CM.shouldShowNotice();
export const functionalOk = () => CM.functionalOk();
export const thirdPartyOk = () => CM.thirdPartyOk();
