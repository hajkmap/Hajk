/**
 * @summary SearchModel used for VT specific searches.
 * @description NEED TO ADD A DESCRIPTION
 *
 * @class SearchModel
 */
export default class SearchModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;
  }
  /**
   * Returns the global Map object.
   *
   * @returns {object} Map
   * @memberof SearchModel
   */

  getMap() {
    return this.map;
  }
}
