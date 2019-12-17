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
   * Private method that a djusts the CQL filter so that it's supported for a web browser and GeoServer.
   * @param cql The CQL that needs to be adjusted.
   * @returns Returns a supported wkt for GeoServer.
   *
   * @memberof SerachModel
   */
  fixCqlForGeoServer = cql => {
    return cql
      .replace(/\%/g, "%25")
      .replace(/\ /g, "%20")
      .replace(/\'/g, "%27");
  };

  /**
   * Private method that adjusts the WKT filter so that it's supported for a web browser and GeoServer.
   * @param wkt The WKT that needs to be adjusted.
   * @returns Returns a supported wkt for GeoServer.
   *
   * @memberof SerachModel
   */
  fixWktForGeoServer = wkt => {
    return wkt
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29")
      .replace(/\,/g, "%5C,")
      .replace(/\%/g, "%25");
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

    return false;
  };

  /**
   * Private method that remotes all duplicates from a feature collection.
   * @param featureCollection The feature collection with duplicates.
   * @returns An array with no duplicates in it.
   *
   * @memberof SearchModel
   */
  removeDuplicates = featureCollection => {
    let uniqueArray = [];
    for (
      let iFeatureCollection = 0;
      iFeatureCollection < featureCollection.length;
      iFeatureCollection++
    ) {
      if (uniqueArray.indexOf(featureCollection[iFeatureCollection]) === -1) {
        let isUnique = true;
        for (
          let iUniqueArray = 0;
          iUniqueArray < uniqueArray.length;
          iUniqueArray++
        ) {
          if (
            uniqueArray[iUniqueArray].properties.DirectionOfLineId ===
              featureCollection[iFeatureCollection].properties
                .DirectionOfLineId &&
            uniqueArray[iUniqueArray].properties.InternalLineNumber ===
              featureCollection[iFeatureCollection].properties
                .InternalLineNumber &&
            uniqueArray[iUniqueArray].properties.PublicLineName ===
              featureCollection[iFeatureCollection].properties.PublicLineName &&
            uniqueArray[iUniqueArray].properties.Description ===
              featureCollection[iFeatureCollection].properties.Description &&
            uniqueArray[iUniqueArray].properties.Direction ===
              featureCollection[iFeatureCollection].properties.Direction &&
            uniqueArray[iUniqueArray].properties.TransportModeType ===
              featureCollection[iFeatureCollection].properties
                .TransportModeType &&
            uniqueArray[iUniqueArray].properties.TransportCompany ===
              featureCollection[iFeatureCollection].properties.TransportCompany
          ) {
            isUnique = false;
            break;
          }
        }

        if (isUnique) uniqueArray.push(featureCollection[iFeatureCollection]);
      }
    }

    return uniqueArray;
  };

  /**
   * Gets requested journeys. Sends an event when the function is called and another one when it's promise is done.
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

    console.log(url);

    // Fetch the result as a promise and attach it to the event.
    fetch(url)
      .then(res => {
        res.json().then(jsonResult => {
          const journeys = {
            featureCollection: jsonResult,
            label: this.geoserver.journeys.searchLabel
          };
          this.localObserver.publish("vtsearch-result-done", journeys);
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  /**
   * Gets the line numbers or public line numbers that match a search text.
   * @param searchText The search text for a line number or public line number.
   * @returns Returns an array of matching line numbers or public line numbers.
   *
   * @memberof SearchModel
   */
  getLineNumbersOrPublicLineNumbers(searchText) {
    // If the search is empty no result will be found.
    if (searchText == null) return null;

    // Build up the url with cql.
    let url = this.geoserver.lineNumberAndPublicLineNumber.url;
    let cql = "&CQL_FILTER=";

    // Checks if the argument is a line number or a public line number
    const isLineNumber = this.isLineNumber(searchText);

    if (searchText != null) {
      if (isLineNumber) cql = cql + `LineNumber like '${searchText}%'`;
      else cql = cql + `PublicLineNumber like '${searchText}%'`;
    }

    // Fix percent and so on, so that the CQL filters are geoserver valid.
    if (searchText != null) cql = this.fixCqlForGeoServer(cql);

    // Fetch the result as a promise, sort it and attach it to the event.
    url = url + cql;
    return fetch(url)
      .then(res => {
        return res.json().then(jsonResult => {
          let lineNumberOrPublicLineNumber = jsonResult.features.map(
            feature => {
              if (isLineNumber) return feature.properties.LineNumber;

              return feature.properties.PublicLineNumber;
            }
          );

          console.log(lineNumberOrPublicLineNumber);
          return lineNumberOrPublicLineNumber;
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  /**
   * Gets all municipality names sorted in alphabetic order array.
   * @returns Returns all municipality names sorted in alphabetic order.
   *
   * @memberof SearchModel
   */
  getMunicipalityZoneNames() {
    // Fetch the result as a promise, sort it and attach it to the event.
    const url = this.geoserver.municipalityZoneNames.url;
    return fetch(url)
      .then(res => {
        return res.json().then(jsonResult => {
          let transportModeTypes = jsonResult.features.map(feature => {
            return feature.properties.Name;
          });

          return transportModeTypes;
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  /**
   * Gets all Routs. Sends an event when the function is called and another one when it's promise is done.
   * @param publicLineName Public line name.
   * @param internalLineNumber The internal line number.
   * @param isInMunicipalityZoneGid The Gid number of a municipality
   * @param transportModeType The transport type of lines.
   * @param stopAreaNameOrNumber The stop area name or stop area number.
   * @param polygonAsWkt A polygon, as a WKT, to intersects with.
   *
   * @memberof SearchModel
   */
  getRoutes(
    publicLineName,
    internalLineNumber,
    isInMunicipalityZoneGid,
    transportModeType,
    stopAreaNameOrNumber,
    polygonAsWkt
  ) {
    this.localObserver.publish("vtsearch-result-begin", {
      label: this.geoserver.routes.searchLabel
    });

    // Build up the url with cql.
    let url = this.geoserver.routes.url;
    let cql = "&CQL_FILTER=";
    let addAndInCql = false;
    if (publicLineName != null) {
      cql = cql + `PublicLineName like '${publicLineName}'`;
      addAndInCql = true;
    }
    if (internalLineNumber != null) {
      if (addAndInCql) cql = cql + " AND ";
      cql = cql + `InternalLineNumber like '${internalLineNumber}'`;
      addAndInCql = true;
    }
    if (isInMunicipalityZoneGid != null) {
      if (addAndInCql) cql = cql + " AND ";
      cql = cql + `IsInMunicipalityZoneGid like '${isInMunicipalityZoneGid}'`;
      addAndInCql = true;
    }
    if (transportModeType != null) {
      if (addAndInCql) cql = cql + " AND ";
      cql = cql + `TransportModeType like '${transportModeType}'`;
      addAndInCql = true;
    }
    if (stopAreaNameOrNumber != null) {
      if (addAndInCql) cql = cql + " AND ";
      if (this.isLineNumber(stopAreaNameOrNumber))
        cql = cql + `StopAreaNumber like '${stopAreaNameOrNumber}'`;
      else cql = cql + `StopAreaName like '${stopAreaNameOrNumber}'`;
      addAndInCql = true;
    }
    if (polygonAsWkt != null) {
      if (addAndInCql) cql = cql + " AND ";
      cql = cql + `Geom like '${polygonAsWkt}'`;
      addAndInCql = true;
    }

    if (
      publicLineName != null ||
      internalLineNumber != null ||
      isInMunicipalityZoneGid != null ||
      transportModeType != null ||
      stopAreaNameOrNumber != null ||
      polygonAsWkt != null
    )
      url = url + cql;

    console.log("url", url);

    // Fetch the result as a promise and attach it to the event.
    fetch(url)
      .then(res => {
        res.json().then(jsonResult => {
          const routes = {
            featureCollection: jsonResult,
            label: this.geoserver.routes.searchLabel
          };

          // Removes attributes from properties that is unnecessary
          routes.featureCollection.features.map(feature => {
            delete feature.properties.StopAreaName;
            delete feature.properties.StopAreaNumber;
            delete feature.properties.IsInMunicipalityZoneGid;
            delete feature.properties.DirectionOfLineGid;
            delete feature.properties.bbox;

            return feature;
          });

          // Fix this later
          // console.log("r2", routes.featureCollection);

          // let featureCollection = routes.featureCollection.features;
          // let uniqueArray = this.removeDuplicates(featureCollection);

          // console.log("u1", uniqueArray);

          this.localObserver.publish("vtsearch-result-done", routes);
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  /**
   * Gets the stop area names or stop area numbers that match a search text.
   * @param searchText The search text for a line number or public line number.
   * @returns Returns an array of matching line numbers or public line numbers.
   *
   * @memberof SearchModel
   */
  getStopAreaNamesOrNumbers(searchText) {
    // If the search is empty no result will be found.
    if (searchText == null) return null;

    // Build up the url with cql.
    let url = this.geoserver.stopAreaNameAndStopAreaNumber.url;
    let cql = "&cql_filter=";

    // Checks if the argument is a line number or a public line number
    const isLineNumber = this.isLineNumber(searchText);

    if (searchText != null) {
      if (isLineNumber) cql = cql + `Number like '${searchText}%'`;
      else cql = cql + `Name like '${searchText}%'`;
    }

    // Fix percent and so on, so that the CQL filters are geoserver valid.
    if (searchText != null) cql = this.fixCqlForGeoServer(cql);

    // Fetch the result as a promise, sort it and attach it to the event.
    url = url + cql;

    return fetch(url)
      .then(res => {
        return res.json().then(jsonResult => {
          let stopAreaNamesOrNumbers = jsonResult.features.map(feature => {
            if (isLineNumber) return feature.properties.Number;

            return feature.properties.Name;
          });

          console.log(stopAreaNamesOrNumbers);
          return stopAreaNamesOrNumbers;
        });
      })
      .catch(err => {
        console.log(err);
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

  // /**
  //  * Kommentar.
  //  *
  //  * @memberof SearchModel
  //  */
  // getStopPoints(stopPointNameOrNumber, isInMunicipalityZoneGid) {
  //   return null;
  // }

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
      return res.json().then(jsonResult => {
        let transportModeTypes = jsonResult.features.map(feature => {
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
