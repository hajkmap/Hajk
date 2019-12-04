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
   * Adjusts a WKT so that it's supported for a web browser and GeoServer.
   * @param wkt The wkt that needs to be adjusted.
   * @returns Returns a supported wkt for GeoServer.
   *
   * @memberof SerachModel
   */
  fixWktForGeoServer = wkt => {
    return wkt
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29")
      .replace(/\ /g, "%20")
      .replace(/\,/g, "%5C,");
  };

  /**
   * Gets requested journeys.
   * @param fromTime Start time.
   * @param endTime End time.
   * @param wktPolygon A polygon as a WKT.
   * @returns Returns all journeys
   *
   * @memberof SearchModel
   */
  getJourneys(filterOnFromDate, filterOnToDate, filterOnWkt) {
    this.localObserver.publish("journey-result-begin");

    // Fix parentheses and so on, so that the WKT are geoserver valid.
    filterOnWkt = this.fixWktForGeoServer(filterOnWkt);

    // Build up the url.
    let url =
      "http://sestoas256:8080/geoserver/kartsidan2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=kartsidan2:journeys&outputFormat=application/json";
    const viewParams = `&viewparams=filterOnFromDate:${filterOnFromDate};filterOnToDate:${filterOnToDate};filterOnWkt:${filterOnWkt}`;
    url = url + viewParams;

    // Fetch the result as a promise and attach it to the event.
    fetch(url).then(res => {
      res.json().then(jsonFeature => {
        this.localObserver.publish("journey-result-done", jsonFeature);
      });
    });
  }

  /**
   * Gets all municipality names sorted in alphabetic order array. Sends an event when the function is called and another one when
   * it's promise is done and sorted.
   * @returns - Returns all municipality names sorted in alphabetic order.
   *
   * @memberof SearchModel
   */
  getMunicipalityZoneNames() {
    this.localObserver.publish("municipalityZoneNames-result-begin");

    // The url.
    const url =
      "http://sestoas256:8080/geoserver/kartsidan2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=kartsidan2%3AmunicipalityZoneNames&outputFormat=application/json";

    // Fetch the result as a promise, sort it and attach it to the event.
    fetch(url).then(res => {
      res.json().then(jsonResult => {
        let allMunicipalitiyNames = jsonResult.features.map(feature => {
          return feature.properties.Name;
        });

        // Sort the array with Swedish letters
        allMunicipalitiyNames.sort(([a], [b]) => a.localeCompare(b, "swe"));

        this.localObserver.publish(
          "municipalityZoneNames-result-done",
          allMunicipalitiyNames
        );
      });
    });
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
