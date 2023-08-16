import { GeoJSON, WFS } from "ol/format";
import {
  and as andFilter,
  or as orFilter,
  equalTo as equalToFilter,
  between as betweenFilter,
  intersects as intersectsFilter,
} from "ol/format/filter";
import { hfetch } from "../../utils/FetchWrapper";

class KirWfsService {
  constructor(model) {
    this.model = model;
  }

  getGeometryFilters(features, params) {
    let filters = [];
    features.forEach((feature) => {
      filters.push(
        intersectsFilter(
          params.searchType.geometryField || "geom",
          feature.getGeometry()
        )
      );
    });

    return filters.length === 0 ? null : filters;
  }

  #getFilters(params) {
    let geometryFilters = null;

    if (params.features.length > 0) {
      geometryFilters = this.getGeometryFilters(params.features, params);
    }

    if (geometryFilters && geometryFilters.length >= 2) {
      // wrap when more than 1
      geometryFilters = orFilter(...geometryFilters);
    } else if (geometryFilters && geometryFilters.length === 1) {
      geometryFilters = geometryFilters[0];
    }

    let filters = [geometryFilters];

    let specificGender = null;

    if (params.genderMale === true && params.genderFemale === false) {
      specificGender = this.model.config.genderMale;
    } else if (params.genderFemale === true && params.genderMale === false) {
      specificGender = this.model.config.genderFemale;
    }

    if (specificGender) {
      filters.push(
        equalToFilter(this.model.config.genderField, specificGender)
      );
    }

    filters.push(
      betweenFilter(
        this.model.config.ageField,
        params.ageLower,
        params.ageUpper >= 120 ? 999 : params.ageUpper
      )
    );
    return andFilter(...filters);
  }

  getFeatureRequestObject(params) {
    let rootFilter = this.#getFilters(params);

    return {
      srsName: this.model.config.srsName,
      featureNS: "https://www.opengis.net",
      outputFormat: "application/json",
      maxFeatures: this.model.config.maxFeatures,
      featureTypes: [params.searchType.featureType],
      filter: rootFilter,
    };
  }

  getRequestXml(params) {
    let featureRequestObject = this.getFeatureRequestObject(params);
    const featureRequest = new WFS().writeGetFeature(featureRequestObject);
    return new XMLSerializer().serializeToString(featureRequest);
  }

  search(defaultParams, params) {
    let _params = { ...defaultParams, ...params };

    if (_params.features.length === 0) {
      // nothing to search for..
      return Promise.resolve(null);
    }

    let searchType = this.model.getWfsById(_params.searchTypeId);
    searchType.searchProp = searchType.searchFields[0];
    searchType.featureType = searchType.layers[0];

    _params.searchType = searchType;

    const requestXml = this.getRequestXml(_params);

    return new Promise((resolve, reject) => {
      hfetch(searchType.url, {
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
          console.warn(err);
          reject(err);
        });
    });
  }
}

export default KirWfsService;
