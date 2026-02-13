import { transform } from "ol/proj";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Vector from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { imageBlob } from "./exports";
import loadGoogleMapsApi from "../../utils/googleMapsLoader";

class StreetViewModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;
    this.apiKey = settings.apiKey;
    this.location = undefined;
    this.googleMapsApi = null;

    this.streetViewMarkerLayer = new Vector({
      source: new VectorSource({}),
      layerType: "system",
      zIndex: 5000,
      name: "pluginStreetView",
      caption: "StreetView layer",
    });
    this.map.addLayer(this.streetViewMarkerLayer);
  }

  activate() {
    if (this.googleMapsApi) {
      this.doActivate();
      return;
    }
    if (!this.apiKey) {
      console.warn("StreetView: No Google Maps API key configured.");
      this.localObserver.publish(
        "googleMapsApiLoadFailed",
        new Error("No API key")
      );
      return;
    }
    loadGoogleMapsApi(this.apiKey)
      .then((googleMapApi) => {
        this.googleMapsApi = googleMapApi;
        this.doActivate();
      })
      .catch((err) => {
        console.warn("Could not load Google Maps API:", err);
        this.localObserver.publish("googleMapsApiLoadFailed", err);
      });
  }

  doActivate() {
    if (!this.googleMapsApi) return;
    this.map.clickLock.add("streetview");

    this.streetViewService = new this.googleMapsApi.StreetViewService();
    this.panorama = new this.googleMapsApi.StreetViewPanorama(
      document.getElementById("street-view-window")
    );
    document.querySelector(".ol-viewport").style.cursor = "crosshair";
    this.map.on("singleclick", (e) => {
      this.coordinate = e.coordinate;
      this.coord = transform(
        this.coordinate,
        this.map.getView().getProjection(),
        "EPSG:4326"
      );
      this.showLocation();
      this.localObserver.publish("maximizeWindow", true);
    });
    this.activated = true;
  }

  deactivate() {
    this.map.clickLock.delete("streetview");
    document.querySelector(".ol-viewport").style.cursor = "default";
    this.map.un("singleclick", this.showLocation);
    this.activated = false;
    this.streetViewMarkerLayer.getSource().clear();
    this.panorama = undefined;
    var win = document.getElementById("street-view-window");
    if (win) win.innerHTML = "";
  }

  getIconStyle = (rotation) => {
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
        src: imageBlob,
      }),
    });
  };

  showLocation = () => {
    if (!this.panorama || !this.coord) {
      return;
    }
    var location = new this.googleMapsApi.LatLng(this.coord[1], this.coord[0]);
    this.addMarker(
      this.coordinate,
      (this.panorama && this.panorama.getPov().heading) || 0
    );
    this.streetViewService.getPanoramaByLocation(
      location,
      50,
      this.displayPanorama
    );

    setTimeout(() => {
      this.streetViewService.getPanoramaByLocation(
        location,
        50,
        this.displayPanorama
      );
    }, 1000);

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
    this.localObserver.publish("locationChanged", location);
  };

  addMarker = (coordinate, rotation) => {
    var feature = new Feature({
      geometry: new Point(coordinate),
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

    this.coord = this.coordinate = l;
    this.addMarker(c, b);
  };

  displayPanorama = (data, status) => {
    if (
      status === this.googleMapsApi.StreetViewStatus.OK &&
      this.activated === true
    ) {
      this.imageDate = `Bild tagen: ${data.imageDate}`;
      this.localObserver.publish("changeImageDate", this.imageDate);
      this.panorama.setPano(data.location.pano);
      this.panorama.setPov({ heading: 270, pitch: 0 });
      this.panorama.setVisible(true);
    } else {
      this.imageDate = "Bild saknas för vald position.";
      this.localObserver.publish("changeImageDate", this.imageDate);
      this.panorama.setVisible(false);
    }
  };

  getMap() {
    return this.map;
  }
}

export default StreetViewModel;
