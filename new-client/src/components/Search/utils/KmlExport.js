import FeatureStyle from "./FeatureStyle";
import { createXML } from "../../../utils/KMLWriter";
import { saveAs } from "file-saver";

import { Circle as CircleStyle, Icon } from "ol/style.js";
import { fromCircle } from "ol/geom/Polygon.js";
import { Circle } from "ol/geom.js";

export default class KmlExport {
  #featureStyle;

  constructor(settings) {
    this.#featureStyle = new FeatureStyle(settings.options);
    this.localObserver = settings.localObserver;
    this.map = settings.map;
    this.bindSubscriptions();
  }

  bindSubscriptions = () => {
    this.localObserver.subscribe("downloadMenu.exportKMLClick", this.export);
  };

  // Exposed method that:
  // - Expects an object as follows:
  //   - {featureCollections: [collections], feature: feature}
  // - If feature is undefined, it exports all features in all collections
  // - Otherwise, it exports the supplied feature. (The collection is needed
  //   to create the labels.
  export = (featureCollections) => {
    const exportFeatures = this.#getStyledFeatures(featureCollections);
    this.#exportFeatures(exportFeatures);
  };

  #getStyledFeatures = (featureCollections) => {
    return featureCollections
      .map((featureCollection) => {
        return featureCollection.value.features.map((feature) => {
          // Loop all Feature Collections, and loop each Feature
          // within in order to extract a new, correctly styled
          // OL Feature that will be used by the KML writer.
          return this.#getStyledFeature(feature);
        });
      })
      .flat();
  };

  #getStyledFeature = (feature) => {
    // Don't modify existing features
    const gjFeature = feature.clone();

    // .clone() doesn't take care of our custom properties,
    // so we must add them manually.
    gjFeature.featureTitle = feature.featureTitle;
    gjFeature.shortFeatureTitle = feature.shortFeatureTitle;

    // Reset the current style before applying new one
    gjFeature.setStyle();
    gjFeature.setStyle(
      this.#featureStyle.getFeatureStyle(gjFeature, "selection")
    );
    return gjFeature;
  };

  #exportFeatures = (features) => {
    try {
      new Blob();
    } catch {
      console.info("KML export not supported on current platform.");
      return;
    }

    const transformed = [];

    features.forEach((feature) => {
      let circleRadius = false;
      if (feature.getGeometry() instanceof Circle) {
        const geom = fromCircle(feature.getGeometry(), 96);
        feature.setGeometry(geom);
        circleRadius = feature.getGeometry().getRadius();
      }
      feature
        .getGeometry()
        .transform(this.map.getView().getProjection(), "EPSG:4326");

      if (feature.getStyle()[1]) {
        feature.setProperties({
          style: JSON.stringify(
            this.#extractStyle(
              feature.getStyle()[1] || feature.getStyle()[0],
              circleRadius
            )
          ),
          geometryType:
            feature.getGeometryName() === "geometry"
              ? feature.getProperties().geometryType
              : feature.getGeometryName(),
        });
      }

      transformed.push(feature);
    });

    if (features.length > 0) {
      const postData = createXML(transformed, "Sökexport");
      saveAs(
        new Blob([postData], {
          type: "application/vnd.google-earth.kml+xml;charset=utf-8",
        }),
        `Hajk - ${new Date().toLocaleString()}.kml`
      );
    }
  };

  #extractStyle = (style, circleRadius) => {
    const styleObj = {};

    styleObj.text = style?.getText()?.getText() ?? "";
    styleObj.image =
      styleObj.getImage() instanceof Icon ? style.getImage().getSrc() : "";
    styleObj.pointRadius =
      style.getImage() instanceof CircleStyle
        ? style.getImage().getRadius()
        : "";
    if (circleRadius) {
      styleObj.radius = circleRadius;
    }
    styleObj.pointColor =
      style.getImage() instanceof CircleStyle
        ? style.getImage().getFill().getColor()
        : "";
    styleObj.fillColor = style.getFill().getColor();
    styleObj.strokeColor = style.getStroke().getColor();
    styleObj.strokeWidth = style.getStroke().getWidth();
    styleObj.strokeDash = style.getStroke().getLineDash();
    return styleObj;
  };
}
