/**
 * @summary Preset model
 * @description Model for the preset plugin
 *
 * @class PresetModel
 */
export default class PresetModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;
  }
  /**
   * Returns the global Map object.
   *
   * @returns {object} Map
   * @memberof PresetModel
   */
}
