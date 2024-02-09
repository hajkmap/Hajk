import { WFS } from "ol/format";
import { Style, Stroke, Fill, Circle, RegularShape } from "ol/style";
import { MultiPoint, Polygon } from "ol/geom";
import Vector from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { all as strategyAll } from "ol/loadingstrategy";
import { Select, Modify, Draw, Translate } from "ol/interaction";
import { never } from "ol/events/condition";
import X2JS from "x2js";
import { hfetch } from "utils/FetchWrapper";
import WKT from "ol/format/WKT";
import Feature from "ol/Feature";

class EditModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.observer = settings.observer;
    this.options = settings.options;
    this.surveyJsData = settings.surveyJsData;
    this.onCoordinatesChange = settings.onCoordinatesChange;
    this.currentQuestionName = settings.currentQuestionName;

    this.activeServices = this.options.activeServices;
    this.sources = this.options.sources;

    this.newMapData = [];
    this.vectorSource = undefined;
    this.layer = undefined;
    this.select = undefined;
    this.modify = undefined;
    this.key = undefined;
    this.editFeature = undefined;
    this.editFeatureBackup = undefined;
    this.editSource = undefined;
    this.removeFeature = undefined;
    this.shell = undefined;
    this.instruction = "";
    this.filty = false;
    this.removalToolMode = "off";

    // Normalize the sources that come from options.
    if (this.options.sources && Array.isArray(this.options.sources)) {
      this.options.sources = this.options.sources.map((s) => {
        // Namespace URI is required for insert. QGIS Server tends to accept this value.
        if (s.uri.trim().length === 0) {
          s.uri = "http://www.opengis.net/wfs";
        }

        // Get rid of the SERVICE=WFS attribute if existing: we will add it on the following requests
        // while QGIS Server's WFS endpoint requires the SERVICE parameter to be preset. We'd
        // end up with duplicate parameters, so the safest way around is to remove it, in a controlled
        // manner, without disturbing the URL.
        const url = new URL(s.url);
        url.searchParams.delete("service");
        s.url = url.href;

        return s;
      });
    } else {
      console.warn("this.options.sources is either undefined or not an array");
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
        srsName: this.editSource.projection,
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
        .find((layer) => {
          var match = false;
          if (layer.getSource().getParams) {
            let params = layer.getSource().getParams();
            if (typeof params === "object") {
              // FIXME: Can be a bug here: we can't expect our edited layer to always be of index 0 if a LayerGroup (which gives Array so we must handle that as well)
              let paramName = Array.isArray(params.LAYERS)
                ? params.LAYERS[0].split(":")
                : params.LAYERS.split(":");
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

    if (payload) {
      hfetch(src.url, {
        method: "POST",
        body: payload,
        credentials: "same-origin",
        headers: {
          "Content-Type": "text/xml",
        },
      })
        .then((response) => {
          response.text().then((wfsResponseText) => {
            const resXml = this.parseWFSTresponse(wfsResponseText);
            if (resXml.ExceptionReport || !resXml.TransactionResponse) {
              // do not delete the data so the user can submit it again
              done(resXml);
            } else {
              this.refreshLayer(src.layers[0]);
              this.vectorSource
                .getFeatures()
                .filter((f) => f.modification !== undefined)
                .forEach((f) => (f.modification = undefined));
              done(resXml);
            }
          });
        })
        .catch((response) => {
          response.text().then((errorMessage) => {
            done(errorMessage);
          });
        });
    }
  }

  save(editValues, done) {
    const find = (mode) =>
      this.vectorSource
        .getFeatures()
        .filter((feature) => feature.modification === mode);

    const features = {
      updates: find("updated").map((feature) => {
        feature.unset("boundedBy");
        return feature;
      }),
      inserts: find("added"),
      deletes: find("removed"),
    };

    if (editValues) {
      [...features.updates, ...features.inserts, ...features.deletes].forEach(
        (feature) => {
          for (const key in editValues) {
            feature.set(key, editValues[key]);
          }
        }
      );
    }

    if (this.source.id === "simulated") {
      const wktFormatter = new WKT();

      const allFeatures = this.vectorSource.getFeatures();

      allFeatures.forEach((feature) => {
        const featureData = {
          surveyQuestion: feature.get("SURVEYQUESTION"),
          surveyAnswerId: feature.get("SURVEYANSWERID"),
          wktGeometry: wktFormatter.writeGeometry(feature.getGeometry()),
        };

        switch (feature.modification) {
          case "added":
            // Inserts
            this.newMapData.push(featureData);
            break;
          case "updated":
            // Updates

            break;
          case "removed":
            // Remove
            const wktToRemove = wktFormatter.writeGeometry(
              feature.getGeometry()
            );
            this.newMapData = this.newMapData.filter(
              (f) => f.wktGeometry !== wktToRemove
            );
            break;
          default:
            break;
        }
      });

      done();
      return;
    }

    if (
      features.updates.length === 0 &&
      features.inserts.length === 0 &&
      features.deletes.length === 0
    ) {
      return done();
    }

    this.transact(features, (response) => {
      done(response);
    });
  }

  getSelectStyle() {
    return [
      new Style({
        stroke: new Stroke({
          color: "rgba(0, 255, 255, 1)",
          width: 3,
        }),
        fill: new Fill({
          color: "rgba(0, 0, 0, 0.5)",
        }),
        image: new Circle({
          fill: new Fill({
            color: "rgba(0, 0, 0, 0.5)",
          }),
          stroke: new Stroke({
            color: "rgba(0, 255, 255, 1)",
            width: 2,
          }),
          radius: 3,
        }),
      }),
      new Style({
        image: new RegularShape({
          fill: new Fill({
            color: "rgba(0, 0, 0, 0.2)",
          }),
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 1)",
            width: 2,
          }),
          points: 4,
          radius: 8,
          angle: Math.PI / 4,
        }),
        geometry: (feature) => {
          var coordinates =
            feature.getGeometry() instanceof Polygon
              ? feature.getGeometry().getCoordinates()[0]
              : feature.getGeometry().getCoordinates();
          return new MultiPoint(coordinates);
        },
      }),
    ];
  }

  getVectorStyle() {
    return [
      new Style({
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 1)",
          width: 3,
        }),
        fill: new Fill({
          color: "rgba(0, 0, 0, 0.5)",
        }),
        image: new Circle({
          fill: new Fill({
            color: "rgba(0, 0, 0, 0.5)",
          }),
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 1)",
            width: 3,
          }),
          radius: 4,
        }),
      }),
    ];
  }

  getTransparentStyle() {
    return [
      new Style({
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0)",
          width: 3,
        }),
        fill: new Fill({
          color: "rgba(0, 0, 0, 0)",
        }),
        image: new Circle({
          fill: new Fill({
            color: "rgba(0, 0, 0, 0)",
          }),
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 0)",
            width: 3,
          }),
          radius: 4,
        }),
      }),
    ];
  }

  getHiddenStyle() {
    return [
      new Style({
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0)",
          width: 0,
        }),
        fill: new Fill({
          color: "rgba(1, 2, 3, 0)",
        }),
        image: new Circle({
          fill: new Fill({
            color: "rgba(0, 0, 0, 0)",
          }),
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 0)",
            width: 0,
          }),
          radius: 0,
        }),
      }),
    ];
  }

  getSketchStyle() {
    return [
      new Style({
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.5)",
        }),
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.5)",
          width: 4,
        }),
        image: new Circle({
          radius: 6,
          fill: new Fill({
            color: "rgba(0, 0, 0, 0.5)",
          }),
          stroke: new Stroke({
            color: "rgba(255, 255, 255, 0.5)",
            width: 2,
          }),
        }),
      }),
    ];
  }

  filterByDefaultValue(features) {
    return features.filter((feature) => {
      return this.editSource.editableFields.some((field) => {
        var value = feature.getProperties()[field.name];
        if (field.hidden && value === field.defaultValue) {
          return true;
        }
        return false;
      });
    });
  }

  loadDataSuccess = (data) => {
    if (this.editSource.id === "simulated") {
      const wktFormatter = new WKT();

      // Filter saved features based on SURVEYANSWERID and SURVEYQUESTION
      const filteredFeatures = this.newMapData.filter(
        (feature) =>
          feature.surveyAnswerId === this.surveyJsData.surveyAnswerId &&
          feature.surveyQuestion === this.currentQuestionName
      );

      const features = filteredFeatures.map((savedFeature) => {
        const geometry = wktFormatter.readGeometry(savedFeature.wktGeometry);
        return new Feature({
          geometry: geometry,
          SURVEYQUESTION: savedFeature.surveyQuestion,
          SURVEYANSWERID: savedFeature.surveyAnswerId,
        });
      });

      this.vectorSource.addFeatures(features);
    } else {
      var format = new WFS();
      var features;
      try {
        features = format.readFeatures(data);
      } catch (e) {
        alert("Fel: data kan inte läsas in. Kontrollera koordinatsystem.");
        return;
      }

      this.geometryName =
        features.length > 0 ? features[0].getGeometryName() : "geom";

      if (this.editSource.editableFields.some((field) => field.hidden)) {
        features = this.filterByDefaultValue(features);
      }

      // Features filtered by SURVEYANSWERID to show in map
      const filteredFeatures = features.filter((feature) => {
        const surveyAnswerId = String(feature.get("SURVEYANSWERID") || "");
        const surveyQuestion = String(feature.get("SURVEYQUESTION") || "");
        return (
          surveyAnswerId.trim() === this.surveyJsData.surveyAnswerId.trim() &&
          surveyQuestion.trim() === this.currentQuestionName.trim()
        );
      });

      // Draws geometries in the map filtered
      this.vectorSource.addFeatures(filteredFeatures);

      this.vectorSource.getFeatures().forEach((feature) => {
        feature.on("propertychange", (e) => {
          if (feature.modification === "removed") {
            return;
          }
          if (feature.modification === "added") {
            return;
          }
          feature.modification = "updated";
        });
        feature.on("change", (e) => {
          if (feature.modification === "removed") {
            return;
          }
          if (feature.modification === "added") {
            return;
          }
          feature.modification = "updated";
        });
      });
    }
  };

  loadData(source, extent, done) {
    // Prepare the URL for retrieving WFS data. We will want to set
    // some search params later on, but we want to avoid any duplicates.
    // The values we will set below should override any existing, if
    // same key already exists in URL.
    // To ensure it will happen, we read the possible current params…
    const url = new URL(source.url);

    // …and make sure that the keys are in UPPER CASE.
    const existingSearchParams = {};
    for (const [k, v] of url.searchParams.entries()) {
      existingSearchParams[k.toUpperCase()] = v;
    }

    // Now we merge the possible existing params with the rest, defined
    // below. We can be confident that we won't have duplicates and that
    // our values "win", as they are defined last.
    const mergedSearchParams = {
      ...existingSearchParams,
      SERVICE: "WFS",
      VERSION: "1.1.0",
      REQUEST: "GetFeature",
      TYPENAME: source.layers[0],
      SRSNAME: source.projection,
    };

    // Create a new URLSearchParams object from the merged object…
    const searchParams = new URLSearchParams(mergedSearchParams);
    // …and update our URL's search string with the new value
    url.search = searchParams.toString();

    // Send a String as HFetch doesn't currently accept true URL objects
    hfetch(url.toString())
      .then((response) => {
        if (response.status !== 200) {
          return done("data-load-error");
        }
        response.text().then((data) => {
          if (data.includes("ows:ExceptionReport")) {
            return done("data-load-error");
          }
          this.loadDataSuccess(data);
          return done("data-load-success");
        });
      })
      .catch((error) => {
        console.warn(`Error loading vectorsource... ${error}`);
        return done("data-load-error");
      });
  }

  editAttributes(feature) {
    this.editFeature = feature;
    this.observer.publish("editFeature", feature);
  }

  featureSelected(event) {
    if (event.selected.length === 0) {
      this.editAttributes(null, null);
    }

    event.selected.forEach((feature) => {
      if (!feature.getId() && feature.getProperties().user) {
        this.select.getFeatures().remove(feature);
      }
      event.mapBrowserEvent.filty = true;
      this.editAttributes(feature);
    });
  }

  refreshEditingLayer() {
    var mapLayers = this.map
      .getLayers()
      .getArray()
      .filter(
        (layer) => layer.getProperties().caption === this.editSource.caption
      );

    mapLayers.forEach((mapLayer) => {
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

  setLayer(serviceId, done) {
    const isSimulated = !serviceId || !this.sources || !this.sources.length;
    if (isSimulated) {
      this.source = {
        id: "simulated",
        caption: "Simulerad Medborgardialog",
        internalLayerName: "Simulerad Medborgardialog",
        url: "http://localhost:3000/simulated",
        uri: "http://www.opengis.net/wfs",
        projection: this.options.selectedProjection,
        type: "edit",
        layers: ["SIMULATED_LAYER"],
        editLine: true,
        editMultiLine: false,
        editMultiPoint: false,
        editMultiPolygon: false,
        editPoint: true,
        editPolygon: true,
        editableFields: [
          { index: 1, name: "SURVEYID", alias: "SURVEYID", dataType: "string" },
          {
            index: 2,
            name: "SURVEYANSWERID",
            alias: "SURVEYANSWERID",
            dataType: "string",
          },
          {
            index: 3,
            name: "SURVEYANSWERDATE",
            alias: "SURVEYANSWERDATE",
            dataType: "dateTime",
          },
          {
            index: 4,
            name: "SURVEYQUESTION",
            alias: "SURVEYQUESTION",
            dataType: "string",
          },
        ],
        nonEditableFields: [],
        visibleForGroups: [],
      };
    } else {
      this.source = this.sources.find((source) => source.id === serviceId);
      const sourceSpecificOptions = this.options.activeServices.find(
        (l) => l.id === serviceId
      );

      this.source = { ...this.source, ...sourceSpecificOptions };
    }

    this.filty = true;

    this.vectorSource = new VectorSource({
      loader: (extent) => this.loadData(this.source, extent, done),
      strategy: strategyAll,
      projection: this.source.projection,
    });

    this.layer = new Vector({
      layerType: "system",
      zIndex: 5000,
      name: "pluginEdit",
      caption: "Edit layer",
      source: this.vectorSource,
      style:
        this.source?.simpleEditWorkflow === true
          ? this.getTransparentStyle()
          : this.getVectorStyle(),
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

  activateModify() {
    this.select = new Select({
      style: this.getSelectStyle(),
      toggleCondition: never,
      layers: [this.layer],
    });

    this.select.on("select", (event) => {
      this.featureSelected(event, this.source);
    });

    this.modify = new Modify({
      features: this.select.getFeatures(),
    });

    // The "select" interaction should be allowed in both the
    // regular and simple edit workflows.
    this.map.addInteraction(this.select);

    // The "modify" interaction (which allows moving the feature in
    // map) should, however, only be allowed in the regular workflow.
    if (this.source?.simpleEditWorkflow !== true) {
      this.map.addInteraction(this.modify);
    }

    // Some special actions must take place if source
    // uses the simple edit workflow.
    if (this.source?.simpleEditWorkflow === true) {
      // We must take care of activating clickLock and snapHelper
      // manually in this method (because the normal activation
      // takes place in `activateInteraction`, which never runs in
      // in this flow).

      // Enable clickLock, which prevents infoclick from triggering
      this.map.clickLock.add("edit");

      // Add snap after all interactions have been added
      this.map.snapHelper.add("edit");

      // If a corresponding WMS layer is specified, let's show it to the user
      if (this.source?.correspondingWMSLayerId) {
        // Try to show the corresponding WMS layer
        const layerToShow = this.map
          .getAllLayers()
          .find((l) => l.get("name") === this.source.correspondingWMSLayerId);
        layerToShow.setVisible(true);
      }
    }
  }

  activateAdd(geometryType) {
    this.vectorSource.getFeatures().forEach((feature) => {
      feature.modification = "removed";
      feature.setStyle(this.getHiddenStyle());
    });

    this.draw = new Draw({
      source: this.vectorSource,
      style: this.getSketchStyle(),
      type: geometryType,
      stopClick: true,
      geometryName: this.geometryName,
    });
    this.draw.on("drawend", (event) => {
      event.feature.modification = "added";
      this.editAttributes(event.feature);
      // OpenLayers seems to have a problem stopping the clicks if
      // the draw interaction is removed too early. This fix is not pretty,
      // but it gets the job done. It seems to be enough to remove the draw
      // interaction after one cpu-cycle.
      // If this is not added, the user will get a zoom-event when closing
      // a polygon drawing.
      setTimeout(() => {
        this.deactivateInteraction();
      }, 1);

      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        const targetPlugin = this.app.windows.find(
          (window) => window.title === "Medborgardialog"
        );
        if (targetPlugin) {
          setTimeout(() => {
            targetPlugin.showWindow();
          }, 2000);
        }
      }
    });
    this.map.addInteraction(this.draw);
  }

  activateRemove() {
    this.remove = true;
    this.map.on("singleclick", this.removeSelected);
  }

  activateMove() {
    this.move = new Translate({
      layers: [this.layer],
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
      this.activateRemove();
    }

    // Enable clickLock, which prevents infoclick from triggering
    this.map.clickLock.add("edit");

    // Add snap after all interactions have been added
    this.map.snapHelper.add("edit");
  }

  removeSelected = (e) => {
    this.map.forEachFeatureAtPixel(e.pixel, (feature) => {
      if (this.vectorSource.getFeatures().some((f) => f === feature)) {
        if (feature.modification === "added") {
          feature.modification = undefined;
        } else {
          feature.modification = "removed";
        }
        feature.setStyle(this.getHiddenStyle());

        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
          const targetPlugin = this.app.windows.find(
            (window) => window.title === "Medborgardialog"
          );
          if (targetPlugin) {
            targetPlugin.showWindow();
          }
        }
      }
    });
  };

  deactivateInteraction() {
    // First remove the snap interaction
    this.map.snapHelper.delete("edit");

    // Remove clickLock
    this.map.clickLock.delete("edit");

    // Next, remove correct map interaction
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
      this.map.un("singleclick", this.removeSelected);
    }
  }

  reset() {
    this.editSource = undefined;
    this.editFeature = undefined;
    this.removeFeature = undefined;
    this.removalToolMode = "off";
    this.filty = false;

    if (this.layer) {
      this.map.removeLayer(this.layer);
      this.layer = undefined;
    }
    this.deactivateInteraction();
  }

  resetEditFeature = () => {
    this.editFeatureBackup = this.editFeature;
    this.editFeature = undefined;
    this.observer.publish("editFeature", this.editFeature);
  };

  getSources() {
    return this.options.sources;
  }
}

export default EditModel;
