import Draw, { createBox } from "ol/interaction/Draw.js";
import { Fill, Stroke, Style } from "ol/style.js";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import GeoJSON from "ol/format/GeoJSON.js";

export default class FmeModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.options = settings.options;
    this.localObserver = settings.localObserver;

    this.active = false;
    this.source = new VectorSource();
    this.vector = new VectorLayer({
      layerType: "system",
      source: this.source,
      name: "drawLayer",
    });
    this.map.addLayer(this.vector);

    this.style = new Style({
      fill: new Fill({
        color: "rgba(255, 255, 255, 0.3)",
      }),
      stroke: new Stroke({
        color: "rgba(0, 0, 0, 0.5)",
        width: 3,
      }),
    });

    this.draw = null;
  }

  /**
   * Returns the global Map object.
   *
   * @returns {object} Map
   * @memberof FmeModel
   */
  getMap() {
    return this.map;
  }

  findFirstProductWithType(productType) {
    return this.options.products.find((prod) => prod.type === productType);
  }

  findProductById(productId) {
    return this.options.products.find((prod) => prod.id === productId);
  }

  findProductParamByName(params, name) {
    return params.find((param) => param.name === name);
  }

  getProductParams(productId) {
    let product = this.findProductById(productId); // Get selected product

    // TODO: Get parameters from FME Server instead of storing them in config
    let params = [];
    if (product) {
      params = product.parameters;
    }
    return params;
  }

  // Since option values may be integers we must prefix them with a string
  prefixOptionValue(optionValue) {
    return "$p$" + optionValue;
  }

  // Add property to hold current value (and set default if any)
  addValuesToParams(params, geoAttribute) {
    params.forEach((param) => {
      // TODO: Add more types that FME supports
      if (param.type === "TEXT" && !(param.name === geoAttribute)) {
        param.value = param.defaultValue;
      } else if (param.type === "LOOKUP_LISTBOX") {
        param.value = { $$$INIT$$$: true };
        param.listOptions.forEach((option) => {
          let found = param.defaultValue.find(
            (defVal) => defVal === option.value
          );
          // Prefix option.value with a letter since option.value may be a number
          param.value[this.prefixOptionValue(option.value)] = !(
            found === undefined
          );
        });
      } else if (param.type === "LOOKUP_CHOICE") {
        param.value = param.defaultValue;
      }
    });
  }

  // Retrieves parameters FME Server way
  getParamsForOrder(paramsFromForm, email, geoAttribute, maxArea) {
    let params = "opt_servicemode=async&opt_responseformat=json";
    let errMsg = "";

    // TODO: Check email format
    params = params + "&opt_requesteremail=" + email;

    let area = this.getPolygonArea();
    if (area <= 0) {
      errMsg = errMsg + "Inget område ritat i kartan. ";
    } else if (area > maxArea) {
      errMsg =
        errMsg + "Områdets storlek får inte överskrida " + maxArea + " m2. ";
    } else {
      let geoJSON = this.getPolygonAsGeoJSON();
      params = params + "&" + geoAttribute + "=" + geoJSON;
    }

    paramsFromForm.forEach((param) => {
      let paramName = "";
      let paramVal = "";
      if (param.type === "TEXT") {
        paramName = param.name;
        paramVal = param.value === undefined ? "" : param.value;
      } else if (param.type === "LOOKUP_LISTBOX") {
        paramName = param.name;
        let val = "";
        param.listOptions.forEach((option) => {
          if (param.value[this.prefixOptionValue(option.value)] === true) {
            val = val === "" ? option.value : val + " " + option.value;
          }
        });
        paramVal = val;
      } else if (param.type === "LOOKUP_CHOICE") {
        paramName = param.name;
        paramVal = param.value === undefined ? "" : param.value;
      }
      if (paramVal.length === 0 && param.optional === true) {
        paramName = "";
      } else if (paramVal.length === 0 && param.optional === false) {
        errMsg =
          errMsg +
          "Inget värde valt för parameter '" +
          param.description +
          "'. ";
      }
      if (paramName.length > 0) {
        params = params + "&" + paramName + "=" + paramVal;
      }
    });

    return {
      success: errMsg.length === 0,
      params: params,
      errMsg: errMsg,
    };
  }

  handleDrawStart = (e) => {
    e.feature.getGeometry().on("change", (evt) => {
      // TODO: Update feature with area label
      // let a = evt.target.getArea();
    });
  };

  handleDrawEnd = (e) => {
    this.removeInteraction();
  };

  addInteraction(useRect) {
    this.source.clear();
    if (this.draw !== null) {
      this.map.removeInteraction(this.draw);
    }
    if (useRect === true) {
      this.draw = new Draw({
        source: this.source,
        type: "Circle",
        style: this.style,
        geometryFunction: createBox(),
        geometryName: "Rect",
      });
    } else {
      // TODO: Change geometryFunction and type
      this.draw = new Draw({
        source: this.source,
        type: "Circle",
        style: this.style,
        geometryFunction: createBox(),
        geometryName: "Rect",
      });
    }
    this.draw.on("drawstart", this.handleDrawStart);
    this.draw.on("drawend", this.handleDrawEnd);
    this.map.addInteraction(this.draw);

    this.map.clickLock.add("fme");
    //this.map.snapHelper.add("draw");
  }

  removeInteraction() {
    if (this.draw !== null) {
      this.map.removeInteraction(this.draw);
      this.draw = null;
    }
    // TODO: Delay this so we don't get a feature-info click
    this.map.clickLock.delete("fme");
  }

  setActive(active) {
    if (active) {
      this.vector.setVisible(true);
    }
    if (active === false) {
      this.vector.setVisible(false);
      this.removeInteraction();
    }
  }

  getPolygonArea() {
    var features = this.source.getFeatures();
    if (features.length > 0) {
      return features[0].getGeometry().getArea();
    }
    return 0;
  }

  getPolygonAsGeoJSON() {
    let features = this.source.getFeatures();
    if (features.length > 0) {
      let polygon = features[0].getGeometry();
      return new GeoJSON().writeGeometry(polygon);
    }
    return null;
  }
}
