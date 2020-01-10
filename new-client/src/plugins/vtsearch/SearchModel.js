/**
 * @summary SearchModel used for VT specific searches.
 * @description NEED TO ADD A DESCRIPTION
 *
 * @class SearchModel
 */

export default class SearchModel {
  /**
   * Settings with labels, urls etc. for the search functions.
   */
  geoserver = null;

  /**
   * Constructor for the search model.
   * @param {object} settings The settings from the json settings file.
   */
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;
    this.geoserver = settings.geoserver;
  }

  /**
   * Private method that a djusts the CQL filter so that it's supported for a web browser and GeoServer.
   * @param {string} cql The CQL that needs to be adjusted.
   * @returns {string} Returns a supported wkt for GeoServer.
   *
   * @memberof SerachModel
   */
  fixCqlForGeoServer = cql => {
    return cql
      .replace(/%/g, "%25")
      .replace(/ /g, "%20")
      .replace(/'/g, "%27");
  };

  /**
   * Private method that adjusts the WKT filter so that it's supported for a web browser and GeoServer.
   * @param {string} wkt The WKT that needs to be adjusted.
   * @returns {string} Returns a supported wkt for GeoServer.
   *
   * @memberof SerachModel
   */
  fixWktForGeoServer = wkt => {
    return wkt
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29")
      .replace(/,/g, "%5C,")
      .replace(/ /g, "%20");
  };

  /**
   * Private method that gets all attributes that should remain from GeoServer.
   * @param {array(string, string)} attributesToDisplay An array of attributes to be displayed.
   * @returns {array(string)} An array with only attribute names, stripped of all other data.
   *
   * @memberof SearchModel
   */
  attributesToKeepFromSettings = attributesToDisplay => {
    return attributesToDisplay.map(attribute => {
      return attribute.key;
    });
  };

  /**
   * Private method that determines if a we have a line number or a line name.
   * @param {string} lineNameOrNumber The text string to check.
   * @returns {boolean} Returns true if the text string is a line number.
   *
   * @memberof SearchModel
   */
  isLineNumber = lineNameOrNumber => {
    // Checks for only digits.
    if (lineNameOrNumber.match(/^[0-9]+$/) != null) return true;

    return false;
  };

  /**
   * Private method that tests if a string is null or empty
   * @param {string} stringValue The string to test.
   * @returns {boolean} Returns true if the string is empty or null.
   */
  isNullOrEmpty = stringValue => {
    return stringValue == null || stringValue === "";
  };

  /**
   * Private method that removes all unnecessary attributes from a collection.
   * @param {object} featureCollection The feature collection with unnecessary attributes.
   * @param {array(string)} attributesToKeep An array with the attributes that will remain.
   * @returns {featureCollection} A feature collection with no unnecessary attributes in it.
   *
   * @memberof SearchModel
   */
  removeUnnecessaryAttributes = (featureCollection, attributesToKeep) => {
    featureCollection.features = featureCollection.features.map(feature => {
      let names = Object.keys(feature.properties);
      for (let iName = 0; iName < names.length; iName++) {
        if (!attributesToKeep.includes(names[iName]))
          delete feature.properties[names[iName]];
      }

      return feature;
    });

    return featureCollection;
  };

  /**
   * Private method that remotes all duplicates from a feature collection and
   * updates the number return value.
   * @param {featureCollection} featureCollection The feature collection with duplicates.
   * @returns {featureCollection} A feature collection with no duplicates in it.
   *
   * @memberof SearchModel
   */
  removeDuplicates = featureCollection => {
    let features = featureCollection.features;
    let uniqueArray = this.removeDuplicatesItems(features);
    featureCollection.features = uniqueArray;
    featureCollection.numberReturned = uniqueArray.length;
    return featureCollection;
  };

  /**
   * Private method that remotes all duplicates from an array of featrues.
   * The function checks if properties diverges.
   * @param {feature} features The feature collection with duplicates.
   * @returns {feature} An array with no duplicates in it.
   *
   * @memberof SearchModel
   */
  removeDuplicatesItems = features => {
    let uniqueArray = [];
    for (let iFeature = 0; iFeature < features.length; iFeature++) {
      if (uniqueArray.indexOf(features[iFeature]) === -1) {
        let shouldAddFeature = true;
        for (
          let iUniqueArray = 0;
          iUniqueArray < uniqueArray.length;
          iUniqueArray++
        ) {
          shouldAddFeature =
            shouldAddFeature &&
            !this.hasSameProperties(
              uniqueArray[iUniqueArray].properties,
              features[iFeature].properties
            );
        }

        if (shouldAddFeature) uniqueArray.push(features[iFeature]);
      }
    }

    return uniqueArray;
  };

  /**
   * Private help method for removeDuplicates, that checks if two objects are the same or not.
   * The comparision looks at propertiy name and values.
   * @param {object} objectOne The first object to compare.
   * @param {object} objectTwo The second object to compare.
   * @returns Returns true if two object has the same propertiy name and values.
   *
   * @memberof SearchModel
   */
  hasSameProperties(objectOne, objectTwo) {
    const propertyNamesOne = Object.keys(objectOne);
    const propertyNamesTwo = Object.keys(objectTwo);

    // Checks if the number of properties
    if (propertyNamesOne.length !== propertyNamesTwo.length) return false;

    // Checks if the property names are the same or not.
    if (
      propertyNamesOne.some((value, index) => {
        return value !== propertyNamesTwo[index];
      })
    )
      return false;

    const propertyValuesOne = Object.values(objectOne);
    const propertyValuesTwo = Object.values(objectTwo);

    // Checks if the property values are the same or not.
    return !propertyValuesOne.some((value, index) => {
      return value !== propertyValuesTwo[index];
    });
  }

  /**
   * Autocompelete function that gets the line numbers or public line numbers that match a search text.
   * @param {string} searchText The search text for a line number or public line number.
   * @returns {array(string)} Returns an array of matching line numbers or public line numbers.
   *
   * @memberof SearchModel
   */
  autocompleteLineNumbersOrPublicLineNumbers(searchText) {
    // If the search is empty no result will be found.
    if (this.isNullOrEmpty(searchText)) return null;

    // Build up the url with cql.
    let url = this.geoserver.lineNumberAndPublicLineNumber.url;
    let cql = "&CQL_FILTER=";

    // Checks if the argument is a line number or a public line number
    const isLineNumber = this.isLineNumber(searchText);

    if (!this.isNullOrEmpty(searchText)) {
      if (isLineNumber) cql = cql + `LineNumber like '${searchText}%'`;
      else cql = cql + `PublicLineNumber like '${searchText}%'`;
    }

    // Fix percent and so on, so that the CQL filters are geoserver valid.
    if (!this.isNullOrEmpty(searchText)) cql = this.fixCqlForGeoServer(cql);

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

          return lineNumberOrPublicLineNumber;
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  /**
   * Autocompelete function that gets all municipality names sorted in alphabetic order array.
   * @returns {array(string)} Returns all municipality names sorted in alphabetic order.
   *
   * @memberof SearchModel
   */
  autocompleteMunicipalityZoneNames() {
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
   * Autocompelete function that gets the stop area names or stop area numbers that match a search text.
   * @param {string} searchText The search text for a line number or public line number.
   * @returns {array(string)} Returns an array of matching line numbers or public line numbers.
   *
   * @memberof SearchModel
   */
  autocompleteStopAreaNamesOrNumbers(searchText) {
    // If the search is empty no result will be found.
    if (this.isNullOrEmpty(searchText)) return null;

    // Build up the url with cql.
    let url = this.geoserver.stopAreaNameAndStopAreaNumber.url;
    let cql = "&cql_filter=";

    // Checks if the argument is a line number or a public line number
    const isLineNumber = this.isLineNumber(searchText);

    if (!this.isNullOrEmpty(searchText)) {
      if (isLineNumber) cql = cql + `Number like '${searchText}%'`;
      else cql = cql + `Name like '${searchText}%'`;
    }

    // Fix percent and so on, so that the CQL filters are geoserver valid.
    if (!this.isNullOrEmpty(searchText)) cql = this.fixCqlForGeoServer(cql);

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

  /**
   * Autocompelete function that gets then transport mode type names and numbers.
   * @returns {array(string, int) Returnes all mode type names as an array of tuples.
   *
   * @memberof SearchModel
   */
  autocompelteTransportModeTypeName() {
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
   * Gets requested journeys. Sends an event when the function is called and another one when it's promise is done.
   * @param {string} fromTime Start time, pass null if no start time is given.
   * @param {string} endTime End time, pass null of no end time is given.
   * @param {string} filterOnWkt A polygon as a WKT, pass null of no polygon is given.
   *
   * @memberof SearchModel
   */
  getJourneys(filterOnFromDate, filterOnToDate, filterOnWkt) {
    this.localObserver.publish("vtsearch-result-begin", {
      label: this.geoserver.journeys.searchLabel
    });

    // Fix parentheses and so on, so that the WKT are geoserver valid.
    if (!this.isNullOrEmpty(filterOnWkt))
      filterOnWkt = this.fixWktForGeoServer(filterOnWkt);

    // Build up the url with viewparams.
    let url = this.geoserver.journeys.url;
    let viewParams = "&viewparams=";
    if (!this.isNullOrEmpty(filterOnFromDate))
      viewParams = viewParams + `filterOnFromDate:${filterOnFromDate};`;
    if (!this.isNullOrEmpty(filterOnToDate))
      viewParams = viewParams + `filterOnToDate:${filterOnToDate};`;
    if (!this.isNullOrEmpty(filterOnWkt))
      viewParams = viewParams + `filterOnWkt:${filterOnWkt};`;

    if (
      !this.isNullOrEmpty(filterOnFromDate) ||
      !this.isNullOrEmpty(filterOnToDate) ||
      !this.isNullOrEmpty(filterOnWkt)
    )
      url = url + viewParams;

    // Fetch the result as a promise and attach it to the event.
    fetch(url)
      .then(res => {
        res.json().then(jsonResult => {
          let journeys = {
            featureCollection: jsonResult,
            label: this.geoserver.journeys.searchLabel,
            type: "journeys"
          };

          journeys.featureCollection = this.removeUnnecessaryAttributes(
            journeys.featureCollection,
            this.attributesToKeepFromSettings(
              this.geoserver.journeys.attributesToDisplay
            )
          );
          journeys.featureCollection = this.removeDuplicates(
            journeys.featureCollection
          );

          this.localObserver.publish("vtsearch-result-done", journeys);
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  /**
   * Gets all Routes. Sends an event when the function is called and another one when it's promise is done.
   * @param {string} publicLineName Public line name.
   * @param {string} internalLineNumber The internal line number.
   * @param {string} isInMunicipalityZoneGid The Gid number of a municipality
   * @param {string} transportModeType The transport type of lines.
   * @param {string} stopAreaNameOrNumber The stop area name or stop area number.
   * @param {string} polygonAsWkt A polygon, as a WKT, to intersects with.
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
    if (!this.isNullOrEmpty(publicLineName)) {
      cql = cql + `PublicLineName like '${publicLineName}'`;
      addAndInCql = true;
    }
    if (!this.isNullOrEmpty(internalLineNumber)) {
      if (addAndInCql) cql = cql + " AND ";
      cql = cql + `InternalLineNumber like '${internalLineNumber}'`;
      addAndInCql = true;
    }
    if (!this.isNullOrEmpty(isInMunicipalityZoneGid)) {
      if (addAndInCql) cql = cql + " AND ";
      cql = cql + `IsInMunicipalityZoneGid like '${isInMunicipalityZoneGid}'`;
      addAndInCql = true;
    }
    if (!this.isNullOrEmpty(transportModeType)) {
      if (addAndInCql) cql = cql + " AND ";
      cql = cql + `TransportModeType like '${transportModeType}'`;
      addAndInCql = true;
    }
    if (!this.isNullOrEmpty(stopAreaNameOrNumber)) {
      if (addAndInCql) cql = cql + " AND ";
      if (this.isLineNumber(stopAreaNameOrNumber))
        cql = cql + `StopAreaNumber like '${stopAreaNameOrNumber}'`;
      else cql = cql + `StopAreaName like '${stopAreaNameOrNumber}'`;
      addAndInCql = true;
    }
    if (!this.isNullOrEmpty(polygonAsWkt)) {
      if (addAndInCql) cql = cql + " AND ";
      cql = cql + `Geom like '${polygonAsWkt}'`;
      addAndInCql = true;
    }

    if (
      !this.isNullOrEmpty(publicLineName) ||
      !this.isNullOrEmpty(internalLineNumber) ||
      !this.isNullOrEmpty(isInMunicipalityZoneGid) ||
      !this.isNullOrEmpty(transportModeType) ||
      !this.isNullOrEmpty(stopAreaNameOrNumber) ||
      !this.isNullOrEmpty(polygonAsWkt)
    )
      url = url + cql;

    // Fetch the result as a promise and attach it to the event.
    fetch(url)
      .then(res => {
        res.json().then(jsonResult => {
          const routes = {
            featureCollection: jsonResult,
            label: this.geoserver.routes.searchLabel,
            type: "routes"
          };

          routes.featureCollection = this.removeUnnecessaryAttributes(
            routes.featureCollection,
            this.attributesToKeepFromSettings(
              this.geoserver.routes.attributesToDisplay
            )
          );
          routes.featureCollection = this.removeDuplicates(
            routes.featureCollection
          );

          this.localObserver.publish("vtsearch-result-done", routes);
        });
      })
      .catch(err => {
        console.log(err);
      });
  }

  /**
   * Get all stop areas. Sends an event when the function is called and another one when it's promise is done.
   * @param {string} filterOnName The public name of the stop area, pass null of no name is given.
   * @param {string} filterOnPublicLine The public line number, pass null of no line is given.
   * @param {string} filterOnMunicipalName The municipality name, pass null of no municipality name is given.
   * @param {string} filterOnNumber The number of the stop area, pass null of no number is given.
   * @param {string} filterOnWkt A polygon as a WKT, pass null of no polygon is given.
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
    if (!this.isNullOrEmpty(filterOnWkt))
      filterOnWkt = this.fixWktForGeoServer(filterOnWkt);

    // Build up the url with viewparams.
    let url = this.geoserver.stopAreas.url;
    let viewParams = "&viewparams=";
    if (!this.isNullOrEmpty(filterOnName))
      viewParams = viewParams + `filterOnName:${filterOnName};`;
    if (!this.isNullOrEmpty(filterOnPublicLine))
      viewParams = viewParams + `filterOnPublicLine:${filterOnPublicLine};`;
    if (!this.isNullOrEmpty(filterOnMunicipalName))
      viewParams =
        viewParams + `filterOnMunicipalName:${filterOnMunicipalName};`;
    if (!this.isNullOrEmpty(filterOnNumber))
      viewParams = viewParams + `filterOnNumber:${filterOnNumber};`;
    if (!this.isNullOrEmpty(filterOnWkt))
      viewParams = viewParams + `filterOnWkt:${filterOnWkt};`;

    if (
      !this.isNullOrEmpty(filterOnName) ||
      !this.isNullOrEmpty(filterOnPublicLine) ||
      !this.isNullOrEmpty(filterOnMunicipalName) ||
      !this.isNullOrEmpty(filterOnNumber) ||
      !this.isNullOrEmpty(filterOnWkt)
    )
      url = url + viewParams;

    // Fetch the result as a promise and attach it to the event.
    fetch(url).then(res => {
      res
        .json()
        .then(jsonResult => {
          let stopAreas = {
            featureCollection: jsonResult,
            label: this.geoserver.stopAreas.searchLabel,
            type: "stopAreas"
          };

          stopAreas.featureCollection = this.removeUnnecessaryAttributes(
            stopAreas.featureCollection,
            this.attributesToKeepFromSettings(
              this.geoserver.stopAreas.attributesToDisplay
            )
          );
          stopAreas.featureCollection = this.removeDuplicates(
            stopAreas.featureCollection
          );

          this.localObserver.publish("vtsearch-result-done", stopAreas);
        })
        .catch(err => {
          console.log(err);
        });
    });
  }

  /**
   * Get all stop points. Sends an event when the function is called and another one when it's promise is done.
   * @param {string} filterOnName The public name of the stop point, pass null of no name is given.
   * @param {string} filterOnPublicLine The public line number, pass null of no line is given.
   * @param {string} filterOnMunicipalName The municipality name, pass null of no municipality name is given.
   * @param {string} filterOnNumber The number of the stop point, pass null of no number is given.
   * @param {string} filterOnWkt A polygon as a WKT, pass null of no polygon is given.
   *
   * @memberof SearchModel
   */
  getStopPoints(
    filterOnName,
    filterOnPublicLine,
    filterOnMunicipalName,
    filterOnNumber,
    filterOnWkt
  ) {
    this.localObserver.publish("vtsearch-result-begin", {
      label: this.geoserver.stopPoints.searchLabel
    });

    // Fix parentheses and so on, so that the WKT are geoserver valid.
    if (!this.isNullOrEmpty(filterOnWkt))
      filterOnWkt = this.fixWktForGeoServer(filterOnWkt);

    // Build up the url with viewparams.
    let url = this.geoserver.stopPoints.url;
    let viewParams = "&viewparams=";
    if (!this.isNullOrEmpty(filterOnName))
      viewParams = viewParams + `filterOnName:${filterOnName};`;
    if (!this.isNullOrEmpty(filterOnPublicLine))
      viewParams = viewParams + `filterOnPublicLine:${filterOnPublicLine};`;
    if (!this.isNullOrEmpty(filterOnMunicipalName))
      viewParams =
        viewParams + `filterOnMunicipalName:${filterOnMunicipalName};`;
    if (!this.isNullOrEmpty(filterOnNumber))
      viewParams = viewParams + `filterOnNumber:${filterOnNumber};`;
    if (!this.isNullOrEmpty(filterOnWkt))
      viewParams = viewParams + `filterOnWkt:${filterOnWkt};`;

    if (
      !this.isNullOrEmpty(filterOnName) ||
      !this.isNullOrEmpty(filterOnPublicLine) ||
      !this.isNullOrEmpty(filterOnMunicipalName) ||
      !this.isNullOrEmpty(filterOnNumber) ||
      !this.isNullOrEmpty(filterOnWkt)
    )
      url = url + viewParams;

    // Fetch the result as a promise and attach it to the event.
    fetch(url).then(res => {
      res
        .json()
        .then(jsonResult => {
          let stopPoints = {
            featureCollection: jsonResult,
            label: this.geoserver.stopPoints.searchLabel,
            type: "stopPoints"
          };

          stopPoints.featureCollection = this.removeUnnecessaryAttributes(
            stopPoints.featureCollection,
            this.attributesToKeepFromSettings(
              this.geoserver.stopPoints.attributesToDisplay
            )
          );
          stopPoints.featureCollection = this.removeDuplicates(
            stopPoints.featureCollection
          );

          this.localObserver.publish("vtsearch-result-done", stopPoints);
        })
        .catch(err => {
          console.log(err);
        });
    });
  }

  /**
   * Returns the global Map object.
   * @returns {object} Map
   *
   * @memberof SearchModel
   */
  getMap() {
    return this.map;
  }
}
