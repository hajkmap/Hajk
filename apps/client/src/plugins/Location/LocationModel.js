import Geolocation from "ol/Geolocation";
import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { easeOut } from "ol/easing";
import { getVectorContext } from "ol/render";
import { unByKey } from "ol/Observable";
import { Circle as CircleStyle, Fill, Stroke, Style } from "ol/style";

class LocationModel {
  #tracking = false;
  #following = false;
  #autoRotate = false;
  #positionReceived = false;

  constructor(props) {
    this.map = props.map;
    this.localObserver = props.localObserver;
    this.zoomToLocation = true;
    this.centerOnUpdate = false;
    this.showLocationFollow = false;

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
    const heading = e.target.getHeading();

    this.localObserver.publish("geolocationChange", {
      accuracy: e.target.getAccuracy(),
      altitude: e.target.getAltitude(),
      altitudeAccuracy: e.target.getAltitudeAccuracy(),
      heading,
      speed: e.target.getSpeed(),
    });

    if (this.#autoRotate && typeof heading === "number") {
      // Heading is in radians, clockwise from north. Negate it so the
      // direction of travel is rotated to always point "up" on screen.
      this.map.getView().setRotation(-heading);
    }
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

    // Also update the accuracy feature's geometry to stay centered on the current position
    // This ensures the red ring stays centered on the blue dot as the user moves
    if (coordinates) {
      this.accuracyFeature.setGeometry(new Point(coordinates));
    }

    this.#positionReceived = true;

    // If we've got new coordinates, make sure to hide the loading indicator
    // Also make sure we are tracking otherwise we should not send locationstatus
    if (this.#tracking && coordinates) {
      this.localObserver.publish("locationStatus", "on");
    }

    if (this.zoomToLocation) {
      const maxZoom = this.map.getView().getMaxZoom();
      const minZoom = this.map.getView().getMinZoom();
      const zoom = Math.ceil((maxZoom - minZoom) * 0.5); // Let's end up in the middle zoom
      this.map.getView().animate({ duration: 2500, center: coordinates, zoom });
      this.zoomToLocation = false;
    }

    // If the initial zoom already happened and we want to update the map center to "follow" the user's position
    if (!this.zoomToLocation && this.centerOnUpdate) {
      this.map.getView().setCenter(coordinates);
    }
  };

  toggleFollow = (active) => {
    if (active === this.#following) return;
    this.#following = active;
    this.centerOnUpdate = active;
  };

  toggleAutoRotate = (active) => {
    if (active === this.#autoRotate) return;
    this.#autoRotate = active;
    if (!active) {
      // Reset to north-up when auto-rotate is turned off
      this.map.getView().setRotation(0);
    }
  };

  toggleTracking = (active) => {
    if (active === this.#tracking) return;
    this.#tracking = active;

    // Inform the View components that we're loading
    this.localObserver.publish("locationStatus", active ? "loading" : "off");

    this.geolocation.setTracking(active);

    // If deactivating, cleanup
    if (active === false) {
      // Lets cleanup the flash animating, so we don't get multiple animations.
      clearInterval(this.flashInterval);
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

      // Finally, start flashing the position feature
      this.flashInterval = setInterval(() => {
        this.flash(this.positionFeature);
      }, 3000);
    }
  };

  getState() {
    return {
      track: this.#tracking,
      follow: this.#following,
      positionReceived: this.#positionReceived,
    };
  }

  // Flash handler: sets up the animation and creates a handler for the postrender
  flash = (feature) => {
    // Helper: takes care of the actual animation.
    const animate = (event) => {
      // Event is the postrender event that happens - surprise - after render,
      // because we actually tell the map to render (see at the end of this function)
      const frameState = event.frameState;
      const elapsed = frameState.time - start;
      if (elapsed >= duration) {
        // Remove the listener when time has elapsed
        unByKey(listenerKey);
        return;
      }

      // Grab the context that will hold our animated feature
      const vectorContext = getVectorContext(event);
      const elapsedRatio = elapsed / duration;

      // Radius will be 5 at start and 30 at end
      const radius = easeOut(elapsedRatio) * 25 + 5;
      const opacity = easeOut(1 - elapsedRatio);

      const style = new Style({
        image: new CircleStyle({
          radius: radius,
          stroke: new Stroke({
            color: "rgba(255, 0, 0, " + opacity + ")",
            width: 0.25 + opacity,
          }),
        }),
      });

      vectorContext.setStyle(style);
      // Read the feature's geometry fresh on every frame (rather than a
      // one-time clone) so the ring follows the position if it moves
      // while the animation is still running.
      const geometry = feature.getGeometry();
      if (geometry) {
        vectorContext.drawGeometry(geometry);
      }

      // This ensure that the listener for postrender will be triggered
      this.map.render();
    };

    // Setup the animation
    const duration = 3000;
    const start = Date.now();
    // Save the listener key so we can unsubscribe when animation is done
    const listenerKey = this.layer.on("postrender", animate);
    // We need to force render, otherwise postrender won't run the first time.
    this.map.render();
  };

  enable() {
    this.toggleTracking(true);
  }

  disable() {
    this.toggleTracking(false);
    // Also disable follow, the default state is turned off.
    this.disableFollow(true);
    // Also disable auto-rotate, the default state is turned off.
    this.disableAutoRotate(true);
  }

  enableFollow() {
    this.toggleFollow(true);
  }

  disableFollow() {
    this.toggleFollow(false);
  }

  enableAutoRotate() {
    this.toggleAutoRotate(true);
  }

  disableAutoRotate() {
    this.toggleAutoRotate(false);
  }
}

export default LocationModel;
