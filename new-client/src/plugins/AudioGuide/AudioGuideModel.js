import { GeoJSON, WFS } from "ol/format.js";

export default class AudioGuideModel {
  #app;
  #localObserver;
  #options;
  #map;
  #allLines;
  #allPoints;
  #availableCategories = new Set();

  constructor(settings) {
    this.#app = settings.app;
    this.#localObserver = settings.localObserver;
    this.#map = settings.map;
    this.#options = settings.options;
  }

  getAvailableCategories = () => this.#availableCategories || [];

  init = async () => {
    // Grab features from WFSs
    this.#allLines = await this.fetchFromService("line");
    this.#allPoints = await this.fetchFromService("point");

    // Extract available categories. We want all categories that
    // exist on the line service.
    this.#allLines.forEach((l) => {
      l.get("categories")
        ?.split(",")
        .forEach((c) => this.#availableCategories.add(c));
    });

    console.log("Init done");
    console.log(this.#allLines, this.#allPoints, this.#availableCategories);
  };

  fetchFromService = async (type = "line") => {
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
    // vectorSource.addFeatures(features);
    // map.getView().fit(vectorSource.getExtent());
  };
}
