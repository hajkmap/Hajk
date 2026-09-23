import GPX from "ol/format/GPX";
import VectorImportModel from "./VectorImportModel";

/*
 * A model supplying useful GPX-functionality. Extends the generic
 * VectorImportModel with a GPX-specific profile and export handling.
 *
 * Required settings:
 * - layerName: (string): The name of the layer that should be connected to the GPX-model.
 *   If it already exists a layer in the map with the same name, the model will be connected
 *   to that layer. Otherwise, a new vector-layer will be created and added to the map.
 * - map: (olMap): The current map-object.
 * Optional settings:
 * - enableDragAndDrop: (boolean): If true, drag-and-drop of .gpx-files will be active.
 * - drawModel (DrawModel): If supplied, imported features will be drawn using the draw-model.
 * - observer (Observer): Will receive "gpxModel.fileImported" when a file has been dropped.
 *
 * The complete public API is documented in VectorImportModel. On top of that,
 * this class keeps the legacy alias importedGpxStillHasFeatures(id).
 */
class GpxModel extends VectorImportModel {
  constructor(settings) {
    super(settings, {
      displayName: "GPX",
      parserFactory: () => new GPX(),
      acceptedFileTypes: ["gpx", "application/gpx+xml"],
      fileExtension: "gpx",
      importTagPropertyName: "GPX_IMPORT",
      setShowTextOnImport: false,
      idPropertyName: "GPX_ID",
      observerSubject: "gpxModel.fileImported",
      layerCaption: "GPX model",
      layerZIndex: 5001,
      exportMimeType: "application/gpx+xml;charset=utf-8",
      exportFileNamePrefix: "Gpxexport",
      exportDocSuffix: "-gpx-export",
    });
  }

  // Kept for backwards-compatibility with the pre-refactor public API.
  importedGpxStillHasFeatures = (id) => {
    return this.importedFileStillHasFeatures(id);
  };

  // Note: _prepareImportedFeatureForMapInjection is intentionally not
  // overridden - GPX features are shown as parsed, no styling is applied.

  // Clones the supplied features and returns new features which are transformed
  // so that they are compatible with the .gpx-format.
  _makeExportCompatibleFeatures(features, { viewProjection }) {
    // Declare an array where we can push the transformed features.
    const transformedFeatures = [];
    // Looping trough all the features, creating a clone of each, this clone
    // will be transformed and then pushed to the transformedFeatures-array.
    features.forEach((feature) => {
      const geometry = feature.getGeometry();
      const geometryType = geometry.getType();

      // Only include features with supported geometry types
      if (["Point", "LineString", "MultiLineString"].includes(geometryType)) {
        // Create the feature-clone
        const clonedFeature = feature.clone();
        // Transform the geometry to WGS:84 so the gpx-interpreters will be happy.
        clonedFeature.getGeometry().transform(viewProjection, "EPSG:4326");
        // Finally, we can push the transformed feature to the
        // transformedFeatures-array.
        transformedFeatures.push(clonedFeature);
      }
    });
    return transformedFeatures;
  }
}

export default GpxModel;
