import KML from "ol/format/KML.js";
export default class FirImport {
  constructor(options) {
    this.localObserver = options.localObserver;
    this.layerController = options.layerController;
    this.map = options.map;
    const eventPrefix = options.eventPrefix || "fir";

    this.localObserver.subscribe(
      `${eventPrefix}.file.import`,
      this.handleFileImport
    );
  }

  handleFileImport = (file) => {
    try {
      if (!file) {
        return;
      }
      const fileType = file.type ? file.type : file.name.split(".").pop();

      if (
        fileType !== "kml" &&
        fileType !== "application/vnd.google-earth.kml+xml"
      ) {
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        this.parseKML(reader.result);
      };
      reader.readAsText(file);
    } catch (error) {
      console.log(error);
    }
  };

  parseKML = (str) => {
    let parser = new KML();
    try {
      let features = parser.readFeatures(str);
      features.forEach((feature) => {
        this.translateImportedFeature(feature);
      });
      if (features.length) {
        const targetLayer = this.layerController.getLayer("draw");
        targetLayer.getSource().addFeatures(features);
        this.layerController.zoomToLayer(targetLayer);
      }
    } catch (err) {
      console.warn(err);
    }
  };

  translateImportedFeature(feature) {
    var coordinates = feature.getGeometry().getCoordinates(),
      type = feature.getGeometry().getType(),
      newCoordinates = [];
    feature.setProperties({
      user: true,
    });

    if (
      feature.getProperties().geometryType &&
      feature.getProperties().geometryType !== "Text"
    ) {
      feature.setProperties({
        text: "",
      });
    }

    if (type === "LineString") {
      coordinates.forEach((c, i) => {
        var pairs = [];
        c.forEach((digit) => {
          if (digit !== 0) {
            pairs.push(digit);
          }
        });
        newCoordinates.push(pairs);
      });
      feature.getGeometry().setCoordinates(newCoordinates);
    } else if (type === "Polygon") {
      coordinates.forEach((polygon, i) => {
        newCoordinates[i] = [];
        polygon.forEach((vertex, j) => {
          var pairs = [];
          vertex.forEach((digit) => {
            if (digit !== 0) {
              pairs.push(digit);
            }
          });
          newCoordinates[i].push(pairs);
        });
      });
      feature.getGeometry().setCoordinates(newCoordinates);
    }

    feature
      .getGeometry()
      .transform("EPSG:4326", this.map.getView().getProjection());

    if (
      feature.getProperties().geometryType === "Circle" &&
      feature.getProperties().style
    ) {
      feature.setProperties({
        radius: JSON.parse(feature.getProperties().style).radius,
      });
    }
  }
}
