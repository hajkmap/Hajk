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
  export = (exportItems) => {
    const { featureCollections, feature } = exportItems;
    const exportFeatures = this.#getStyledFeatures(featureCollections, feature);
    this.#exportFeatures(exportFeatures);
  };

  #getStyledFeatures = (featureCollections, feature) => {
    if (feature) {
      // If a feature is supplied, we assume that we only got one
      // collection passed.
      const featureCollection = featureCollections[0];
      const displayFields = featureCollection?.source?.displayFields ?? [];

      return [this.#getStyledFeature(feature, displayFields)];
    } else {
      return featureCollections
        .map((featureCollection) => {
          const displayFields = featureCollection?.source?.displayFields ?? [];
          return featureCollection.value.features.map((feature) => {
            return this.#getStyledFeature(
              feature,
              feature.featureTitle ?? "",
              displayFields
            );
          });
        })
        .flat();
    }
  };

  #getStyledFeature = (feature, featureTitle, displayFields) => {
    const gjFeature = feature.clone();
    gjFeature.setStyle(); // We must reset the current style before applying new...
    gjFeature.setStyle(
      this.#featureStyle.getFeatureStyle(
        gjFeature,
        featureTitle,
        displayFields,
        "selection"
      )
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
