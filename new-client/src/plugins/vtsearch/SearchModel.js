/**
 * @summary SearchModel used for VT specific searches.
 * @description NEED TO ADD A DESCRIPTION
 *
 * @class SearchModel
 */
export default class SearchModel {
  /**
   * Settings with labels and urls for the search functions.
   */
  static geoserverUrls = null;

  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;
    this.geoserver = settings.geoserver;
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

    // Build up the url with viewparams.
    let url = this.geoserver.journeys.url;
    let viewParams = `&viewparams=filterOnFromDate:${filterOnFromDate};filterOnToDate:${filterOnToDate};filterOnWkt:${filterOnWkt}`;
    if (filterOnFromDate != null)
      viewParams = viewParams + `filterOnFromDate:${filterOnFromDate};`;
    if (filterOnToDate != null)
      viewParams = viewParams + `filterOnToDate:${filterOnToDate};`;
    if (filterOnWkt != null)
      viewParams = viewParams + `filterOnWkt:${filterOnWkt};`;

    if (
      filterOnFromDate != null &&
      filterOnToDate != null &&
      filterOnWkt != null
    )
      url = url + viewParams;

    // Fetch the result as a promise and attach it to the event.
    fetch(url).then(res => {
      res.json().then(jsonResult => {
        const journeys = {
          data: jsonResult.features,
          label: this.geoserver.journeys.searchLabel
        };
        this.localObserver.publish("journey-result-done", journeys);
      });
    });
  }

  /**
   * Gets all municipality names sorted in alphabetic order array. Sends an event when the function is called and another one when
   * it's promise is done and sorted.
   * @returns Returns all municipality names sorted in alphabetic order.
   *
   * @memberof SearchModel
   */
  getMunicipalityZoneNames() {
    this.localObserver.publish("municipalityZoneNames-result-begin");

    // The url.
    const url = this.geoserver.municipalityZoneNames.url;

    // Fetch the result as a promise, sort it and attach it to the event.
    return fetch(url).then(res => {
      return res.json().then(jsonResult => {
        let allMunicipalitiyNames = jsonResult.features.map(feature => {
          return feature.properties.Name;
        });

        // Sort the array with Swedish letters
        allMunicipalitiyNames.sort(([a], [b]) => a.localeCompare(b, "swe"));

        const municipalityNames = {
          data: allMunicipalitiyNames,
          label: this.geoserver.municipalityZoneNames.searchLabel
        };
        this.localObserver.publish(
          "municipalityZoneNames-result-done",
          municipalityNames
        );
        return municipalityNames.data;
      });
    });
  }

  /**
   * Returns then transport mode type names and numbers. Sends an event when the function is called and another one when
   * it's promise is done.
   * @returns Returnes all mode type names as an array of tuples.
   */
  getTransportModeTypeName() {
    this.localObserver.publish("transportModeTypeNames-result-begin");

    // The url.
    const url = this.geoserver.transportModeTypeNames.url;

    // Fetch the result as a promise and attach it to the event.
    return fetch(url).then(res => {
      return res.json().then(jsonFeature => {
        let transportModeTypes = jsonFeature.features.map(feature => {
          return [feature.properties.Number, feature.properties.Name];
        });

        const transportModeTypeNames = {
          data: transportModeTypes,
          label: this.geoserver.transportModeTypeNames.searchLabel
        };

        this.localObserver.publish(
          "transportModeTypeNames-result-done",
          transportModeTypeNames
        );
        return transportModeTypeNames;
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
