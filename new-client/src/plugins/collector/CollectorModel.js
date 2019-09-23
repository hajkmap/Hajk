import { WFS } from "ol/format";
import { Style, Stroke, Fill, Circle, RegularShape, Icon } from "ol/style";
import { MultiPoint, Polygon } from "ol/geom";
import Feature from "ol/Feature";
import Vector from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { all as strategyAll } from "ol/loadingstrategy";
import { Draw } from "ol/interaction";
import X2JS from "x2js";

class CollectorModel {
  constructor(settings) {
    this.app = settings.options.app;
    this.map = settings.map;
    this.observer = settings.observer;
    this.globalObserver = settings.globalObserver;
    this.activeServices = [settings.options.serviceId];
    this.sources = [settings.options.serviceConfig];
    this.vectorSource = undefined;
    this.layer = undefined;
    this.select = undefined;
    this.modify = undefined;
    this.key = undefined;
    this.editFeature = undefined;
    this.editSource = undefined;
    this.filty = false;
    this.saving = false;
    this.geometryName = "geom";
    this.serviceConfig = settings.options.serviceConfig;
    if (this.serviceConfig) {
      this.setFormValuesFromConfig();
      this.setLayer(settings.options.serviceConfig);
    } else {
      console.warn("Edit service is missing or not properly configured.");
    }
  }

  setFormValuesFromConfig = () => {
    if (this.serviceConfig) {
      this.formValues = this.serviceConfig.editableFields.reduce(
        (obj, field) => {
          obj[field.name] = this.valueByDataType(field);
          return obj;
        },
        {}
      );
    } else {
      this.formValues = {};
    }
  };

  valueByDataType(field) {
    switch (field.dataType) {
      case "date-time":
        return new Date().getTime();
      case "int":
      case "number":
        return 0;
      case "string":
        if (field.textType === "flerval") {
          return field.values.map(f => ({ checked: false, value: f }));
        }
        return "";
      default:
        return "";
    }
  }

  write(features) {
    var format = new WFS(),
      lr = this.editSource.layers[0].split(":"),
      fp = lr.length === 2 ? lr[0] : "",
      ft = lr.length === 2 ? lr[1] : lr[0],
      options = {
        featureNS: this.editSource.uri,
        featurePrefix: fp,
        featureType: ft,
        hasZ: false,
        version: "1.1.0", // or "1.0.0"
        srsName: this.editSource.projection
      };

    return format.writeTransaction(
      features.inserts,
      features.updates,
      features.deletes,
      options
    );
  }

  refreshLayer(layerName) {
    var source,
      foundLayer = this.map
        .getLayers()
        .getArray()
        .find(layer => {
          var match = false;
          if (layer.getSource().getParams) {
            let params = layer.getSource().getParams();
            if (typeof params === "object") {
              let paramName = params.LAYERS.split(":");
              let layerSplit = layerName.split(":");
              if (paramName.length === 2 && layerSplit.length === 2) {
                match = layerName === params.LAYERS;
              }
              if (paramName.length === 1) {
                match = layerSplit[1] === params.LAYERS;
              }
            }
          }
          return match;
        });

    if (foundLayer) {
      source = foundLayer.getSource();
      source.changed();
      source.updateParams({ time: Date.now() });
      this.map.updateSize();
    }
  }

  parseWFSTresponse(response) {
    var str =
      typeof response !== "string"
        ? new XMLSerializer().serializeToString(response)
        : response;
    return new X2JS().xml2js(str);
  }

  transact(features, done) {
    var node = this.write(features),
      serializer = new XMLSerializer(),
      src = this.editSource,
      payload = node ? serializer.serializeToString(node) : undefined;

    if (payload && this.saving === false) {
      this.saving = true;
      fetch(src.url, {
        method: "POST",
        body: payload,
        credentials: "same-origin",
        headers: {
          "Content-Type": "text/xml"
        }
      })
        .then(response => {
          this.saving = false;
          response.text().then(wfsResponseText => {
            this.refreshLayer(src.layers[0]);
            this.vectorSource
              .getFeatures()
              .filter(f => f.modification !== undefined)
              .forEach(f => (f.modification = undefined));
            done(this.parseWFSTresponse(wfsResponseText));
          });
        })
        .catch(response => {
          this.saving = false;
          response.text().then(errorMessage => {
            done(errorMessage);
          });
        });
    }
  }

  save(done) {
    var inserts = this.vectorSource.getFeatures();
    const formValues = { ...this.formValues };
    Object.keys(formValues).forEach(key => {
      if (Array.isArray(formValues[key])) {
        formValues[key] = formValues[key]
          .filter(v => v.checked)
          .map(v => v.value)
          .join(", ");
      }
    });

    if (inserts.length === 0) {
      inserts.push(new Feature());
    }

    if (inserts.length > 0) {
      inserts[0].setProperties(formValues);
      this.transact({ inserts: inserts }, done);
    }
  }

  getSelectStyle(feature) {
    return [
      new Style({
        stroke: new Stroke({
          color: "rgba(0, 255, 255, 1)",
          width: 3
        }),
        fill: new Fill({
          color: "rgba(0, 0, 0, 0.5)"
        }),
        image: new Circle({
          fill: new Fill({
            color: "rgba(0, 0, 0, 0.5)"
          }),
          stroke: new Stroke({
            color: "rgba(0, 255, 255, 1)",
            width: 2
          }),
          radius: 3
        })
      }),
      new Style({
        image: new RegularShape({
          fill: new Fill({
            color: "rgba(0, 0, 0, 0.2)"
          }),
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 1)",
            width: 2
          }),
          points: 4,
          radius: 8,
          angle: Math.PI / 4
        }),
        geometry: feature => {
          var coordinates =
            feature.getGeometry() instanceof Polygon
              ? feature.getGeometry().getCoordinates()[0]
              : feature.getGeometry().getCoordinates();
          return new MultiPoint(coordinates);
        }
      })
    ];
  }

  getVectorStyle(feature) {
    return [
      new Style({
        stroke: new Stroke({
          color: "rgba(255, 165, 20, 1)",
          width: 3
        }),
        fill: new Fill({
          color: "rgba(255, 165, 20, 0.5)"
        }),
        image: new Icon({
          scale: 1 / 2,
          anchor: [0.5, 1],
          anchorXUnits: "fraction",
          anchorYUnits: "fraction",
          src: "marker_x2.png"
        })
      })
    ];
  }

  getHiddenStyle(feature) {
    return [
      new Style({
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0)",
          width: 0
        }),
        fill: new Fill({
          color: "rgba(1, 2, 3, 0)"
        }),
        image: new Circle({
          fill: new Fill({
            color: "rgba(0, 0, 0, 0)"
          }),
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 0)",
            width: 0
          }),
          radius: 0
        })
      })
    ];
  }

  getSketchStyle() {
    return [
      new Style({
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.5)"
        }),
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.5)",
          width: 4
        }),
        image: new Circle({
          radius: 6,
          fill: new Fill({
            color: "rgba(0, 0, 0, 0.5)"
          }),
          stroke: new Stroke({
            color: "rgba(255, 255, 255, 0.5)",
            width: 2
          })
        })
      })
    ];
  }

  refreshEditingLayer() {
    var mapLayers = this.map
      .getLayers()
      .getArray()
      .filter(
        layer => layer.getProperties().caption === this.editSource.caption
      );

    mapLayers.forEach(mapLayer => {
      if (mapLayer.getSource) {
        let s = mapLayer.getSource();
        if (s.clear) {
          s.clear();
        }
        if (s.getParams) {
          var params = s.getParams();
          params.t = new Date().getMilliseconds();
          s.updateParams(params);
        }
        if (s.changed) {
          s.changed();
        }
      }
    });
  }

  setLayer(serviceConfig) {
    this.source = serviceConfig;
    this.filty = true;
    this.vectorSource = new VectorSource({
      strategy: strategyAll,
      projection: this.source.projection
    });

    this.layer = new Vector({
      source: this.vectorSource,
      style: this.getVectorStyle()
    });

    if (this.layer) {
      this.map.removeLayer(this.layer);
    }

    this.map.addLayer(this.layer);
    this.editSource = this.source;
    this.editFeature = null;
    this.observer.publish("editSource", this.source);
    this.observer.publish("editFeature", null);
    this.observer.publish("layerChanged", this.layer);
  }

  activateAdd(geometryType) {
    this.draw = new Draw({
      source: this.vectorSource,
      style: this.getSketchStyle(),
      type: geometryType,
      geometryName: this.geometryName
    });

    this.draw.on("drawend", event => {
      this.vectorSource.clear();
      event.feature.modification = "added";
    });
    this.map.addInteraction(this.draw);
    this.map.clicklock = true;
  }

  activateInteraction(type, geometryType) {
    if (type === "add") {
      this.activateAdd(geometryType);
    }
    if (type === "move") {
      this.activateMove();
    }
    if (type === "modify") {
      this.activateModify();
    }
    if (type === "remove") {
      this.map.clicklock = true;
      this.activateRemove();
    }
  }

  deactivateInteraction() {
    if (this.select) {
      this.map.removeInteraction(this.select);
    }
    if (this.modify) {
      this.map.removeInteraction(this.modify);
    }
    if (this.draw) {
      this.map.removeInteraction(this.draw);
    }
    if (this.move) {
      this.map.removeInteraction(this.move);
    }
    if (this.snap) {
      this.map.removeInteraction(this.snap);
    }
    if (this.remove) {
      this.remove = false;
      this.map.clicklock = false;
      this.map.un("singleclick", this.removeSelected);
    }
  }

  reset() {
    if (this.vectorSource) {
      this.vectorSource.clear();
    }
    this.map.clicklock = false;
    this.deactivateInteraction();
    this.setFormValuesFromConfig();
    this.observer.publish("reset");
  }

  deactivate() {
    this.reset();
    this.observer.publish("editFeature", this.editFeature);
    this.observer.publish("editSource", this.editSource);
    this.observer.publish("deactivate");
  }

  getSources() {
    return this.sources.filter(source => {
      return this.activeServices.some(serviceId => serviceId === source.id);
    });
  }
}

export default CollectorModel;
