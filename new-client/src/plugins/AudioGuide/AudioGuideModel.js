import { GeoJSON, WFS } from "ol/format.js";

export default class AudioGuideModel {
  #app;
  #localObserver;
  #options;
  #map;

  constructor(settings) {
    // Set some private fields
    this.#app = settings.app;
    this.#localObserver = settings.localObserver;
    this.#map = settings.map;
    this.#options = settings.options;
  }

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

    // then post the request and add the received features to a layer
    const response = await fetch(url, {
      method: "POST",
      body: new XMLSerializer().serializeToString(featureRequest),
    });

    const json = await response.json();
    const features = new GeoJSON().readFeatures(json);
    console.log("features: ", features);
    // vectorSource.addFeatures(features);
    // map.getView().fit(vectorSource.getExtent());
  };
}
