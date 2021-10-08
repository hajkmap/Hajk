import { GeoJSON, WFS } from "ol/format";
import {
  and as andFilter,
  or as orFilter,
  equalTo as equalToFilter,
  like as likeFilter,
  intersects as intersectsFilter,
} from "ol/format/filter";
import { hfetch } from "utils/FetchWrapper";

class FirWfsService {
  constructor(defaultOptions) {
    this.params = defaultOptions;

    this.searchTypeHash = {
      id: {
        featureType: "feature:fastighet_yta_alla_wms",
        url: "https://kommungis-utv3.varberg.se/util/geoserver/sbk_fk_v1/wfs",
        searchProp: "fnr",
      },
      designation: {
        featureType: "feature:fastighet_yta_alla_wms",
        url: "https://kommungis-utv3.varberg.se/util/geoserver/sbk_fk_v1/wfs",
        searchProp: "fastbet",
      },
      owner: {
        featureType: "feature:fastighet_agare_vw",
        url: "https://kommungis-utv3.varberg.se/util/geoserver/sbk_fk_v1/wfs",
        searchProp: "namn",
      },
      address: {
        featureType: "feature:fastighet_adress",
        url: "https://wms-utv.varberg.se/geoserver/ext_lm_v1/wfs",
        searchProp: "adress",
      },
    };
  }

  getGeometryFilters(features) {
    let filters = [];
    features.forEach((feature) => {
      filters.push(intersectsFilter("geom", feature.getGeometry()));
    });

    return filters.length === 0 ? null : filters;
  }

  _getFiltersForStringAndGeometrySearch(type, params) {
    let rootFilter = null;
    let geometryFilters = null;
    let stringFilter = null;

    if (params.features.length > 0) {
      geometryFilters = this.getGeometryFilters(params.features);
    }

    if (geometryFilters && geometryFilters.length >= 2) {
      // wrap when more than 1
      geometryFilters = orFilter(...geometryFilters);
    } else if (geometryFilters && geometryFilters.length === 1) {
      geometryFilters = geometryFilters[0];
    }

    if (params.text.trim() !== "") {
      if (!params.exactMatch) {
        params.text += "*";
      }
      stringFilter = likeFilter(
        type.searchProp,
        params.text,
        "*",
        ".",
        "!",
        false
      );
    }

    if (stringFilter && !geometryFilters) {
      rootFilter = stringFilter;
    } else if (geometryFilters && !stringFilter) {
      rootFilter = geometryFilters;
    } else if (stringFilter && geometryFilters) {
      rootFilter = andFilter(stringFilter, geometryFilters);
    }

    return rootFilter;
  }

  _getFiltersForDesignations(type, params) {
    let rootFilter = null;
    let designations = params.designations || [];

    if (designations.length === 1) {
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

    return rootFilter;
  }

  getFeatureRequestObject(type, params) {
    let rootFilter = null;
    const designations = params.designations || [];

    if (designations.length === 0) {
      // zero designations
      rootFilter = this._getFiltersForStringAndGeometrySearch(type, params);
    } else if (designations.length >= 1) {
      rootFilter = this._getFiltersForDesignations(type, params);
    }

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
    // console.log(featureRequestObject);
    const featureRequest = new WFS().writeGetFeature(featureRequestObject);

    return new XMLSerializer().serializeToString(featureRequest);
  }

  nestedSearch(data, params, resolve, reject) {
    let ids = [];
    data.features.forEach((feature) => {
      let id = feature.properties.fnr || feature.properties.nyckel;
      if (!ids.includes(id)) {
        ids.push(id);
      }
    });

    let p = { ...params };
    p.searchType = "id";
    p.designations = ids;

    const requestXml = this.getRequestXml(p);
    const type = this.searchTypeHash[p.searchType];

    hfetch(type.url, {
      method: "POST",
      body: requestXml,
    })
      .then((response) => {
        return response ? response.json() : null;
      })
      .then((data) => {
        try {
          // handle parser error
          resolve(new GeoJSON().readFeatures(data));
        } catch (err) {
          reject(err);
        }
      })
      .catch((err) => {
        reject(err);
      });
  }

  search(params) {
    let _params = { ...this.params, ...params };

    if (_params.text.trim() === "" && _params.features.length === 0) {
      // nothing to search for..
      return Promise.resolve(null);
    }

    // console.log("Will search with params:", _params);

    let type = this.searchTypeHash[_params.searchType];

    const requestXml = this.getRequestXml(_params);

    return new Promise((resolve, reject) => {
      hfetch(type.url, {
        method: "POST",
        body: requestXml,
      })
        .then((response) => {
          return response ? response.json() : null;
        })
        .then((data) => {
          if (
            type === this.searchTypeHash.designation ||
            data.features?.length === 0
          ) {
            try {
              // handle parser error
              resolve(new GeoJSON().readFeatures(data));
            } catch (err) {
              reject(err);
            }
          } else {
            // searching by owner or address needs 2 separate requests...
            this.nestedSearch(data, _params, resolve, reject);
          }
        })
        .catch((err) => {
          reject(err);
        });
    });
  }
}

export default FirWfsService;
