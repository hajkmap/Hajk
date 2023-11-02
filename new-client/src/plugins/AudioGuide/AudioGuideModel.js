import { GeoJSON, WFS } from "ol/format";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import Select from "ol/interaction/Select";
import { Circle, Fill, Stroke, Style } from "ol/style";

const fill = new Fill({
  color: "rgba(255,255,255,0.4)",
});
const stroke = new Stroke({
  color: "red",
  width: 3,
});
const selectedStyle = [
  new Style({
    image: new Circle({
      fill: fill,
      stroke: stroke,
      radius: 5,
    }),
    fill: fill,
    stroke: stroke,
  }),
];

export default class AudioGuideModel {
  #app;
  #localObserver;
  #options;
  #map;
  #allLines;
  #allPoints;
  #availableCategories = new Set();
  #selectInteraction;
  #vectorLayer;
  #vectorSource;

  constructor(settings) {
    this.#app = settings.app;
    this.#localObserver = settings.localObserver;
    this.#map = settings.map;
    this.#options = settings.options;

    // Setup source and layers
    this.#vectorSource = new VectorSource();
    this.#vectorLayer = new VectorLayer({
      source: this.#vectorSource,
      layerType: "system",
      zIndex: 5000,
      name: "pluginAudioGuide",
      caption: "AudioGuide layer",
      // style: new Style({
      //   stroke: new Stroke({
      //     color: "rgba(0, 0, 255, 1.0)",
      //     width: 2,
      //   }),
      // }),
    });

    // Setup interaction and interaction handler
    this.#selectInteraction = new Select({
      hitTolerance: 20,
      style: selectedStyle,
    });

    this.#selectInteraction.on("select", (e) => {
      this.#localObserver.publish("featureSelected", e.selected);
    });

    // Add layer and interaction
    this.#map.addLayer(this.#vectorLayer);
    this.#map.addInteraction(this.#selectInteraction);

    console.log("AudioGuideModel initiated!");
  }

  addFeaturesToLayer = (features) => {
    this.#vectorSource.addFeatures(features);
    this.#map.getView().fit(this.#vectorSource.getExtent());
  };

  getAvailableCategories = () => Array.from(this.#availableCategories);

  init = async () => {
    // Grab features from WFSs
    this.#allLines = await this.#fetchFromService("line");
    this.#allPoints = await this.#fetchFromService("point");

    // Extract available categories. We want all categories that
    // exist on the line service.
    this.#allLines.forEach((l) => {
      l.get("categories")
        ?.split(",")
        .forEach((c) => this.#availableCategories.add(c));
    });

    console.log("Init done");
    console.log(this.#allLines, this.#allPoints, this.#availableCategories);

    // This would add all features to the map, but it's not what we want
    // on init. We'd rather use the filtering and enable only those features
    // whose category has been selected.
    this.addFeaturesToLayer(this.#allLines);
    this.addFeaturesToLayer(this.#allPoints);
  };

  #fetchFromService = async (type = "line", filter) => {
    const { srsName, featureNS, featurePrefix, url } =
      this.#options.serviceSettings;
    // generate a GetFeature request
    const featureRequest = new WFS().writeGetFeature({
      srsName,
      featureNS,
      featurePrefix,
      featureTypes: [type === "line" ? "audioguide_line" : "audioguide_point"],
      outputFormat: "application/json",
      // filter: andFilter(
      //   likeFilter("name", "Mississippi*"),
      //   equalToFilter("waterway", "riverbank")
      // ),
    });

    try {
      // then post the request and add the received features to a layer
      const response = await fetch(url, {
        method: "POST",
        body: new XMLSerializer().serializeToString(featureRequest),
      });

      const json = await response.json();
      const features = new GeoJSON().readFeatures(json);
      this.#localObserver.publish("fetchError", null);
      return features;
    } catch (error) {
      this.#localObserver.publish("fetchError", error);
      console.error(error);
      return [];
    }
  };
}
