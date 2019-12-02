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
    this.searchResults = [
      {
        id: 0,
        label: "Joruneys",
        featureCollection: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              id: "municipalityZoneName.fid-73c97ed0_16eb1fd0de6_-24f2",
              geometry: null,
              properties: {
                Gid: 9081014110000114,
                Name: "Upplands Väsby"
              }
            },
            {
              type: "Feature",
              id: "municipalityZoneName.fid-73c97ed0_16eb1fd0de6_-24f1",
              geometry: null,
              properties: {
                Gid: 9081014110000116,
                Name: "Vallentuna"
              }
            }
          ],
          totalFeatures: "unknown",
          numberReturned: 50,
          timeStamp: "2019-11-29T10:42:47.183Z",
          crs: null
        }
      },
      {
        id: 1,
        label: "Stops",
        featureCollection: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              id: "municipalityZoneName.fid-73c97ed0_16eb1fd0de6_-24f2",
              geometry: null,
              properties: {
                Gid: 9081014110000114,
                Name: "Upplands Väsby"
              }
            },
            {
              type: "Feature",
              id: "municipalityZoneName.fid-73c97ed0_16eb1fd0de6_-24f1",
              geometry: null,
              properties: {
                Gid: 9081014110000116,
                Name: "Vallentuna"
              }
            }
          ],
          totalFeatures: "unknown",
          numberReturned: 50,
          timeStamp: "2019-11-29T10:42:47.183Z",
          crs: null
        }
      }
    ];
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
