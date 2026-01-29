import { transform } from "ol/proj";
import Style from "ol/style/Style";
import Icon from "ol/style/Icon";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import Vector from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import { imageBlob } from "./image";

class StreetViewModel {
  constructor(settings) {
    this.map = settings.map;
    this.app = settings.app;
    this.localObserver = settings.localObserver;
    this.location = undefined;

    this.apiReady = false;
    this.apiLoadError = false;
    this.windowVisible = false;
    this._singleClickHandler = null;
    this._positionListener = null;
    this._povListener = null;

    this.streetViewMarkerLayer = new Vector({
      source: new VectorSource({}),
      layerType: "system",
      zIndex: 5000,
      name: "pluginStreetView",
      caption: "StreetView layer",
    });
    this.map.addLayer(this.streetViewMarkerLayer);

    import("load-google-maps-api")
      .then((mod) => {
        const loadGoogleMapsApi = mod.default;
        return loadGoogleMapsApi({ key: settings.apiKey });
      })
      .then((googleMapApi) => {
        this.googleMapsApi = googleMapApi;
        this.apiReady = true;
        if (this.windowVisible) {
          this._doActivate();
        }
        this.localObserver.publish("streetViewApiReady");
      })
      .catch(() => {
        this.apiLoadError = true;
        this.localObserver.publish("streetViewApiLoadError");
      });
  }

  activate() {
    this.windowVisible = true;
    if (this.apiLoadError) {
      return;
    }
    if (this.googleMapsApi) {
      this._doActivate();
    }
  }

  _doActivate() {
    try {
      this.streetViewService = new this.googleMapsApi.StreetViewService();
      const streetViewEl = document.getElementById("street-view-window");
      this.panorama = streetViewEl
        ? new this.googleMapsApi.StreetViewPanorama(streetViewEl)
        : null;
    } catch {
      this.apiLoadError = true;
      this.localObserver.publish("streetViewApiLoadError");
      return;
    }

    if (!this.panorama) {
      return;
    }

    this.map.clickLock.add("streetview");
    document.querySelector(".ol-viewport").style.cursor = "crosshair";

    this._singleClickHandler = (e) => {
      this.coordinate = e.coordinate;
      this.coord = transform(
        this.coordinate,
        this.map.getView().getProjection(),
        "EPSG:4326"
      );
      this.showLocation();
      this.localObserver.publish("maximizeWindow", true);
    };
    this.map.on("singleclick", this._singleClickHandler);
    this.activated = true;
  }

  deactivate() {
    this.windowVisible = false;

    if (this.activated) {
      if (this.panorama && this.googleMapsApi) {
        if (this._positionListener) {
          this._positionListener.remove();
          this._positionListener = null;
        }
        if (this._povListener) {
          this._povListener.remove();
          this._povListener = null;
        }
      }
      this.map.clickLock.delete("streetview");
      document.querySelector(".ol-viewport").style.cursor = "default";
      if (this._singleClickHandler) {
        this.map.un("singleclick", this._singleClickHandler);
        this._singleClickHandler = null;
      }
      this.activated = false;
      this.streetViewMarkerLayer.getSource().clear();
      this.panorama = undefined;
    }

    const win = document.getElementById("street-view-window");
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
    if (!this.panorama || !this.coord || !this.googleMapsApi) {
      return;
    }
    const location = new this.googleMapsApi.LatLng(
      this.coord[1],
      this.coord[0]
    );
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

    if (this._positionListener) {
      this._positionListener.remove();
    }
    if (this._povListener) {
      this._povListener.remove();
    }
    this._positionListener = this.googleMapsApi.event.addListener(
      this.panorama,
      "position_changed",
      () => this.onPositionChanged()
    );
    this._povListener = this.googleMapsApi.event.addListener(
      this.panorama,
      "pov_changed",
      () => this.onPositionChanged()
    );
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
    if (!this.panorama || this.activated === false) {
      return;
    }
    if (!this.panorama.getPosition()) {
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
    if (!this.panorama || this.activated !== true || !this.googleMapsApi) {
      return;
    }
    if (status === this.googleMapsApi.StreetViewStatus.OK) {
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
