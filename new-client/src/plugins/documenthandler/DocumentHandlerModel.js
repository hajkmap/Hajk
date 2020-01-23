/**
 * @summary  DocumentHandler model that doesn't do much.
 * @description This model exposes only one method, getMap(),
 * so it does not do anything crucial. But you can see it
 * as an example of how a plugin can be separated in different
 * components.
 *
 * @class DocumentHandlerModel
 */
export default class DocumentHandlerModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;
  }
  /**
   * Returns the global Map object.
   *
   * @returns {object} Map
   * @memberof  DocumentHandlerModel
   */
  getMap() {
    return this.map;
  }
}
