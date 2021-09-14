import { GeoJSON, WFS } from "ol/format";
import {
  or as orFilter,
  equalTo as equalToFilter,
  like as likeFilter,
} from "ol/format/filter";
import { hfetch } from "utils/FetchWrapper";

class FirWfsService {
  constructor(defaultOptions) {
    this.params = defaultOptions;

    this.searchTypeHash = {
      // TODO: Remove hard coded value when needed
      id: {
        featureType: "feature:fastighet_yta_alla_wms",
        url: "https://kommungis-utv.varberg.se/util/geoserver/sbk_fk_v1/wfs",
        searchProp: "fnr",
      },
      designation: {
        featureType: "feature:fastighet_yta_alla_wms",
        url: "https://kommungis-utv.varberg.se/util/geoserver/sbk_fk_v1/wfs",
        searchProp: "fastbet",
      },
      owner: {
        featureType: "feature:fastighet_agare_vw",
        url: "https://kommungis-utv.varberg.se/util/geoserver/sbk_fk_v1/wfs",
        searchProp: "namn",
      },
      address: {
        featureType: "feature:fastighet_adress",
        url: "https://wms-utv.varberg.se/geoserver/ext_lm_v1/wfs",
        searchProp: "adress",
      },
    };
  }

  getFeatureRequestObject(type, params) {
    let rootFilter = null;

    let designations = params.designations || [];

    if (designations.length === 0) {
      // zero designations
      if (!params.exactMatch) {
        params.text += "*";
      }
      rootFilter = likeFilter(
        type.searchProp,
        params.text,
        "*",
        ".",
        "!",
        false
      );
    } else if (designations.length === 1) {
      // one designations
      rootFilter = equalToFilter(type.searchProp, designations[0], false);
    } else {
      let filters = [];
      // multiple designations
      designations.forEach((designation) => {
        filters.push(equalToFilter(type.searchProp, designation));
      });
      rootFilter = orFilter(...filters);
    }

    // TODO: Remove hard coded value when needed
    return {
      srsName: "EPSG:3007",
      featureNS: "https://www.opengis.net",
      outputFormat: "application/json",
      maxFeatures: "10000",
      featureTypes: [type.featureType],
      filter: rootFilter,
    };
  }

  getRequestXml(params) {
    let type = this.searchTypeHash[params.searchType];
    let featureRequestObject = this.getFeatureRequestObject(type, params);
    const featureRequest = new WFS().writeGetFeature(featureRequestObject);

    return new XMLSerializer().serializeToString(featureRequest);
  }

  secondarySearch(data, params, resolve, reject) {
    let ids = [];
    data.features.forEach((feature) => {
      let id = feature.properties.fnr || feature.properties.nyckel;
      console.log(id);
      if (!ids.includes(id)) {
        ids.push(id);
      }
    });

    let p = { ...params };
    p.searchType = "id";
    p.designations = ids;

    const requestXml = this.getRequestXml(p);

    const type = this.searchTypeHash[p.searchType];

    // TODO: Remove hard coded value when needed
    hfetch(type.url, {
      method: "POST",
      body: requestXml,
    })
      .then((response) => {
        return response ? response.json() : null;
      })
      .then((data) => {
        resolve(new GeoJSON().readFeatures(data));
      });
  }

  search(params) {
    let _params = { ...this.params, ...params };

    if (_params.text.trim() === "") {
      console.log("no text to search for");
      return Promise.resolve(null);
    }

    console.log("Will search with params:", _params);

    let type = this.searchTypeHash[_params.searchType];

    const requestXml = this.getRequestXml(_params);

    return new Promise((resolve, reject) => {
      // TODO: Remove hard coded value when needed
      hfetch(type.url, {
        method: "POST",
        body: requestXml,
      })
        .then((response) => {
          return response ? response.json() : null;
        })
        .then((data) => {
          if (type === this.searchTypeHash.designation) {
            resolve(new GeoJSON().readFeatures(data));
          } else {
            // searching by owner or address needs 2 separate requests... look into this in the future
            this.secondarySearch(data, _params, resolve, reject);
          }
        });
    });
  }
}

export default FirWfsService;
