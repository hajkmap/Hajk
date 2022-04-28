import { MockdataSearchModel } from "./Mockdata/MockdataSearchModel";

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
  geoServer = null;

  /**
   * Constructor for the search model.
   * @param {object} settings The settings from the json settings file.
   */
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;
    this.geoServer = settings.geoServer;
    this.mapColors = settings.mapColors;
  }

  encodePercentForUrl = (url) => {
    return url.replace(/%/g, "%25");
  };
  /**
   * Private method that a adjusts the CQL filter so that it's supported for a web browser and GeoServer.
   * @param {string} cql The CQL that needs to be adjusted.
   * @returns {string} Returns a supported wkt for GeoServer.
   *
   * @memberof SearchModel
   */
  encodeCqlForGeoServer = (cql) => {
    return cql
      .replace(/\(/g, "%28")
      .replace(/\)/g, "%29")
      .replace(/ /g, "%20")
      .replace(/'/g, "%27");
  };

  /**
   * Private method that adjusts the WKT filter in a cql so that it's supported for a web browser and GeoServer.
   * Fix parentheses and so on, so that the WKT are GeoServer valid.
   * @param {string} wkt The WKT that needs to be adjusted.
   * @returns {string} Returns a supported wkt for GeoServer.
   *
   * @memberof SearchModel
   */
  encodeWktInCqlForGeoServer = (wkt) => {
    return wkt.replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/ /g, "%20");
  };

  /**
   * Private method that adjusts the WKT filter so that it's supported for a web browser and GeoServer.
   * Fix parentheses and so on, so that the WKT are GeoServer valid.
   * @param {string} wkt The WKT that needs to be adjusted.
   * @returns {string} Returns a supported wkt for GeoServer.
   *
   * @memberof SearchModel
   */
  encodeWktForGeoServer = (wkt) => {
    return this.encodeWktInCqlForGeoServer(wkt).replace(/,/g, "%5C,");
  };

  /**
   * Private method that encodes the swedish characters å, ä and ö.
   * @param {string} url The url that needs to be encoded.
   * @returns {string} Returns an encoded url.
   *
   * @memberof SearchModel
   */
  encodeUrlForGeoServer = (url) => {
    return url
      .replace(/å/g, "%C3%A5")
      .replace(/ä/g, "%C3%A4")
      .replace(/ö/g, "%C3%B6");
  };

  /**
   * Private method that gets all attributes that should remain from GeoServer.
   * @param {Array<string, string>} attributesToDisplay An array of attributes to be displayed.
   * @returns {Array<string>} Returns an array with only attribute names, stripped of all other data.
   *
   * @memberof SearchModel
   */
  attributesToKeepFromSettings = (attributesToDisplay) => {
    return attributesToDisplay.map((attribute) => {
      return attribute.key;
    });
  };

  /**
   * Private method that determines if a we have a line number or a line name, i,e, only
   * consists of numbers.
   * @param {string} stringValue The text string to check.
   * @returns {boolean} Returns true if the text string is a line number.
   *
   * @memberof SearchModel
   */
  containsOnlyNumbers = (stringValue) => {
    // Checks for only digits.
    if (stringValue.match(/^[0-9]+$/) != null) return true;

    return false;
  };

  /**
   * Private method that removes all unnecessary attributes from a collection.
   * @param {Object} featureCollection The feature collection with unnecessary attributes.
   * @param {Array<string>} attributesToKeep An array with the attributes that will remain.
   * @returns {Object} Returns a feature collection with no unnecessary attributes in it.
   *
   * @memberof SearchModel
   */
  removeUnnecessaryAttributes = (featureCollection, attributesToKeep) => {
    featureCollection.features = featureCollection.features.map((feature) => {
      let names = Object.keys(feature.properties);
      for (let indexName = 0; indexName < names.length; indexName++) {
        if (!attributesToKeep.includes(names[indexName]))
          delete feature.properties[names[indexName]];
      }

      return feature;
    });

    return featureCollection;
  };

  /**
   * Private method that removes all duplicates from a feature collection and
   * updates the number return value.
   * @param {Object} featureCollection The feature collection with duplicates.
   * @returns {Object} A feature collection with no duplicates in it.
   *
   * @memberof SearchModel
   */
  removeDuplicates = (featureCollection) => {
    let features = featureCollection.features;
    let uniqueArray = this.removeDuplicatedItems(features);
    featureCollection.features = uniqueArray;
    featureCollection.numberReturned = uniqueArray.length;
    return featureCollection;
  };

  /**
   * Private method that removes all duplicates from an array of features.
   * The function checks if properties diverges.
   * @param {Array<Object>} features The feature collection with duplicates.
   * @returns {Array<Object>} Returns an array with no duplicates in it.
   *
   * @memberof SearchModel
   */
  removeDuplicatedItems = (features) => {
    let uniqueArray = [];
    for (let indexFeature = 0; indexFeature < features.length; indexFeature++) {
      if (uniqueArray.indexOf(features[indexFeature]) === -1) {
        let shouldAddFeature = true;
        for (
          let indexUniqueArray = 0;
          indexUniqueArray < uniqueArray.length;
          indexUniqueArray++
        ) {
          shouldAddFeature =
            shouldAddFeature &&
            !this.hasSameProperties(
              uniqueArray[indexUniqueArray].properties,
              features[indexFeature].properties
            );
        }

        if (shouldAddFeature) uniqueArray.push(features[indexFeature]);
      }
    }

    return uniqueArray;
  };

  /**
   * Private help method for removeDuplicates, that checks if two objects are the same or not.
   * The comparison looks at property name and values.
   * @param {Object} objectOne The first object to compare.
   * @param {Object} objectTwo The second object to compare.
   * @returns {boolean} Returns true if two object has the same property name and values.
   *
   * @memberof SearchModel
   */
  hasSameProperties(objectOne, objectTwo) {
    const propertyNamesOne = Object.keys(objectOne);
    const propertyNamesTwo = Object.keys(objectTwo);
    if (!this.propertiesHasTheSameLength(propertyNamesOne, propertyNamesTwo))
      return false;

    if (!this.propertyNamesAreTheSame(propertyNamesOne, propertyNamesTwo))
      return false;

    const propertyValuesOne = Object.values(objectOne);
    const propertyValuesTwo = Object.values(objectTwo);
    return this.propertyValuesAreTheSame(propertyValuesOne, propertyValuesTwo);
  }

  /**
   * Private help method that checks if two array have the same length. The reason for this
   * help method is to check if two objects have the same properties and if the number of
   * properties diverges they can not be the same.
   * @param {Array<string>} propertyNamesOne An array of object one's property names.
   * @param {Array<string>} propertyNamesTwo An array of object two's property names.
   * @returns Returns true if the two properties arrays have the same length.
   *
   * @memberof SearchModel
   */
  propertiesHasTheSameLength(propertyNamesOne, propertyNamesTwo) {
    return propertyNamesOne.length === propertyNamesTwo.length;
  }

  /**
   * Private help method that checks if two arrays of property names are the same. The reason
   * for this is to check if the property names diverges. If the do, the objects can not be
   * the same.
   * @param {Array<string>} propertyNamesOne An array of object one's property names.
   * @param {Array<string>} propertyNamesTwo An array of object two's property names.
   * @returns Returns true if the two properties arrays have the exact same names.
   *
   * @memberof SearchModel
   */
  propertyNamesAreTheSame(propertyNamesOne, propertyNamesTwo) {
    let someDifference = propertyNamesOne.some((value, index) => {
      return value !== propertyNamesTwo[index];
    });

    return !someDifference;
  }

  /**
   * Private help method that checks if two arrays of property values are the same. The reason
   * for this is to check if the property values diverges. If the do, the objects can not be
   * the same.
   * @param {Array<string>} propertyValuesOne An array of object one's property values.
   * @param {Array<string>} propertyValuesTwo An array of object two's property values.
   */
  propertyValuesAreTheSame(propertyValuesOne, propertyValuesTwo) {
    let someDifference = propertyValuesOne.some((value, index) => {
      return value !== propertyValuesTwo[index];
    });

    return !someDifference;
  }

  /**
   * Private method that
   * @param {Object} featureCollection The feature collection with wrong display formats for some attributes.
   * @param {Object} attributesToDisplay Settings with which attributes that should be displayed in a certain manner.
   *
   * @memberof SearchModel
   */
  updateDisplayFormat(featureCollection, attributesToDisplay) {
    let columnsToChangeDisplayFormat =
      this.getColumsToChangeDisplayFormatFor(attributesToDisplay);

    let adjustedFeatureCollection = this.changeDisplayFormat(
      featureCollection,
      columnsToChangeDisplayFormat
    );
    return adjustedFeatureCollection;
  }

  /**
   * Private help method that finds which columns that should be modified.
   * @param {Object} attributesToDisplay
   *
   * @memberof SearchModel
   */
  getColumsToChangeDisplayFormatFor(attributesToDisplay) {
    let columnsToChangeDisplayFormat = attributesToDisplay.filter(
      (attribute) => {
        let attributeProperties = Object.keys(attribute);
        if (attributeProperties.includes("displayFormat")) return true;
        return false;
      }
    );

    return columnsToChangeDisplayFormat;
  }

  /**
   * Private help method that updates the value of specific columns according to the new display format.
   * @param {Object} featureCollection The feature collection with wrong display formats for some attributes.
   * @param {Object} columnsDisplayFormat Settings with which attributes that should be displayed in a certain manner.
   *
   * @memberof SearchModel
   */
  changeDisplayFormat(featureCollection, columnsDisplayFormat) {
    if (featureCollection.features.length === 0) return featureCollection;

    let formatChangeNames = this.filterColumnsDisplayFormat(
      featureCollection,
      columnsDisplayFormat
    );

    featureCollection.features.forEach((feature) => {
      formatChangeNames.forEach((formatChangeName) => {
        feature.properties[formatChangeName.key] = this.formatDate(
          feature.properties[formatChangeName.key],
          formatChangeName.displayFormat
        );
      });
    });

    return featureCollection;
  }

  /**
   * Private help method that filters all columns that can be found in the feature collection.
   * @param {Object} featureCollection The feature collection with wrong display formats for some attributes.
   * @param {Object} columnsDisplayFormat Settings with which attributes that should be displayed in a certain manner.
   *
   * @memberof SearchModel
   */
  filterColumnsDisplayFormat(featureCollection, columnsDisplayFormat) {
    let firstFeature = featureCollection.features[0];
    const properties = firstFeature.properties
      ? firstFeature.properties
      : firstFeature.getProperties();
    let featurePropertyNames = Object.keys(properties);
    let formatChangeNames = columnsDisplayFormat.filter(
      (attributesToDisplayFormat) => {
        for (
          let indexPropertyName = 0;
          indexPropertyName < featurePropertyNames.length;
          indexPropertyName++
        )
          if (
            featurePropertyNames[indexPropertyName] ===
            attributesToDisplayFormat.key
          )
            return true;
        return false;
      }
    );

    return formatChangeNames;
  }

  /**
   * Format the date from the current format of YYYY-MM-DDThh:mm:ssZ to a dateFormat.
   * @param {String} originalDate The date.
   * @param {String} dateFormat The date format.
   *
   * @memberof SearchModel
   */
  formatDate(originalDate, dateFormat) {
    const year = originalDate.substring(0, 4);
    const month = originalDate.substring(5, 7);
    const day = originalDate.substring(8, 10);
    const hours = originalDate.substring(11, 13);
    const minutes = originalDate.substring(14, 16);
    const seconds = originalDate.substring(17, 19);

    let dateParts = dateFormat.split(/[^A-Za-z]/);
    let dateSeparators = dateFormat.split(/[A-Za-z]/);
    dateSeparators = dateSeparators.filter((x) => x);
    let pointCounter = 0;
    let currentDateSeparator = dateSeparators.shift();
    let newDate = "";
    let answerDatePart;
    dateParts.forEach((datePart) => {
      answerDatePart = this.addDatePart(
        newDate,
        originalDate,
        datePart,
        "YYYY",
        year,
        currentDateSeparator,
        pointCounter
      );
      if (answerDatePart.dateUpdated) {
        newDate = answerDatePart.newDate;
        pointCounter = answerDatePart.pointCounter;
        if (answerDatePart.addedSeparator)
          currentDateSeparator = dateSeparators.shift();
      }

      answerDatePart = this.addDatePart(
        newDate,
        originalDate,
        datePart,
        "YY",
        year,
        currentDateSeparator,
        pointCounter
      );
      if (answerDatePart.dateUpdated) {
        newDate = answerDatePart.newDate;
        pointCounter = answerDatePart.pointCounter;
        if (answerDatePart.addedSeparator)
          currentDateSeparator = dateSeparators.shift();
      }

      answerDatePart = this.addDatePart(
        newDate,
        originalDate,
        datePart,
        "MM",
        month,
        currentDateSeparator,
        pointCounter
      );
      if (answerDatePart.dateUpdated) {
        newDate = answerDatePart.newDate;
        pointCounter = answerDatePart.pointCounter;
        if (answerDatePart.addedSeparator)
          currentDateSeparator = dateSeparators.shift();
      }

      answerDatePart = this.addDatePart(
        newDate,
        originalDate,
        datePart,
        "DD",
        day,
        currentDateSeparator,
        pointCounter
      );
      if (answerDatePart.dateUpdated) {
        newDate = answerDatePart.newDate;
        pointCounter = answerDatePart.pointCounter;
        if (answerDatePart.addedSeparator)
          currentDateSeparator = dateSeparators.shift();
      }

      answerDatePart = this.addDatePart(
        newDate,
        originalDate,
        datePart,
        "hh",
        hours,
        currentDateSeparator,
        pointCounter
      );
      if (answerDatePart.dateUpdated) {
        newDate = answerDatePart.newDate;
        pointCounter = answerDatePart.pointCounter;
        if (answerDatePart.addedSeparator)
          currentDateSeparator = dateSeparators.shift();
      }

      answerDatePart = this.addDatePart(
        newDate,
        originalDate,
        datePart,
        "mm",
        minutes,
        currentDateSeparator,
        pointCounter
      );
      if (answerDatePart.dateUpdated) {
        newDate = answerDatePart.newDate;
        pointCounter = answerDatePart.pointCounter;
        if (answerDatePart.addedSeparator)
          currentDateSeparator = dateSeparators.shift();
      }

      answerDatePart = this.addDatePart(
        newDate,
        originalDate,
        datePart,
        "ss",
        seconds,
        currentDateSeparator,
        pointCounter
      );
      if (answerDatePart.dateUpdated) {
        newDate = answerDatePart.newDate;
        pointCounter = answerDatePart.pointCounter;
        if (answerDatePart.addedSeparator)
          currentDateSeparator = dateSeparators.shift();
      }
    });

    return newDate;
  }

  /**
   * Private help method that adds a part to the new date.
   * @param {string} newDate The new date that we wants to build up.
   * @param {string} originalDate The original date.
   * @param {string} datePart The current part we are investigating.
   * @param {string} dateFormat The current date format we are comparing towards.
   * @param {string} dateValue The current date value that matches the format.
   * @param {string} currentDateSeparator The current date separator.
   * @param {int} pointCounter The current pointer in the date format.
   *
   * @memberof SearchModel
   */
  addDatePart(
    newDate,
    originalDate,
    datePart,
    dateFormat,
    dateValue,
    currentDateSeparator,
    pointCounter
  ) {
    let dateUpdated = false;
    let addedSeparator = false;
    if (datePart === dateFormat) {
      dateUpdated = true;
      newDate =
        dateValue.length > dateFormat.length
          ? newDate + (dateValue % 1000)
          : newDate + dateValue;
      pointCounter = pointCounter + dateValue.length;
      if (
        originalDate.substring(pointCounter, pointCounter + 1).match(/[^0-9]/)
      ) {
        addedSeparator = true;
        newDate = currentDateSeparator
          ? newDate + currentDateSeparator
          : newDate;
        pointCounter = pointCounter + currentDateSeparator?.length;
      }
    }

    return {
      dateUpdated: dateUpdated,
      newDate: newDate,
      pointCounter: pointCounter,
      addedSeparator: addedSeparator,
    };
  }

  /**
   * Private method that swaps all coordinates in a WKT polygon so that Sql Server can read them correctly. Otherwise will
   * the N- and E-coordinates be swapped.
   * @param {string} polygonAsWkt The polygon as a WKT.
   * @returns {string} A polygon adapted for Sql Server.
   *
   * @memberof SearchModel
   */
  swapWktCoordinatesForSqlServer = (polygonAsWkt) => {
    let { updatedWkt, remainingWkt } =
      this.removePolygonStartOfWkt(polygonAsWkt);
    updatedWkt = this.swapCoordinates(updatedWkt, remainingWkt).updatedWkt;
    updatedWkt = this.addEndOfPolygonWkt(updatedWkt);

    return updatedWkt;
  };

  /**
   * Private help method that removes the start of the WKT polygon.
   * @param {string} polygonAsWkt A polygon as a WKT.
   * @returns {string} A WKT polygon with all coordinates swapped.
   *
   * @memberof SearchModel
   */
  removePolygonStartOfWkt = (polygonAsWkt) => {
    let updatedWkt = "";
    const removeWktTypeText = "POLYGON((";
    const indexOfRemoveText = polygonAsWkt.indexOf(removeWktTypeText);
    updatedWkt = polygonAsWkt.substring(
      0,
      indexOfRemoveText + removeWktTypeText.length
    );
    polygonAsWkt = polygonAsWkt.substring(removeWktTypeText.length);

    const returnObject = {
      updatedWkt: updatedWkt,
      remainingWkt: polygonAsWkt,
    };

    return returnObject;
  };

  /**
   * Private help method that adds the ending, i.e. two right parentheses of a WKT polygon.
   * @param {string} polygonAsWktWithoutEnding A correct WKT polygon excepts the ending.
   * @returns {string} A correct WKT polygon.
   *
   * @memberof SearchModel
   */
  addEndOfPolygonWkt = (polygonAsWktWithoutEnding) => {
    return polygonAsWktWithoutEnding + "))";
  };

  /**
   * Private help method that swaps the position of the all coordinates in the WKT.
   * @param {string} updatedWkt The so far updated wkt.
   * @param {string} remainingWkt The remaining wkt text to be handled.
   * @returns {Object<string, string>} Returns hte updated and remaining WKT.
   *
   * @memberof SearchModel
   */
  swapCoordinates = (updatedWkt, remainingWkt) => {
    let continueToLoopIfCommaCharacter = true;
    while (continueToLoopIfCommaCharacter) {
      const partlySwappedCoordinates = this.swapCoordinatePart(
        updatedWkt,
        remainingWkt
      );
      updatedWkt = partlySwappedCoordinates.updatedWkt;
      remainingWkt = partlySwappedCoordinates.remainingWkt;

      if (remainingWkt.indexOf(",") === -1)
        continueToLoopIfCommaCharacter = false;
    }

    const fullySwappedCoordinates = this.swapCoordinatePart(
      updatedWkt,
      remainingWkt
    );
    updatedWkt = fullySwappedCoordinates.updatedWkt;
    remainingWkt = fullySwappedCoordinates.remainingWkt;

    const returnObject = {
      updatedWkt: updatedWkt,
      remainingWkt: remainingWkt,
    };

    return returnObject;
  };

  /**
   * Private help method that swaps the position of the northing and easting coordinate.
   * @param {string} updatedWkt The so far updated wkt.
   * @param {string} remainingWkt The remaining wkt text to be handled.
   * @returns {Object<string, string>} Returns hte updated and remaining WKT.
   *
   * @memberof SearchModel
   */
  swapCoordinatePart = (updatedWkt, remainingWkt) => {
    let lastCoordinateSignIsCommaCharacter = true;
    let indexOfCoordinateEnd = remainingWkt.indexOf(",");
    if (indexOfCoordinateEnd === -1) {
      indexOfCoordinateEnd = remainingWkt.indexOf(")");
      lastCoordinateSignIsCommaCharacter = false;
    }
    const coordinates = remainingWkt
      .substring(0, indexOfCoordinateEnd)
      .split(" ");
    const northing = coordinates[0];
    const easting = coordinates[1];

    updatedWkt = updatedWkt + `${easting} ${northing}`;
    if (lastCoordinateSignIsCommaCharacter) updatedWkt = updatedWkt + ",";
    remainingWkt = remainingWkt.substring(indexOfCoordinateEnd + 1);

    const returnObject = {
      updatedWkt: updatedWkt,
      remainingWkt: remainingWkt,
    };

    return returnObject;
  };

  /**
   * Autocomplete function that gets the line numbers that match a search text.
   * @param {string} searchText The search text for a line number or public line number.
   * @returns {Array(string)} Returns an array of matching line numbers or public line numbers.
   *
   * @memberof SearchModel
   */
  autocompleteLineNumbers(searchText) {
    // If the search is empty no result will be found.
    if (!searchText) return null;

    // Build up the url with cql.
    let url = this.geoServer.lineNumberAndPublicLineNumbers.url;
    let cql = "&CQL_FILTER=";
    cql = cql + `LineNumber like '${searchText}%'`;
    cql = this.encodeCqlForGeoServer(cql);
    url = url + cql;
    url = this.encodeUrlForGeoServer(url);

    return fetch(url)
      .then((res) => {
        return res.json().then((jsonResult) => {
          let lineNumber = jsonResult.features.map((feature) => {
            return feature.properties.LineNumber;
          });

          console.log(lineNumber);
          return lineNumber;
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  /**
   * Autocomplete function that gets the public line numbers that match a search text.
   * @param {string} searchText The search text for a line number or public line number.
   * @returns {Array(string)} Returns an array of matching line numbers or public line numbers.
   *
   * @memberof SearchModel
   */
  autocompletePublicLineNumbers(searchText) {
    // If the search is empty no result will be found.
    if (!searchText) return null;

    // Build up the url with cql.
    let url = this.geoServer.lineNumberAndPublicLineNumbers.url;
    let cql = "&CQL_FILTER=";
    cql = cql + `PublicLineNumber like '${searchText}%'`;
    cql = this.encodeCqlForGeoServer(cql);
    url = url + cql;
    url = this.encodeUrlForGeoServer(url);

    return fetch(url)
      .then((res) => {
        return res.json().then((jsonResult) => {
          let publicLineNumber = jsonResult.features.map((feature) => {
            return feature.properties.PublicLineNumber;
          });

          console.log(publicLineNumber);
          return publicLineNumber;
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  /**
   * Autocomplete function that gets the stop area names that match a search text.
   * @param {string} searchText The search text for a line number or public line number.
   * @returns {array(string)} Returns an array of matching line numbers or public line numbers.
   *
   * @memberof SearchModel
   */
  autocompleteStopAreaNamesOrNumbers(searchText) {
    // If the search is empty no result will be found.
    if (!searchText) return null;

    // Build up the url with cql.
    let url = this.geoServer.stopAreaNameAndNumbers.url;
    let cql = "&CQL_FILTER=";

    const isStopAreaNumber = this.containsOnlyNumbers(searchText);
    if (searchText) {
      if (isStopAreaNumber) cql = cql + `Number like '${searchText}%'`;
      else cql = cql + `Name like '${searchText}%'`;
    }

    // Fix percent and so on, so that the CQL filters are GeoServer valid.
    if (searchText) cql = this.encodeCqlForGeoServer(cql);
    url = url + cql;
    url = this.encodeUrlForGeoServer(url);

    return fetch(url)
      .then((res) => {
        return res.json().then((jsonResult) => {
          let stopAreaNameOrNumber = jsonResult.features.map((feature) => {
            if (isStopAreaNumber) return feature.properties.Number;

            return feature.properties.Name;
          });

          if (isStopAreaNumber) {
            stopAreaNameOrNumber = stopAreaNameOrNumber.sort((a, b) => a - b);
          } else {
            stopAreaNameOrNumber = stopAreaNameOrNumber.sort(function (a, b) {
              return a.localeCompare(b);
            });
          }

          console.log(stopAreaNameOrNumber);
          return stopAreaNameOrNumber;
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  /**
   * Function that fetch all municipality names sorted in alphabetic order array.
   * @param {boolean} addEmptyMunicipality <option value="true">Adds an empty municipality at the beginning of the array. </option>
   * @returns {Array<string>} Returns all municipality names sorted in alphabetic order.
   *
   * @memberof SearchModel
   */
  fetchAllPossibleMunicipalityZoneNames(addEmptyMunicipality = true) {
    if (!this?.geoServer?.municipalityZoneNames?.url)
      return this.#returnMockDataMunicipalityZoneNames();

    const url = this.geoServer.municipalityZoneNames.url;
    return fetch(url)
      .then((res) => {
        return res.json().then((jsonResult) => {
          let municipalityNames = jsonResult.features.map((feature) => {
            return {
              name: feature.properties.Name,
              gid: feature.properties.Gid,
            };
          });

          municipalityNames = municipalityNames.sort(function (a, b) {
            return a.name.localeCompare(b.name);
          });

          if (addEmptyMunicipality)
            municipalityNames.unshift({ name: "", gid: null });

          return municipalityNames;
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  #returnMockDataMunicipalityZoneNames = () => {
    return new Promise((resolve) => {
      resolve(MockdataSearchModel().municipalities);
    });
  };
  /**
   * Function that fetch all transport mode type names and numbers.
   * @param {boolean} addEmptyMunicipality <option value="true">Adds an empty transport mode at the beginning of the array. </option>
   * @returns {array(string, int)} Returns all mode type names as an array of tuples.
   *
   * @memberof SearchModel
   */
  fetchAllPossibleTransportModeTypeNames(addEmptyTransportMode = true) {
    if (!this?.geoServer?.transportModeTypeNames?.url)
      return this.#returnMockDataTransportModeTypeNames();

    this.localObserver.publish("vt-transportModeTypeNames-result-begin", {
      label: this.geoServer.transportModeTypeNames.searchLabel,
    });

    const url = this.geoServer.transportModeTypeNames.url;
    return fetch(url).then((res) => {
      return res.json().then((jsonResult) => {
        let transportModeTypes = jsonResult.features.map((feature) => {
          return feature.properties.Name;
        });

        if (addEmptyTransportMode) transportModeTypes.unshift("");

        return transportModeTypes;
      });
    });
  }

  #returnMockDataTransportModeTypeNames = () => {
    return new Promise((resolve) => {
      resolve(MockdataSearchModel().modeTypeNames);
    });
  };

  /**
   * Gets requested journeys. Sends an event when the function is called and another one when it's promise is done.
   * @param {string} fromTime Start time, pass null if no start time is given.
   * @param {string} endTime End time, pass null of no end time is given.
   * @param {string} filterOnWkt A polygon as a WKT, pass null of no polygon is given.
   *
   * @memberof SearchModel
   */
  getJourneys(filterOnFromDate, filterOnToDate, filterOnWkt) {
    this.localObserver.publish("vt-result-begin", {
      label: this.geoServer.journeys.searchLabel,
    });

    // Fix parentheses and so on, so that the WKT are GeoServer valid.
    if (filterOnWkt) filterOnWkt = this.encodeWktForGeoServer(filterOnWkt);

    // Build up the url with viewparams.
    let url = this.geoServer.journeys.url;
    let viewParams = "&viewparams=";
    if (filterOnFromDate)
      viewParams = viewParams + `filterOnFromDate:${filterOnFromDate};`;
    if (filterOnToDate)
      viewParams = viewParams + `filterOnToDate:${filterOnToDate};`;
    if (filterOnWkt) viewParams = viewParams + `filterOnWkt:${filterOnWkt};`;
    if (filterOnFromDate || filterOnToDate || filterOnWkt)
      url = url + viewParams;
    url = this.encodeUrlForGeoServer(url);

    fetch(url)
      .then((res) => {
        res.json().then((jsonResult) => {
          let journeys = {
            featureCollection: jsonResult,
            label: this.geoServer.journeys.searchLabel,
            type: "journeys",
          };

          journeys.featureCollection = this.removeUnnecessaryAttributes(
            journeys.featureCollection,
            this.attributesToKeepFromSettings(
              this.geoServer.journeys.attributesToDisplay
            )
          );
          journeys.featureCollection = this.removeDuplicates(
            journeys.featureCollection
          );
          /*journeys.featureCollection = */
          this.updateDisplayFormat(
            journeys.featureCollection,
            this.geoServer.journeys.attributesToDisplay
          );

          this.localObserver.publish("vt-result-done", journeys);
        });
      })
      .catch((err) => {
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
    this.localObserver.publish("vt-result-begin", {
      label: this.geoServer.routes.searchLabel,
    });

    if (polygonAsWkt)
      polygonAsWkt = this.swapWktCoordinatesForSqlServer(polygonAsWkt);

    // Build up the url with viewparams.
    let url = this.geoServer.routes.url;
    let cql = "&CQL_FILTER=";
    let addAndInCql = false;
    if (publicLineName) {
      cql = cql + `PublicLineName like '${publicLineName}'`;
      addAndInCql = true;
    }
    if (internalLineNumber) {
      if (addAndInCql) cql = cql + " AND ";
      cql = cql + `InternalLineNumber like '${internalLineNumber}'`;
      addAndInCql = true;
    }
    if (isInMunicipalityZoneGid) {
      if (addAndInCql) cql = cql + " AND ";
      cql = cql + `IsInMunicipalityZoneGid like '${isInMunicipalityZoneGid}'`;
      addAndInCql = true;
    }
    if (transportModeType) {
      if (addAndInCql) cql = cql + " AND ";
      cql = cql + `TransportModeType like '${transportModeType}'`;
      addAndInCql = true;
    }
    if (stopAreaNameOrNumber) {
      if (addAndInCql) cql = cql + " AND ";
      if (this.containsOnlyNumbers(stopAreaNameOrNumber))
        cql = cql + `StopAreaNumber like '${stopAreaNameOrNumber}'`;
      else
        cql =
          cql +
          this.encodePercentForUrl(
            `StopAreaName like '%${stopAreaNameOrNumber}%'`
          );
      addAndInCql = true;
    }
    if (polygonAsWkt) {
      if (addAndInCql) cql = cql + " AND ";
      polygonAsWkt = this.encodeWktInCqlForGeoServer(polygonAsWkt);

      cql = cql + `INTERSECTS(Geom, ${polygonAsWkt})`;
      addAndInCql = true;
    }
    if (
      publicLineName ||
      internalLineNumber ||
      isInMunicipalityZoneGid ||
      transportModeType ||
      stopAreaNameOrNumber ||
      polygonAsWkt
    ) {
      url = url + this.encodeCqlForGeoServer(cql);
    }
    url = this.encodeUrlForGeoServer(url);

    fetch(url)
      .then((res) => {
        res.json().then((jsonResult) => {
          const routes = {
            featureCollection: jsonResult,
            label: this.geoServer.routes.searchLabel,
            type: "routes",
          };

          routes.featureCollection = this.removeUnnecessaryAttributes(
            routes.featureCollection,
            this.attributesToKeepFromSettings(
              this.geoServer.routes.attributesToDisplay
            )
          );
          routes.featureCollection = this.removeDuplicates(
            routes.featureCollection
          );

          this.localObserver.publish("vt-result-done", routes);
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  /**
   * Get all stop areas. Sends an event when the function is called and another one when it's promise is done.
   * @param {string} filterOnNameOrNumber The public name or the number of the stop point, pass null of no name is given.
   * @param {string} filterOnPublicLine The public line number, pass null of no line is given.
   * @param {string} filterOnMunicipalGid The municipality gid corresponding to the name, pass null of no municipality gid is given.
   * @param {string} filterOnWkt A polygon as a WKT, pass null of no polygon is given.
   *
   * @memberof SearchModel
   */
  getStopAreas(
    filterOnNameOrNumber,
    filterOnPublicLine,
    filterOnMunicipalGid,
    filterOnWkt
  ) {
    this.localObserver.publish("vt-result-begin", {
      label: this.geoServer.stopAreas.searchLabel,
    });

    // Fix parentheses and so on, so that the WKT are GeoServer valid.
    if (filterOnWkt) filterOnWkt = this.encodeWktForGeoServer(filterOnWkt);

    // Build up the url with viewparams.
    let url = this.geoServer.stopAreas.url;
    let viewParams = "&viewparams=";
    if (filterOnNameOrNumber) {
      if (this.containsOnlyNumbers(filterOnNameOrNumber))
        viewParams = viewParams + `filterOnNumber:${filterOnNameOrNumber};`;
      else viewParams = viewParams + `filterOnName:${filterOnNameOrNumber};`;
    }
    if (filterOnPublicLine)
      viewParams = viewParams + `filterOnPublicLine:${filterOnPublicLine};`;
    if (filterOnMunicipalGid)
      viewParams = viewParams + `filterOnMunicipalGid:${filterOnMunicipalGid};`;
    if (filterOnWkt) viewParams = viewParams + `filterOnWkt:${filterOnWkt};`;

    if (
      filterOnNameOrNumber ||
      filterOnPublicLine ||
      filterOnMunicipalGid ||
      filterOnWkt
    )
      url = url + viewParams;
    url = this.encodeUrlForGeoServer(url);

    fetch(url).then((res) => {
      res
        .json()
        .then((jsonResult) => {
          let stopAreas = {
            featureCollection: jsonResult,
            label: this.geoServer.stopAreas.searchLabel,
            type: "stopAreas",
          };

          stopAreas.featureCollection = this.removeUnnecessaryAttributes(
            stopAreas.featureCollection,
            this.attributesToKeepFromSettings(
              this.geoServer.stopAreas.attributesToDisplay
            )
          );
          stopAreas.featureCollection = this.removeDuplicates(
            stopAreas.featureCollection
          );

          this.localObserver.publish("vt-result-done", stopAreas);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }

  /**
   * Get all stop points. Sends an event when the function is called and another one when it's promise is done.
   * @param {string} filterOnNameOrNumber The public name or the number of the stop point, pass null of no name is given.
   * @param {string} filterOnPublicLine The public line number, pass null of no line is given.
   * @param {string} filterOnMunicipalGid The municipality gid corresponding to the name, pass null of no municipality gid is given.
   * @param {string} filterOnNumber The number of the stop point, pass null of no number is given.
   *
   * @memberof SearchModel
   */
  getStopPoints(
    filterOnNameOrNumber,
    filterOnPublicLine,
    filterOnMunicipalGid,
    filterOnWkt
  ) {
    this.localObserver.publish("vt-result-begin", {
      label: this.geoServer.stopPoints.searchLabel,
    });

    // Fix parentheses and so on, so that the WKT are GeoServer valid.
    if (filterOnWkt) filterOnWkt = this.encodeWktForGeoServer(filterOnWkt);

    // Build up the url with viewparams.
    let url = this.geoServer.stopPoints.url;
    let viewParams = "&viewparams=";
    if (filterOnNameOrNumber) {
      if (this.containsOnlyNumbers(filterOnNameOrNumber))
        viewParams = viewParams + `filterOnNumber:${filterOnNameOrNumber};`;
      else viewParams = viewParams + `filterOnName:${filterOnNameOrNumber};`;
    }
    if (filterOnPublicLine)
      viewParams = viewParams + `filterOnPublicLine:${filterOnPublicLine};`;
    if (filterOnMunicipalGid)
      viewParams = viewParams + `filterOnMunicipalGid:${filterOnMunicipalGid};`;
    if (filterOnWkt) viewParams = viewParams + `filterOnWkt:${filterOnWkt};`;

    if (
      filterOnNameOrNumber ||
      filterOnPublicLine ||
      filterOnMunicipalGid ||
      filterOnWkt
    )
      url = url + viewParams;
    url = this.encodeUrlForGeoServer(url);

    fetch(url).then((res) => {
      res
        .json()
        .then((jsonResult) => {
          let stopPoints = {
            featureCollection: jsonResult,
            label: this.geoServer.stopPoints.searchLabel,
            type: "stopPoints",
          };

          stopPoints.featureCollection = this.removeUnnecessaryAttributes(
            stopPoints.featureCollection,
            this.attributesToKeepFromSettings(
              this.geoServer.stopPoints.attributesToDisplay
            )
          );
          stopPoints.featureCollection = this.removeDuplicates(
            stopPoints.featureCollection
          );

          this.localObserver.publish("vt-result-done", stopPoints);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }

  /**
   * Get all stop points. Sends an event when the function is called and another one when it's promise is done.
   * @param {int} filterOnInternalLineNumber The internal number of the stop point, pass null of no number is given.
   * @param {int} filterOnDirection The direction of line, pass null of no direction is given.
   *
   * @memberof SearchModel
   */
  getStopPointsByLine(filterOnInternalLineNumber, filterOnDirection) {
    // Build up the url with viewparams.
    let url = this.geoServer.ShowStopPoints.url;
    let viewParams = "&viewparams=";
    if (filterOnInternalLineNumber) {
      viewParams =
        viewParams + `filterOnLineNumber:${filterOnInternalLineNumber};`;
    }
    if (filterOnDirection) {
      viewParams = viewParams + `filterOnDirection:${filterOnDirection};`;
    }

    if (filterOnInternalLineNumber || filterOnDirection) url = url + viewParams;
    url = this.encodeUrlForGeoServer(url);

    fetch(url).then((res) => {
      res
        .json()
        .then((jsonResult) => {
          let stopPoints = {
            featureCollection: jsonResult,
          };
          this.localObserver.publish("vt-stop-point-showed", stopPoints);
        })
        .catch((err) => {
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
