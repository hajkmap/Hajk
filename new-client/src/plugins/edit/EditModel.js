import { WFS, GML } from "ol/format";
import { Style, Stroke, Fill, Circle, RegularShape } from "ol/style";
import { MultiPoint, Polygon } from "ol/geom";
import Vector from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { all as strategyAll } from "ol/loadingstrategy";
import { Select, Modify, Draw, Translate } from "ol/interaction";
import { never } from "ol/events/condition";
import X2JS from "x2js";

class EditModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.observer = settings.observer;
    this.options = settings.options;

    this.activeServices = this.options.activeServices;
    this.sources = this.options.sources;

    this.vectorSource = undefined;
    this.layer = undefined;
    this.select = undefined;
    this.modify = undefined;
    this.key = undefined;
    this.editFeature = undefined;
    this.editSource = undefined;
    this.removeFeature = undefined;
    this.shell = undefined;
    this.instruction = "";
    this.filty = false;
    this.removalToolMode = "off";
  }

  write(features) {
    var format = new WFS(),
      lr = this.editSource.layers[0].split(":"),
      ns = lr.length === 2 ? lr[0] : "",
      ft = lr.length === 2 ? lr[1] : lr[0],
      options = {
        featureNS: ns,
        featureType: ft,
        srsName: this.editSource.projection
      },
      gml = new GML(options);

    return format.writeTransaction(
      features.inserts,
      features.updates,
      features.deletes,
      gml
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
    var str = new XMLSerializer().serializeToString(response);
    return new X2JS().xml2js(str);
  }

  transact(features, done) {
    var node = this.write(features),
      serializer = new XMLSerializer(),
      src = this.editSource,
      payload = node ? serializer.serializeToString(node) : undefined;

    if (payload) {
      fetch(src.url, {
        method: "POST",
        body: payload,
        headers: {
          "Content-Type": "text/xml"
        }
      })
        .then(response => {
          response.text().then(data => {
            this.refreshLayer(src.layers[0]);
            var wfsData = this.parseWFSTresponse(data);
            this.vectorSource
              .getFeatures()
              .filter(f => f.modification !== undefined)
              .forEach(f => (f.modification = undefined));
            done(wfsData);
          });
        })
        .catch(errorData => {
          var wfsData = this.parseWFSTresponse(errorData);
          done(wfsData);
        });
    }
  }

  save(done) {
    var find = mode =>
      this.vectorSource
        .getFeatures()
        .filter(feature => feature.modification === mode);

    var features = {
      updates: find("updated"),
      inserts: find("added"),
      deletes: find("removed")
    };

    if (
      features.updates.length === 0 &&
      features.inserts.length === 0 &&
      features.deletes.length === 0
    ) {
      return done();
    }

    this.transact(features, done);
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
          color: "rgba(0, 0, 0, 1)",
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
            color: "rgba(0, 0, 0, 1)",
            width: 3
          }),
          radius: 4
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

  filterByDefaultValue(features) {
    return features.filter(feature => {
      return this.editSource.editableFields.some(field => {
        var value = feature.getProperties()[field.name];
        if (field.hidden && value === field.defaultValue) {
          return true;
        }
        return false;
      });
    });
  }

  loadDataSuccess = data => {
    var format = new WFS();
    var features;
    try {
      features = format.readFeatures(data);
    } catch (e) {
      alert("Fel: data kan inte läsas in. Kontrollera koordinatsystem.");
    }
    if (features.length > 0) {
      this.geometryName = features[0].getGeometryName();
    }

    if (this.editSource.editableFields.some(field => field.hidden)) {
      features = this.filterByDefaultValue(features);
    }

    this.vectorSource.addFeatures(features);
    this.vectorSource.getFeatures().forEach(feature => {
      feature.on("propertychange", e => {
        if (feature.modification === "removed") {
          return;
        }
        if (feature.modification === "added") {
          return;
        }
        feature.modification = "updated";
      });
      feature.on("change", e => {
        if (feature.modification === "removed") {
          return;
        }
        if (feature.modification === "added") {
          return;
        }
        feature.modification = "updated";
      });
    });
  };

  loadDataError = response => {
    alert("Fel: data kan inte hämtas. Försök igen senare.");
  };

  urlFromObject(url, obj) {
    return Object.keys(obj).reduce((str, key, i, a) => {
      str = str + key + "=" + obj[key];
      if (i < a.length - 1) {
        str = str + "&";
      }
      return str;
    }, (url += "?"));
  }

  loadData(source, extent, done) {
    var url = this.urlFromObject(source.url, {
      service: "WFS",
      version: "1.1.0",
      request: "GetFeature",
      typename: source.layers[0],
      srsname: source.projection
    });
    fetch(url)
      .then(response => {
        response.text().then(data => {
          this.loadDataSuccess(data);
        });
        if (done) done();
      })
      .catch(error => {
        this.loadDataError(error);
        if (done) done();
      });
  }

  editAttributes(feature) {
    this.editFeature = feature;
    this.observer.emit("editFeature", feature);
  }

  featureSelected(event) {
    if (this.removalToolMode === "on") {
      event.selected.forEach(feature => {
        this.removeFeature = feature;
        this.emit("removeFeature", feature);
      });
      return;
    }

    if (event.selected.length === 0) {
      this.editAttributes(null, null);
    }

    event.selected.forEach(feature => {
      if (!feature.getId() && feature.getProperties().user) {
        this.select.getFeatures().remove(feature);
      }
      event.mapBrowserEvent.filty = true;
      this.editAttributes(feature);
    });
  }

  setLayer(serviceId, done) {
    this.source = this.sources.find(source => source.id === serviceId);
    this.filty = true;
    this.vectorSource = new VectorSource({
      loader: extent => this.loadData(this.source, extent, done),
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
    this.observer.emit("editSource", this.source);
    this.observer.emit("editFeature", null);
    this.observer.emit("layerChanged", this.layer);
  }

  activateModify() {
    this.select = new Select({
      style: this.getSelectStyle(),
      toggleCondition: never,
      layers: [this.layer]
    });

    this.select.on("select", event => {
      this.featureSelected(event, this.source);
    });

    this.modify = new Modify({
      features: this.select.getFeatures()
    });
    this.map.addInteraction(this.select);
    this.map.addInteraction(this.modify);
  }

  activateAdd(geometryType) {
    this.draw = new Draw({
      source: this.vectorSource,
      style: this.getSketchStyle(),
      type: geometryType,
      geometryName: this.geometryName
    });
    this.draw.on("drawend", event => {
      event.feature.modification = "added";
      this.editAttributes(event.feature);
    });
    this.map.addInteraction(this.draw);
    this.map.clicklock = true;
  }

  activateRemove() {
    this.remove = true;
    this.map.on("singleclick", this.removeSelected);
  }

  activateMove() {
    this.move = new Translate({
      layers: [this.layer]
    });
    this.map.addInteraction(this.move);
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

  removeSelected = e => {
    this.map.forEachFeatureAtPixel(e.pixel, feature => {
      if (this.vectorSource.getFeatures().some(f => f === feature)) {
        this.vectorSource.removeFeature(feature);
      }
    });
  };

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
    if (this.remove) {
      this.remove = false;
      this.map.clicklock = false;
      this.map.un("singleclick", this.removeSelected);
    }
  }

  reset() {
    this.editSource = undefined;
    this.editFeature = undefined;
    this.removeFeature = undefined;
    this.removalToolMode = "off";
    this.filty = false;
    this.map.clicklock = false;
    if (this.layer) {
      this.map.removeLayer(this.layer);
      this.layer = undefined;
    }
    this.deactivateInteraction();
  }

  deactivate() {
    this.reset();
    this.observer.emit("editFeature", this.editFeature);
    this.observer.emit("editSource", this.editSource);
    this.observer.emit("deactivate");
  }

  getSources() {
    return this.sources.filter(source => {
      return this.activeServices.some(serviceId => serviceId === source.id);
    });
  }
}

export default EditModel;
