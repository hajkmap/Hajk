import GeoJSON from "ol/format/GeoJSON";
import { getCenter, getWidth } from "ol/extent";
import { Circle } from "ol/geom";
import { fromCircle } from "ol/geom/Polygon";
import { get as getProjection, transform } from "ol/proj";
import VectorImportModel from "./VectorImportModel";

const RUNTIME_PROPERTIES = [
  "STYLE_BEFORE_HIDE",
  "EDIT_ACTIVE",
  "HIDDEN",
  "GEOJSON_ID",
  "GEOJSON_IMPORT",
  "KML_ID",
  "KML_IMPORT",
  "GPX_ID",
  "GPX_IMPORT",
];

/*
 * OpenLayers' GeoJSON writer expects an options-object as the second
 * argument. VectorImportModel always passes a document-name string (the
 * KML/GPX convention), so we ignore that argument here.
 *
 * On read we force featureProjection to EPSG:4326 so that VectorImportModel's
 * subsequent 4326 → map-view transform stays correct. If the file carries a
 * legacy "crs" member (common in QGIS exports), we resolve it — including
 * urn:ogc:def:crs:EPSG::XXXX names — and let OL reproject to 4326 first.
 */
class SketchGeoJSON extends GeoJSON {
  readFeatures(source, _options) {
    return super.readFeatures(source, {
      featureProjection: "EPSG:4326",
      dataProjection: this.#resolveDataProjection(source),
    });
  }

  writeFeatures(features, _options) {
    return super.writeFeatures(features);
  }

  #resolveDataProjection = (source) => {
    const object = typeof source === "string" ? JSON.parse(source) : source;
    if (!object?.crs) {
      return "EPSG:4326";
    }
    return this.#resolveCrsProjection(object.crs);
  };

  #resolveCrsProjection = (crs) => {
    let name = null;
    if (crs.type === "name") {
      name = crs.properties?.name;
    } else if (crs.type === "EPSG") {
      name = `EPSG:${crs.properties?.code}`;
    } else {
      throw new Error("Unknown SRS type");
    }
    if (!name) {
      throw new Error("GeoJSON crs is missing a projection name.");
    }
    let projection = getProjection(name);
    if (!projection && /CRS84/i.test(String(name))) {
      projection = getProjection("EPSG:4326");
    }
    if (!projection) {
      const match = String(name).match(/EPSG(?::+|\/)(\d+)/i);
      if (match) {
        projection = getProjection(`EPSG:${match[1]}`);
      }
    }
    if (!projection) {
      throw new Error(
        `Could not import GeoJSON: unknown projection "${name}". The projection must be registered in the map.`
      );
    }
    return projection;
  };
}

/*
 * A model supplying useful GeoJSON-functionality. Extends the generic
 * VectorImportModel with a GeoJSON-specific profile, style-preserving
 * export handling, and circle round-tripping (via CIRCLE_RADIUS /
 * CIRCLE_CENTER, same as KML).
 *
 * Required settings:
 * - layerName: (string): The name of the layer that should be connected to the GeoJSON-model.
 *   If it already exists a layer in the map with the same name, the model will be connected
 *   to that layer. Otherwise, a new vector-layer will be created and added to the map.
 * - map: (olMap): The current map-object.
 * Optional settings:
 * - enableDragAndDrop: (boolean): If true, drag-and-drop of .geojson/.json-files will be active.
 * - drawModel (DrawModel): If supplied, imported features will be drawn using the draw-model.
 * - observer (Observer): Will receive "geoJsonModel.fileImported" when a file has been dropped.
 *
 * The complete public API is documented in VectorImportModel. On top of that,
 * this class keeps the legacy alias importedGeoJsonStillHasFeatures(id).
 */
class GeoJsonModel extends VectorImportModel {
  constructor(settings) {
    super(settings, {
      displayName: "GeoJSON",
      parserFactory: () => new SketchGeoJSON(),
      acceptedFileTypes: [
        "geojson",
        "json",
        "application/geo+json",
        "application/json",
      ],
      fileExtension: "geojson",
      importTagPropertyName: "GEOJSON_IMPORT",
      setShowTextOnImport: true,
      idPropertyName: "GEOJSON_ID",
      observerSubject: "geoJsonModel.fileImported",
      layerCaption: "GeoJSON model",
      layerZIndex: 5002,
      exportMimeType: "application/geo+json;charset=utf-8",
      exportFileNamePrefix: "Ritexport",
      exportDocSuffix: "-geojson-export",
    });
  }

  // Mirrors importedKmlStillHasFeatures / importedGpxStillHasFeatures.
  importedGeoJsonStillHasFeatures = (id) => {
    return this.importedFileStillHasFeatures(id);
  };

  // The draw-model rebuilds circles from CIRCLE_CENTER/CIRCLE_RADIUS as-is,
  // so they must be in the map-view SRS. The file may come from a map with
  // another projection, so they are derived from the (already translated)
  // polygon, whose extent spans exactly the diameter (see fromCircle).
  _prepareImportedFeatureForMapInjection = (feature) => {
    const geometry = feature.getGeometry();
    if (!feature.get("CIRCLE_RADIUS") || geometry?.getType() !== "Polygon") {
      return;
    }
    const extent = geometry.getExtent();
    feature.set("CIRCLE_RADIUS", getWidth(extent) / 2);
    feature.set("CIRCLE_CENTER", JSON.stringify(getCenter(extent)));
  };

  // When a draw-model is supplied, the features are added via it, so that
  // they can be altered by the user just like ordinary drawn features.
  // addKmlFeatures already parses EXTRACTED_STYLE / TEXT_SETTINGS (object or
  // string) and rebuilds real Circle geometries from CIRCLE_RADIUS/CENTER.
  // GeoJSON allows features with a null geometry; the draw-model cannot
  // handle those, so they are skipped.
  // Feature ids are cleared since OL silently refuses to add a feature whose
  // id already exists in the source (e.g. when a file is imported twice).
  _addParsedFeaturesToTarget = (features, { drawModel, source }) => {
    const featuresWithGeometry = features.filter((f) => f.getGeometry());
    featuresWithGeometry.forEach((f) => f.setId(undefined));
    if (drawModel) {
      drawModel.addKmlFeatures(featuresWithGeometry);
    } else {
      source.addFeatures(featuresWithGeometry);
    }
  };

  // Clones the supplied features and returns new features which are transformed
  // so that they are compatible with the GeoJSON format (RFC 7946 / EPSG:4326).
  // Helper features living in the draw-layer (kink markers, measurement
  // guides) are not part of the user's drawing and are left out.
  _makeExportCompatibleFeatures = (features, { viewProjection, drawModel }) => {
    const transformedFeatures = [];
    features.forEach((feature) => {
      if (feature.get("KINK_MARKER") || feature.get("USER_MEASUREMENT_GUIDE")) {
        return;
      }
      const clonedFeature = feature.clone();
      const geomIsCircle = clonedFeature.getGeometry() instanceof Circle;
      if (drawModel) {
        clonedFeature.set(
          "EXTRACTED_STYLE",
          drawModel.extractFeatureStyleInfo(feature)
        );
        const textSettings = feature.get("TEXT_SETTINGS");
        if (textSettings) {
          clonedFeature.set(
            "TEXT_SETTINGS",
            typeof textSettings === "string"
              ? JSON.parse(textSettings)
              : textSettings
          );
        }
      }
      if (geomIsCircle) {
        const circleGeometry = clonedFeature.getGeometry();
        clonedFeature.set("CIRCLE_RADIUS", circleGeometry.getRadius());
        // Written in EPSG:4326 like the geometry, so the file is consistently
        // WGS84 (RFC 7946) and is not tied to this map's projection.
        clonedFeature.set(
          "CIRCLE_CENTER",
          JSON.stringify(
            transform(circleGeometry.getCenter(), viewProjection, "EPSG:4326")
          )
        );
        // GeoJSON has no circle geometry, so the circle is written as a
        // polygon. CIRCLE_RADIUS/CIRCLE_CENTER flag it so that the import can
        // turn it back into a real, editable circle.
        // The number of sides must stay divisible by 4: that puts vertices at
        // 0°, 90°, 180° and 270°, so the polygon's extent spans exactly the
        // diameter. The import derives the circle's center and radius from
        // that extent (see _prepareImportedFeatureForMapInjection).
        const simplifiedGeometry = fromCircle(circleGeometry, 96);
        clonedFeature.setGeometry(simplifiedGeometry);
      }
      RUNTIME_PROPERTIES.forEach((propertyName) => {
        clonedFeature.unset(propertyName);
      });
      clonedFeature.getGeometry().transform(viewProjection, "EPSG:4326");
      transformedFeatures.push(clonedFeature);
    });
    return transformedFeatures;
  };
}

export default GeoJsonModel;
