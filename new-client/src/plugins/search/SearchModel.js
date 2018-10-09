import { WFS } from "ol/format";
import IsLike from "ol/format/filter/IsLike";
import Intersects from "ol/format/filter/Intersects";
import { arraySort } from "./../../utils/ArraySort.js";

class SearchModel {
  constructor(settings, map) {
    this.options = settings;
    this.olMap = map;
    this.wfsParser = new WFS();
  }

  searchWithinArea(settings) {
    console.log("Search within area", settings);

    const projCode = this.olMap
      .getView()
      .getProjection()
      .getCode();

    var source = this.options.sources[1];
    var geom = settings.feature.getGeometry();

    const options = {
      featureTypes: source.layers,
      srsName: projCode,
      outputFormat: "JSON", //source.outputFormat,
      geometryName: source.geometryField,
      filter: new Intersects(
        "geom", // geometryName
        geom, // geometry
        projCode // projCode
      )
    };

    const node = this.wfsParser.writeGetFeature(options);
    const xmlSerializer = new XMLSerializer();
    const xmlString = xmlSerializer.serializeToString(node);

    const request = {
      method: "POST",
      headers: {
        "Content-Type": "text/xml"
      },
      body: xmlString
    };

    fetch(source.url, request).then(response => {
      response.json().then(data => {
        console.log(data);
      });
    });
  }

  lookup(source, searchInput) {
    const projCode = this.olMap
      .getView()
      .getProjection()
      .getCode();

    const options = {
      featureTypes: source.layers,
      srsName: projCode,
      outputFormat: "JSON", //source.outputFormat,
      geometryName: source.geometryField,
      filter: new IsLike(
        source.searchFields[0],
        searchInput + "*",
        "*", // wild card
        ".", // single char
        "!", // escape char
        false // match case
      )
    };

    const node = this.wfsParser.writeGetFeature(options);
    const xmlSerializer = new XMLSerializer();
    const xmlString = xmlSerializer.serializeToString(node);

    const request = {
      method: "POST",
      headers: {
        "Content-Type": "text/xml"
      },
      body: xmlString
    };

    return fetch(source.url, request);
  }

  search = (searchInput, callback) => {
    if (searchInput.length > 3) {
      var promises = this.options.sources.map(source =>
        this.lookup(source, searchInput)
      );
      Promise.all(promises).then(responses => {
        Promise.all(responses.map(result => result.json())).then(
          jsonResults => {
            jsonResults.forEach((jsonResult, i) => {
              if (jsonResult.features.length > 0) {
                arraySort({
                  array: jsonResult.features,
                  index: this.options.sources[i].searchFields[0]
                });
              }
              jsonResult.source = this.options.sources[i];
            });
            if (callback) callback(jsonResults);
          }
        );
      });
    } else {
      callback(false);
    }
  };
}

export default SearchModel;
