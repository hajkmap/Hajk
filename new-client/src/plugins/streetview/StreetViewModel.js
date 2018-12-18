import { transform } from "ol/proj.js";
import Style from "ol/style/Style.js";
import Icon from "ol/style/Icon.js";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import Vector from "ol/layer/Vector.js";
import VectorSource from "ol/source/Vector.js";

const loadGoogleMapsApi = require("load-google-maps-api");

const imageBlob =
  "data:image/png;base64,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";

class StreetViewModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;
    this.location = undefined;

    loadGoogleMapsApi({
      key: settings.apiKey
    }).then(googleMapApi => {
      this.googleMapsApi = googleMapApi;
    });

    this.streetViewMarkerLayer = new Vector({
      source: new VectorSource({}),
      name: "streetViewMarkerLayer"
    });
    this.map.addLayer(this.streetViewMarkerLayer);
  }

  activate() {
    this.map.clicklock = true;
    document.querySelector(".ol-viewport").style.cursor = "crosshair";
    this.map.on("singleclick", this.showLocation);
    this.activated = true;
  }

  deactivate() {
    this.map.clicklock = false;
    document.querySelector(".ol-viewport").style.cursor = "default";
    this.map.un("singleclick", this.showLocation);
    this.activated = false;
    this.streetViewMarkerLayer.getSource().clear();
  }

  getIconStyle = rotation => {
    function position(r) {
      const w = 49;
      var i = 1;
      var n = 1;
      for (; i <= 16; i++) {
        let min = 22.5 * (i - 1);
        let max = 22.5 * i;
        if (r >= min && r <= max) {
          n = i;
        }
      }
      return n * w - w;
    }

    const p = position(rotation);
    const w = 48;
    const h = 55;

    return new Style({
      image: new Icon({
        offset: [p, 0],
        anchor: [w / 2, h / 2],
        size: [w, h],
        anchorXUnits: "pixels",
        anchorYUnits: "pixels",
        opacity: 1,
        src: imageBlob
      })
    });
  };

  showLocation = e => {
    var coord = transform(
        e.coordinate,
        this.map.getView().getProjection(),
        "EPSG:4326"
      ),
      location = new this.googleMapsApi.LatLng(coord[1], coord[0]);

    this.streetViewService = new this.googleMapsApi.StreetViewService();
    this.panorama = new this.googleMapsApi.StreetViewPanorama(
      document.getElementById("street-view-window")
    );
    this.addMarker(
      e.coordinate,
      (this.panorama && this.panorama.getPov().heading) || 0
    );
    this.streetViewService.getPanoramaByLocation(
      location,
      50,
      this.displayPanorama.bind(this)
    );
    this.googleMapsApi.event.addListener(
      this.panorama,
      "position_changed",
      () => {
        this.onPositionChanged();
      }
    );
    this.googleMapsApi.event.addListener(this.panorama, "pov_changed", () => {
      this.onPositionChanged();
    });
    this.location = location;
    this.localObserver.emit("locationChanged", location);
  };

  addMarker = (coordinate, rotation) => {
    var feature = new Feature({
      geometry: new Point(coordinate)
    });
    feature.setStyle(this.getIconStyle(rotation));
    this.marker = feature;
    this.streetViewMarkerLayer.getSource().clear();
    this.streetViewMarkerLayer.getSource().addFeature(this.marker);
  };

  onPositionChanged = () => {
    if (!this.panorama.getPosition() || this.activated === false) {
      return;
    }

    var x = this.panorama.getPosition().lng(),
      y = this.panorama.getPosition().lat(),
      b = this.panorama.getPov().heading,
      l = [x, y],
      p = this.map.getView().getProjection(),
      c = transform(l, "EPSG:4326", p);
    this.addMarker(c, b);
  };

  displayPanorama = (data, status) => {
    if (status === this.googleMapsApi.StreetViewStatus.OK) {
      this.imageDate = `Bild tagen: ${data.imageDate}`;
      this.localObserver.emit("changeImageDate", this.imageDate);
      this.panorama.setPano(data.location.pano);
      this.panorama.setPov({ heading: 270, pitch: 0 });
      this.panorama.setVisible(true);
    } else {
      this.imageDate = "Bild saknas för vald position.";
    }
  };

  getMap() {
    return this.map;
  }
}

export default StreetViewModel;
