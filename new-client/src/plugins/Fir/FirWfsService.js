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
  constructor(defaultOptions, model) {
    this.params = defaultOptions;
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

  #getFiltersForStringAndGeometrySearch(params) {
    let rootFilter = null;
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

    if (!params.exactMatch) {
      params.text += "*";
    }

    // lets handle text input, including comma separated strings.
    const stringFiltersArr = [];
    params.text.split(",").forEach((s) => {
      stringFiltersArr.push(
        likeFilter(
          params.searchType.searchProp,
          s.trim() + (!params.exactMatch ? "*" : ""),
          "*",
          ".",
          "!",
          false
        )
      );
    });

    // Escape array if 1 and wrap when more than 1
    const stringFilters =
      stringFiltersArr.length > 1
        ? orFilter(...stringFiltersArr)
        : stringFiltersArr[0];

    if (stringFiltersArr.length && !geometryFilters) {
      rootFilter = stringFilters;
    } else if (geometryFilters && stringFiltersArr.length === 0) {
      rootFilter = geometryFilters;
    } else if (stringFiltersArr.length && geometryFilters) {
      rootFilter = andFilter(stringFilters, geometryFilters);
    }

    return rootFilter;
  }

  #getFiltersForDesignations(params) {
    let rootFilter = null;
    let designations = params.designations || [];

    if (designations.length === 1) {
      // one designation
      rootFilter = equalToFilter(
        params.searchType.searchProp,
        designations[0],
        false
      );
    } else {
      let filters = [];
      // multiple designations
      designations.forEach((designation) => {
        filters.push(equalToFilter(params.searchType.searchProp, designation));
      });
      rootFilter = orFilter(...filters);
    }

    return rootFilter;
  }

  getFeatureRequestObject(params) {
    let rootFilter = null;
    const designations = params.designations || [];

    if (designations.length === 0) {
      // zero designations
      rootFilter = this.#getFiltersForStringAndGeometrySearch(params);
    } else if (designations.length >= 1) {
      rootFilter = this.#getFiltersForDesignations(params);
    }

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

  nestedSearch(data, params, resolve, reject) {
    // Search by ID

    let ids = [];
    data.features.forEach((feature) => {
      let id = feature.properties[params.searchType.idField];
      if (!ids.includes(id)) {
        ids.push(id);
      }
    });

    let p = { ...params };
    p.searchType = this.model.config.wfsRealEstateLayer;
    p.searchType.searchProp = p.searchType.idField;
    p.searchType.featureType = p.searchType.layers[0];
    p.designations = ids;
    const requestXml = this.getRequestXml(p);

    hfetch(p.searchType.url, {
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

    let baseSearchType = this.model.baseSearchType;

    let searchType = this.model.getWfsById(_params.searchTypeId);
    searchType.searchProp = searchType.searchFields[0];
    searchType.featureType = searchType.layers[0];
    const isDesignationSearch =
      searchType.searchProp === baseSearchType.searchFields[0];

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
          if (data.features?.length) {
            data.features = data.features.filter((feature) => {
              return feature.properties[_params.searchType.idField]
                ? true
                : false;
            });
          }

          if (isDesignationSearch || data.features?.length === 0) {
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
          console.warn(err);
          reject(err);
        });
    });
  }
}

export default FirWfsService;
