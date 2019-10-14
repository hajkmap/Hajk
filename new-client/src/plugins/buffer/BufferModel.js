import { Circle, Stroke, Fill, Style } from "ol/style.js";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import Select from "ol/interaction/Select.js";
import Feature from "ol/Feature.js";
import GeoJSON from "ol/format/GeoJSON.js";
import { click } from "ol/events/condition.js";
import LinearRing from "ol/geom/LinearRing.js";
import {
  Point,
  LineString,
  Polygon,
  MultiPoint,
  MultiLineString,
  MultiPolygon
} from "ol/geom.js";
import * as jsts from "jsts";

var selectedFeatures = [],
  layer_added = false,
  highlight_added = false,
  bufferSource = new VectorSource(),
  bufferLayer = new VectorLayer({
    source: bufferSource,
    id: "buffer",
    style: new Style({
      fill: new Fill({
        color: "rgba(255, 255, 255, 0.5)"
      }),
      stroke: new Stroke({
        color: "rgba(75, 100, 115, 1.5)",
        width: 4
      }),
      image: new Circle({
        radius: 6,
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.5)"
        }),
        stroke: new Stroke({
          color: "rgba(75, 100, 115, 1.5)",
          width: 2
        })
      })
    })
  }),
  highlightStyle = new Style({
    fill: new Fill({
      color: "rgba(126, 168, 231, 0.47)"
    }),
    stroke: new Stroke({
      color: "rgba(126, 168, 231, 1)",
      width: 4
    }),
    image: new Circle({
      radius: 6,
      fill: new Fill({
        color: "rgba(126, 168, 231, 0.47)"
      }),
      stroke: new Stroke({
        color: "rgba(126, 168, 231, 1)",
        width: 1
      })
    })
  }),
  highlightSource = new VectorSource(),
  highlightLayer = new VectorLayer({
    source: highlightSource,
    id: "HighlightFeature",
    style: highlightStyle
  });

class BufferModel {
  constructor(settings) {
    this.map = settings.map;
  }
  get getMap() {
    return this.setMap();
  }

  setMap() {
    return this.map;
  }

  setActive(active) {
    if (active === true) {
      this.select = new Select({
        condition: click
      });
      this.map.clicklock = true;
      this.map.addInteraction(this.select);
      if (highlight_added === false) {
        highlight_added = true;
        this.map.addLayer(highlightLayer);
      }
      if (layer_added === false) {
        layer_added = true;
        this.map.addLayer(bufferLayer);
      }
    }
    if (active === false) {
      if (this.select) {
        this.map.removeInteraction(this.select);
      }
      this.map.clicklock = false;
      this.map.un("click", this.selectFeatures);
    }
  }
  selectFeatures = e => {
    var currentMap = this.getMap;
    var view = currentMap.getView();
    var wmsLayers = currentMap.getLayers();
    wmsLayers.forEach(function(lyr) {
      if (lyr.type === "VECTOR" && lyr.values_.name === "drawLayer") {
        if (lyr.getSource().getFeatures().length > 0) {
          var f = currentMap.getFeaturesAtPixel(e.pixel);
          var features = f;

          if (features) {
            highlightSource.addFeatures(features);
            highlightSource.getFeatures().forEach(feature => {
              feature.setStyle(highlightStyle);
            });
            selectedFeatures.push(highlightSource.getFeatures());
          }
        }
      }

      if (lyr.get("visible") === true && lyr.layersInfo) {
        let subLayers = Object.values(lyr.layersInfo);
        let subLayersToQuery = subLayers
          .filter(subLayer => {
            return subLayer.queryable === true;
          })
          .map(queryableSubLayer => {
            return queryableSubLayer.id;
          });

        if (e.coordinate !== undefined) {
          let url = lyr
            .getSource()
            .getFeatureInfoUrl(
              e.coordinate,
              view.getResolution(),
              view.getProjection().getCode(),
              {
                INFO_FORMAT: "application/json",
                QUERY_LAYERS: subLayersToQuery.join(",")
              }
            );
          fetch(url)
            .then(function(response) {
              return response.json();
            })
            .then(function(myJson) {
              var features = new GeoJSON().readFeatures(myJson);
              if (features.length > 0) {
                highlightSource.addFeatures(features);
                selectedFeatures.push(highlightSource.getFeatures());
              }
            });
        }
      }
    });
  };
  activateSelecting(activate) {
    if (activate === true) {
      this.map.on("click", this.selectFeatures);
    }
  }

  bufferFeatures(dist) {
    var arr = [];
    var parser = new jsts.io.OL3Parser();
    parser.inject(
      Point,
      LineString,
      LinearRing,
      Polygon,
      MultiPoint,
      MultiLineString,
      MultiPolygon
    );

    if (selectedFeatures.length > 0) {
      selectedFeatures.forEach(function(element, key) {
        var thisFeature = element[key];

        var olGeom = thisFeature.getGeometry();
        if (olGeom instanceof Circle) {
          olGeom = Polygon.fromCircle(olGeom, 0b10000000);
        }
        var jstsGeom = parser.read(olGeom);
        var buffered = jstsGeom.buffer(dist);
        var olf = new Feature();
        olf.setGeometry(parser.write(buffered));
        olf.setId(Math.random() * 1e20);
        arr.push(olf);
      });
      bufferSource.addFeatures(arr);
    }
  }

  clearSelection() {
    if (selectedFeatures.length > 0) {
      highlightSource.clear();
      selectedFeatures.length = 0;
    }
  }
  clearBuffer() {
    this.clearSelection();
    bufferSource.clear();
  }
}
export default BufferModel;
