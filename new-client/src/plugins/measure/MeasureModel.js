import { Circle as CircleStyle, Fill, Stroke, Style, Text } from "ol/style.js";
import { Vector as VectorSource } from "ol/source.js";
import { Vector as VectorLayer } from "ol/layer.js";
import { LineString, Polygon } from "ol/geom.js";
import Draw from "ol/interaction/Draw.js";
import Overlay from "ol/Overlay";

class MeasureModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;
    this.source = new VectorSource();
    this.vector = new VectorLayer({
      source: this.source,
      style: this.createStyle
    });
    this.map.addLayer(this.vector);
    this.type = "LineString";
    this.createMeasureTooltip();
  }

  createStyle = (feature, resolution) => {
    return [
      new Style({
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.3)"
        }),
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.5)",
          width: 3
        }),
        text: new Text({
          textAlign: "center",
          textBaseline: "middle",
          font: "12pt sans-serif",
          fill: new Fill({ color: "#FFF" }),
          text: this.getLabelText(feature),
          overflow: true,
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 0.5)",
            width: 3
          }),
          offsetX: 0,
          offsetY: -10,
          rotation: 0,
          scale: 1
        })
      })
    ];
  };

  clear = () => {
    this.source.clear();
    this.measureTooltip.setPosition(undefined);
  };

  handleDrawStart = e => {
    e.feature.getGeometry().on("change", e => {
      var toolTip = "",
        coord = undefined,
        pointerCoord;

      if (this.active) {
        if (this.pointerPosition) {
          pointerCoord = this.pointerPosition.coordinate;
        }

        if (e.target instanceof LineString) {
          toolTip = this.formatLabel("length", e.target.getLength());
          coord = e.target.getLastCoordinate();
        }

        if (e.target instanceof Polygon) {
          toolTip = this.formatLabel("area", e.target.getArea());
          coord = pointerCoord || e.target.getFirstCoordinate();
        }

        this.measureTooltipElement.innerHTML = toolTip;
        this.measureTooltip.setPosition(coord);
      }
    });
  };

  handleDrawEnd = e => {
    this.setFeaturePropertiesFromGeometry(e.feature);
    this.measureTooltip.setPosition(undefined);
  };

  setType(type) {
    this.type = type;
    this.removeInteraction();
    this.addInteraction();
  }

  removeInteraction() {
    this.measureTooltip.setPosition(undefined);
    this.map.removeInteraction(this.draw);
  }

  setFeaturePropertiesFromGeometry(feature) {
    if (!feature) return;
    var geom,
      type = "",
      length = 0,
      radius = 0,
      area = 0,
      position = {
        n: 0,
        e: 0
      };
    geom = feature.getGeometry();
    type = geom.getType();
    switch (type) {
      case "Point":
        position = {
          n: Math.round(geom.getCoordinates()[1]),
          e: Math.round(geom.getCoordinates()[0])
        };
        break;
      case "LineString":
        length = Math.round(geom.getLength());
        break;
      case "Polygon":
        area = Math.round(geom.getArea());
        break;
      case "Circle":
        radius = Math.round(geom.getRadius());
        break;
      default:
        break;
    }
    feature.setProperties({
      type: type,
      user: true,
      length: length,
      area: area,
      radius: radius,
      position: position
    });
  }

  formatLabel(type, value) {
    var label;

    if (type === "point") {
      label = "Nord: " + value[0] + " Öst: " + value[1];
    }

    if (typeof value === "number") {
      value = Math.round(value);
    }

    if (type === "circle") {
      let prefix = " m";
      let prefixSq = " m²";
      if (value >= 1e3) {
        prefix = " km";
        value = value / 1e3;
      }
      label =
        "R = " +
        value +
        prefix +
        " \nA = " +
        Math.round(value * value * Math.PI * 1e3) / 1e3 +
        prefixSq;
    }

    if (type === "area") {
      let prefix = " ha";
      value = Math.round((value / 1e4) * 1e2) / 100;
      label = value + prefix;
    }

    if (type === "length") {
      let prefix = " m";
      if (value >= 1e3) {
        prefix = " km";
        value = value / 1e3;
      }
      label = value + prefix;
    }

    return label;
  }

  createMeasureTooltip() {
    if (this.measureTooltipElement) {
      this.measureTooltipElement.parentNode.removeChild(
        this.measureTooltipElement
      );
    }
    this.measureTooltipElement = document.createElement("div");
    this.measureTooltipElement.className = "tooltip-draw tooltip-measure";
    this.measureTooltip = new Overlay({
      element: this.measureTooltipElement,
      offset: [0, -15],
      positioning: "bottom-center"
    });
    this.map.addOverlay(this.measureTooltip);
  }

  getLabelText(feature) {
    const props = feature.getProperties();
    const type = feature.getProperties().type;
    switch (type) {
      case "LineString":
        return this.formatLabel("length", props.length);
      case "Polygon":
        return this.formatLabel("area", props.area);
      default:
        return "";
    }
  }

  addInteraction() {
    this.draw = new Draw({
      source: this.source,
      type: this.type,
      style: new Style({
        fill: new Fill({
          color: "rgba(255, 255, 255, 0.2)"
        }),
        stroke: new Stroke({
          color: "rgba(0, 0, 0, 0.5)",
          lineDash: [10, 10],
          width: 2
        }),
        image: new CircleStyle({
          radius: 5,
          stroke: new Stroke({
            color: "rgba(0, 0, 0, 0.7)"
          }),
          fill: new Fill({
            color: "rgba(255, 255, 255, 0.2)"
          })
        })
      })
    });
    this.draw.on("drawstart", this.handleDrawStart);
    this.draw.on("drawend", this.handleDrawEnd);
    this.map.addInteraction(this.draw);
  }

  setActive(active) {
    if (active && !this.active) {
      this.addInteraction();
    }
    if (active === false) {
      this.removeInteraction();
    }
    this.active = active;
  }

  getMap() {
    return this.map;
  }
}

export default MeasureModel;
