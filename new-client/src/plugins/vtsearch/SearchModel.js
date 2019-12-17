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
  geoserver = null;

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
   * Private method that determines if a we have a line number or a line name.
   * @param lineNameOrNumber The text string to check.
   * @returns Returns true if the text string is a line number.
   *
   * @memberof SearchModel
   */
  isLineNumber = lineNameOrNumber => {
    // Checks for only digits.
    if (lineNameOrNumber.match(/^[0-9]+$/) != null) return true;

    // Check for express lines.
    this.geoserver.expressLines.map(line => {
      if (line.toUpperCase() === lineNameOrNumber.toUpperCase()) return true;
    });

    return false;
  };

  /**
   * Gets requested journeys.
   * @param fromTime Start time, pass null if no start time is given.
   * @param endTime End time, pass null of no end time is given.
   * @param wktPolygon A polygon as a WKT, pass null of no polygon is given.
   *
   * @memberof SearchModel
   */
  getJourneys(filterOnFromDate, filterOnToDate, filterOnWkt) {
    this.localObserver.publish("vtsearch-result-begin", {
      label: this.geoserver.journeys.searchLabel
    });

    // Fix parentheses and so on, so that the WKT are geoserver valid.
    if (filterOnWkt != null) filterOnWkt = this.fixWktForGeoServer(filterOnWkt);

    // Build up the url with viewparams.
    let url = this.geoserver.journeys.url;
    let viewParams = "&viewparams=";
    if (filterOnFromDate != null)
      viewParams = viewParams + `filterOnFromDate:${filterOnFromDate};`;
    if (filterOnToDate != null)
      viewParams = viewParams + `filterOnToDate:${filterOnToDate};`;
    if (filterOnWkt != null)
      viewParams = viewParams + `filterOnWkt:${filterOnWkt};`;

    if (
      filterOnFromDate != null ||
      filterOnToDate != null ||
      filterOnWkt != null
    )
      url = url + viewParams;

    // Fetch the result as a promise and attach it to the event.
    fetch(url).then(res => {
      res.json().then(jsonResult => {
        const journeys = {
          featureCollection: jsonResult,
          label: this.geoserver.journeys.searchLabel
        };
        this.localObserver.publish("vtsearch-result-done", journeys);
      });
    });
  }

  /**
   * Gets all municipality names sorted in alphabetic order array.
   * @returns Returns all municipality names sorted in alphabetic order.
   *
   * @memberof SearchModel
   */
  getMunicipalityZoneNames() {
    // The url.
    const url = this.geoserver.municipalityZoneNames.url;

    // Fetch the result as a promise, sort it and attach it to the event.
    return fetch(url).then(res => {
      return res.json().then(jsonResult => {
        let allMunicipalitiyNames = jsonResult.features.map(feature => {
          return [feature.properties.Name, feature.properties.Gid];
        });

        // Sort the array with Swedish letters
        allMunicipalitiyNames.sort(([a], [b]) => a.localeCompare(b, "swe"));

        return allMunicipalitiyNames;
      });
    });
  }

  /**
   * Gets all Routs. Sends an event when the function is called and another one when it's promise is done.
   * @param publicLineName Public line name.
   * @param internalLineNumber The internal line number.
   * @param isInMunicipalityZoneGid The Gid number of a municipality
   * @param transportModeType The transport type of lines.
   * @param stopAreaNameOrNumber The stop area name or stop area number.
   * @param polygon A polygon to intersects with.
   *
   * @memberof SearchModel
   */
  getRoutes(
    publicLineName,
    internalLineNumber,
    isInMunicipalityZoneGid,
    transportModeType,
    stopAreaNameOrNumber,
    polygon
  ) {
    this.localObserver.publish("vtsearch-result-begin", {
      label: this.geoserver.routes.searchLabel
    });

    // Build up the url with cql.
    let url = this.geoserver.routes.url;
    let cql = "&cql_filter=";
    let addAndInCql = false;
    if (publicLineName != null) {
      cql = cql + `PublicLineName=${publicLineName}`;
      addAndInCql = true;
    }
    if (internalLineNumber != null) {
      if (addAndInCql) cql = cql + " AND ";
      cql = cql + `InternalLineNumber=${internalLineNumber}`;
      addAndInCql = true;
    }
    if (isInMunicipalityZoneGid != null) {
      if (addAndInCql) cql = cql + " AND ";
      cql = cql + `IsInMunicipalityZoneGid=${isInMunicipalityZoneGid}`;
      addAndInCql = true;
    }
    if (transportModeType != null) {
      if (addAndInCql) cql = cql + " AND ";
      cql = cql + `TransportModeType=${transportModeType}`;
      addAndInCql = true;
    }
    if (stopAreaNameOrNumber != null) {
      if (addAndInCql) cql = cql + " AND ";
      if (this.isLineNumber(stopAreaNameOrNumber))
        cql = cql + `StopAreaNumber=${stopAreaNameOrNumber}`;
      else cql = cql + `StopAreaName=${stopAreaNameOrNumber}`;
      addAndInCql = true;
    }
    if (polygon != null) {
      if (addAndInCql) cql = cql + " AND ";
      cql = cql + `Geom=${polygon}`;
      addAndInCql = true;
    }

    if (
      publicLineName != null ||
      internalLineNumber != null ||
      isInMunicipalityZoneGid != null ||
      transportModeType != null ||
      stopAreaNameOrNumber != null ||
      polygon != null
    )
      url = url + cql;

    console.log(url);

    // Fetch the result as a promise and attach it to the event.
    fetch(url).then(res => {
      res.json().then(jsonResult => {
        console.log("getRoutes / fetch");

        const routes = {
          featureCollection: jsonResult,
          label: this.geoserver.routes.searchLabel
        };

        this.localObserver.publish("vtsearch-result-done", routes);
      });
    });
  }

  /***
   * Get all stop areas. Sends  Sends an event when the function is called and another one when it's promise is done.
   * @param filterOnName The public name of the stop area, pass null of no name is given.
   * @param filterOnPublicLine The public line number, pass null of no line is given.
   * @param filterOnMunicipalName The municipality name, pass null of no municipality name is given.
   * @param filterOnNumber The number of the stop area, pass null of no number is given.
   * @param filterOnWkt A polygon as a WKT, pass null of no polygon is given.
   *
   * @memberof SearchModel
   */
  getStopAreas(
    filterOnName,
    filterOnPublicLine,
    filterOnMunicipalName,
    filterOnNumber,
    filterOnWkt
  ) {
    this.localObserver.publish("vtsearch-result-begin", {
      label: this.geoserver.stopAreas.searchLabel
    });

    // Fix parentheses and so on, so that the WKT are geoserver valid.
    if (filterOnWkt != null) filterOnWkt = this.fixWktForGeoServer(filterOnWkt);

    // Build up the url with viewparams.
    let url = this.geoserver.stopAreas.url;
    let viewParams = "&viewparams=";
    if (filterOnName != null)
      viewParams = viewParams + `filterOnName:${filterOnName};`;
    if (filterOnPublicLine != null)
      viewParams = viewParams + `filterOnPublicLine:${filterOnPublicLine};`;
    if (filterOnMunicipalName != null)
      viewParams =
        viewParams + `filterOnMunicipalName:${filterOnMunicipalName};`;
    if (filterOnNumber != null)
      viewParams = viewParams + `filterOnNumber:${filterOnNumber};`;
    if (filterOnWkt != null)
      viewParams = viewParams + `filterOnWkt:${filterOnWkt};`;

    if (
      filterOnName != null ||
      filterOnPublicLine != null ||
      filterOnMunicipalName != null ||
      filterOnNumber != null ||
      filterOnWkt != null
    )
      url = url + viewParams;

    // Fetch the result as a promise and attach it to the event.
    fetch(url).then(res => {
      res.json().then(jsonResult => {
        const stopAreas = {
          featureCollection: jsonResult,
          label: this.geoserver.stopAreas.searchLabel
        };
        this.localObserver.publish("vtsearch-result-done", stopAreas);
      });
    });
  }

  /**
   * Returns then transport mode type names and numbers.
   * @returns Returnes all mode type names as an array of tuples.
   *
   * @memberof SearchModel
   */
  getTransportModeTypeName() {
    this.localObserver.publish("transportModeTypeNames-result-begin", {
      label: this.geoserver.transportModeTypeNames.searchLabel
    });

    // The url.
    const url = this.geoserver.transportModeTypeNames.url;

    // Fetch the result as a promise and attach it to the event.
    return fetch(url).then(res => {
      return res.json().then(jsonFeature => {
        let transportModeTypes = jsonFeature.features.map(feature => {
          return feature.properties.Name;
        });

        return transportModeTypes;
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
