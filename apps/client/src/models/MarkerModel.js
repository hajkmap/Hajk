import Feature from "ol/Feature";
import Point from "ol/geom/Point";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Translate from "ol/interaction/Translate";
import { Style, Icon } from "ol/style";

const CLICK_LOCK_KEY = "externalMarker";

/**
 * @summary This implements a movable marker that can be controlled outside of
 * Hajk, like an iframe or webview.
 *
 * @description Creates a vector layer named
 * externalMarker that is not visible in LayerSwitcher.
 * The feature can be placed if clicked or moved my dragging.
 * Events report if the marker is moved through subscribe() or the hajk:markerMoved CustomEvent on `window`.
 *
 * Consumed through window.hajkPublicApi.marker that App.jsx makes available wehn the app has loaded.
 * Ex:
 *   const hajk = iframe.contentWindow;
 *   await hajk.hajkPublicApi.ready;
 *
 *   use setClickToPlace(true) to grab clickfocus and place the initial marker.
 *
 */
export default class MarkerModel {
  #map;
  #source;
  #layer;
  #feature = null;
  #translate;
  #style;
  #subscribers = new Set();
  #clickToPlace = false;

  constructor(map) {
    this.#map = map;
    // use the same marker as the coordinates plugin
    this.#style = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        scale: 0.15,
        src: "marker.png",
      }),
    });

    this.#source = new VectorSource();

    this.#layer = new VectorLayer({
      source: this.#source,
      style: this.#style,
      caption: "External marker",
      name: "externalMarker",
      // the layer should not be visible in the layerswitcher
      layerType: "system",
      // we ant to ignore the infoclick for this layer
      ignoreInFeatureInfo: true,
      zIndex: 5003,
    });
    this.#map.addLayer(this.#layer);

    this.#translate = new Translate({
      layers: [this.#layer],
      hitTolerance: 10,
    });
    this.#translate.on("translateend", () => this.#notify("drag"));
    this.#map.addInteraction(this.#translate);

    // click to place the when no coordinates has been supplied
    this.#map.on("singleclick", this.#handlePlacementClick);
  }

  set = (coordinate, options = {}) => {
    const { center = false } = options;

    // Dont show the marker if we are supplied invalid coordinate pair
    if (
      !Array.isArray(coordinate) ||
      coordinate.length < 2 ||
      !Number.isFinite(coordinate[0]) ||
      !Number.isFinite(coordinate[1])
    ) {
      console.warn("MarkerModel.set: [x, y] but got ", coordinate);
      return false;
    }

    const [x, y] = coordinate;

    // if the caller supplies [0,0] which generally indicates that no coordinates are
    // found, we treat them as no coordinates
    if (x === 0 && y === 0) {
      this.clear();
      return false;
    }

    if (this.#feature === null) {
      this.#feature = new Feature({ geometry: new Point([x, y]) });
      this.#feature.setStyle(this.#style);
      this.#source.addFeature(this.#feature);
    } else {
      this.#feature.getGeometry().setCoordinates([x, y]);
    }

    if (center === true) {
      this.#map.getView().animate({ center: [x, y], duration: 250 });
    }

    // We should now have a valid marker, and the clicklock can be released, and infoclick enabled again
    this.#updateClickLock();

    return true;
  };

  get = () => {
    return this.#feature === null
      ? null
      : this.#feature.getGeometry().getCoordinates().slice();
  };

  clear = () => {
    this.#source.clear();
    this.#feature = null;
    this.#updateClickLock();
  };

  setClickToPlace = (enabled) => {
    this.#clickToPlace = enabled === true;
    this.#updateClickLock();
    return this.#clickToPlace;
  };

  #updateClickLock = () => {
    if (this.#clickToPlace && this.#feature === null) {
      this.#map.clickLock.add(CLICK_LOCK_KEY);
    } else {
      this.#map.clickLock.delete(CLICK_LOCK_KEY);
    }
  };

  #handlePlacementClick = (event) => {
    if (!this.#clickToPlace || this.#feature !== null) {
      return;
    }

    // Only handle the clicks if no other tools has a click locked
    if (
      this.#map.clickLock.size !== 1 ||
      !this.#map.clickLock.has(CLICK_LOCK_KEY)
    ) {
      return;
    }

    if (this.set(event.coordinate) === true) {
      // notify those who are listening about the placement event
      this.#notify("placement");
    }
  };

  subscribe = (callback) => {
    if (typeof callback !== "function") {
      console.warn(
        "MarkerModel.subscribe: you need to pass a function to recieve the callback"
      );
      return () => {};
    }

    this.#subscribers.add(callback);
    return () => this.#subscribers.delete(callback);
  };

  #notify = (cause) => {
    const detail = {
      ...this.#getCoordinatesWithProjection(),
      cause,
    };

    this.#subscribers.forEach((callback) => {
      try {
        callback(detail);
      } catch (error) {
        console.error(error);
      }
    });

    window.dispatchEvent(new CustomEvent("hajk:markerMoved", { detail }));
  };

  #getCoordinatesWithProjection = () => {
    const coordinate = this.get();
    if (coordinate === null) {
      return { x: null, y: null, projection: this.#getProjection() };
    }
    return {
      x: coordinate[0],
      y: coordinate[1],
      projection: this.#getProjection(),
    };
  };

  #getProjection = () => this.#map.getView().getProjection().getCode();
}
