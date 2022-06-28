import Geolocation from "ol/Geolocation.js";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import { Vector as VectorLayer } from "ol/layer.js";
import { Vector as VectorSource } from "ol/source.js";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style.js";

class LocationModel {
  constructor(props) {
    this.map = props.map;
    this.localObserver = props.localObserver;
    this.zoomToLocation = true;

    // Create source and layer and add to map. Later on we'll draw features to this layer.
    this.source = new VectorSource({ wrapX: false });
    this.layer = new VectorLayer({
      source: this.source,
      layerType: "system",
      zIndex: 5000,
      name: "pluginLocation",
      caption: "Location layer",
    });
    this.map.addLayer(this.layer);

    // Create two features: one for position (point) and
    // another one for position accuracy (outer ring)
    this.accuracyFeature = new Feature();
    this.positionFeature = new Feature();
    this.positionFeature.setStyle(
      new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({
            color: "#3399CC",
          }),
          stroke: new Stroke({
            color: "#fff",
            width: 2,
          }),
        }),
      })
    );

    // Init geolocation layer where the point will be drawn to
    this.geolocation = new Geolocation({
      trackingOptions: {
        enableHighAccuracy: true,
      },
      projection: this.map.getView().getProjection(),
    });

    // Set up some event handlers for our Geolocation object
    this.geolocation.on("change", this.handleGeolocationChange);
    this.geolocation.on("error", this.handleGeolocationError);
    this.geolocation.on(
      "change:accuracyGeometry",
      this.handleGeolocationChangeAccuracy
    );
    this.geolocation.on(
      "change:position",
      this.handleGeolocationChangePosition
    );
  }

  handleGeolocationChange = (e) => {
    this.localObserver.publish("geolocationChange", {
      accuracy: e.target.getAccuracy(),
      altitude: e.target.getAltitude(),
      altitudeAccuracy: e.target.getAltitudeAccuracy(),
      heading: e.target.getHeading(),
      speed: e.target.getSpeed(),
    });
  };

  handleGeolocationError = (error) => {
    this.localObserver.publish("locationStatus", "error");
    // Yeah, it's clumsy but we want to send another event
    // with the error object, so the first event is not enough.
    this.localObserver.publish("geolocationError", error);
  };

  handleGeolocationChangeAccuracy = (e) => {
    this.accuracyFeature.setGeometry(e.target.getAccuracyGeometry());
  };

  handleGeolocationChangePosition = (e) => {
    const coordinates = e.target.getPosition();
    this.positionFeature.setGeometry(
      coordinates ? new Point(coordinates) : null
    );

    // If we've got new coordinates, make sure to hide the loading indicator
    this.localObserver.publish("locationStatus", "on");

    if (this.zoomToLocation) {
      const maxZoom = this.map.getView().getMaxZoom();
      const minZoom = this.map.getView().getMinZoom();
      const zoom = Math.ceil((maxZoom - minZoom) * 0.5); // Let's end up in the middle zoom
      this.map.getView().animate({ duration: 2500, center: coordinates, zoom });
      this.zoomToLocation = false;
    }
  };

  toggleTracking = (active) => {
    // Inform the View components that we're loading
    this.localObserver.publish("locationStatus", active ? "loading" : "off");

    this.geolocation.setTracking(active);

    // If deactivating, cleanup
    if (active === false) {
      // Remove features from map if tracking has been switched off
      this.layer.getSource().clear();
      // Make sure that we zoom to location next time tracking is activated
      this.zoomToLocation = true;
    }
    // If activating, add two features to map:
    // one for accuracy (the outer ring) and one for position (inner point)
    else {
      this.layer.getSource().addFeature(this.accuracyFeature);
      this.layer.getSource().addFeature(this.positionFeature);
    }
  };

  enable() {
    this.toggleTracking(true);
  }

  disable() {
    this.toggleTracking(false);
  }
}

export default LocationModel;
