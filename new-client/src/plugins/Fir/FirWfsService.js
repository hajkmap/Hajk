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
        intersectsFilter(params.searchType.geometryField, feature.getGeometry())
      );
    });

    return filters.length === 0 ? null : filters;
  }

  _getFiltersForStringAndGeometrySearch(params) {
    let rootFilter = null;
    let geometryFilters = null;
    let stringFilter = null;

    if (params.features.length > 0) {
      geometryFilters = this.getGeometryFilters(params.features, params);
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
        params.searchType.searchProp,
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

  _getFiltersForDesignations(params) {
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
      rootFilter = this._getFiltersForStringAndGeometrySearch(params);
    } else if (designations.length >= 1) {
      rootFilter = this._getFiltersForDesignations(params);
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
    // Search by FNR

    let ids = [];
    data.features.forEach((feature) => {
      let id = feature.properties[params.searchType.idField];
      if (!ids.includes(id)) {
        ids.push(id);
      }
    });

    let p = { ...params };
    p.searchType = this.getBaseSearchType();
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

  getBaseSearchType = () => {
    return this.model.getSearchTypeById(
      this.model.config.wfsRealEstateLayer.id
    );
  };

  search(params) {
    let _params = { ...this.params, ...params };

    if (_params.text.trim() === "" && _params.features.length === 0) {
      // nothing to search for..
      return Promise.resolve(null);
    }

    let baseSearchType = this.getBaseSearchType();

    let searchType = this.model.getSearchTypeById(_params.searchTypeId);
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
