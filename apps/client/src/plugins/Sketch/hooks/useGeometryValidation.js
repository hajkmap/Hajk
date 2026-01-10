import React from "react";
import { useSnackbar } from "notistack";
import GeoJSON from "ol/format/GeoJSON";
import kinks from "@turf/kinks";
import { Circle, Fill, Stroke, Style } from "ol/style";
import { editBus } from "../../../buses/editBus";

/**
 * Custom hook for geometry validation (self-intersection detection)
 * Validates geometries when drawn or edited, showing warnings for self-intersecting polygons/lines
 */
const useGeometryValidation = ({
  map,
  allowedGeometryTypes,
  activityId,
  showKinkMarkers,
}) => {
  const { enqueueSnackbar } = useSnackbar();

  // Helper function to validate geometry using turf/kinks
  const validateGeometry = React.useCallback(
    (feature, layer) => {
      // Only validate when in AttributeEditor mode (allowedGeometryTypes is set)
      // or when Sketch is in edit mode (activityId === "EDIT")
      const shouldValidate =
        allowedGeometryTypes !== null || activityId === "EDIT";
      if (!shouldValidate) return;

      try {
        const geom = feature?.getGeometry?.();
        if (!geom) return;

        const geomType = geom.getType();
        // Only validate LineString, MultiLineString, Polygon and MultiPolygon geometries
        const validatableTypes = [
          "LineString",
          "MultiLineString",
          "Polygon",
          "MultiPolygon",
        ];
        if (!validatableTypes.includes(geomType)) return;

        const source = layer?.getSource?.();
        if (!source) return;

        // Get feature ID for tracking kink markers
        const featureId =
          feature.getId?.() ?? feature.get?.("@_fid") ?? feature.get?.("id");
        const kinkMarkerId = `KINK_MARKER_${featureId}`;

        // Remove old kink markers for this feature
        const existingMarkers = source
          .getFeatures()
          .filter((f) => f.get("KINK_MARKER_FOR") === featureId);
        existingMarkers.forEach((marker) => source.removeFeature(marker));

        // Convert OpenLayers geometry to GeoJSON for turf
        const format = new GeoJSON();
        const geojson = format.writeGeometryObject(geom);

        // Check for self-intersections (kinks)
        const kinksResult = kinks(geojson);

        if (kinksResult.features && kinksResult.features.length > 0) {
          const geometryName =
            geomType === "Polygon" || geomType === "MultiPolygon"
              ? "Polygonen"
              : "Linjen";
          enqueueSnackbar(
            `${geometryName} har ${kinksResult.features.length} självkorsning${kinksResult.features.length > 1 ? "ar" : ""}. Var god kontrollera och rätta geometrin.`,
            {
              variant: "warning",
              autoHideDuration: 8000,
            }
          );

          // Create visual markers for each kink point (only if enabled)
          if (showKinkMarkers) {
            kinksResult.features.forEach((kinkFeature, index) => {
              const olFeature = format.readFeature(kinkFeature);
              const kinkGeom = olFeature.getGeometry();

              // Create a feature for the kink marker
              const markerFeature = new olFeature.constructor();
              markerFeature.setGeometry(kinkGeom);
              markerFeature.setId(`${kinkMarkerId}_${index}`);
              markerFeature.set("KINK_MARKER_FOR", featureId, true);
              markerFeature.set("KINK_MARKER", true, true);

              // Set red circle style
              markerFeature.setStyle(
                new Style({
                  image: new Circle({
                    radius: 8,
                    fill: new Fill({ color: "rgba(255, 0, 0, 0.6)" }),
                    stroke: new Stroke({ color: "#ff0000", width: 2 }),
                  }),
                  zIndex: 10000, // Make sure markers are on top
                })
              );

              source.addFeature(markerFeature);
            });
          }
        }
      } catch (error) {
        console.error("Geometry validation error:", error);
      }
    },
    [allowedGeometryTypes, activityId, enqueueSnackbar, showKinkMarkers]
  );

  // Effect to listen for geometry draw/edit events and validate
  React.useEffect(() => {
    if (!map) return;

    // Find all attributeeditor layers and listen to addfeature events
    const layers = map.getLayers()?.getArray?.() || [];
    const attributeEditorLayers = layers.filter(
      (lyr) => lyr?.get?.("name") === "attributeeditor"
    );

    const addHandlers = new Map();
    const removeHandlers = new Map();

    attributeEditorLayers.forEach((layer) => {
      const source = layer.getSource?.();
      if (source) {
        // Create handler for feature added
        const handleFeatureAdded = (event) => {
          const feature = event?.feature;
          // Skip kink markers
          if (feature?.get("KINK_MARKER")) return;
          if (feature && feature.get("USER_DRAWN")) {
            validateGeometry(feature, layer);
          }
        };

        // Create handler for feature removed - clean up kink markers
        const handleFeatureRemoved = (event) => {
          const feature = event?.feature;
          // Skip if this is a kink marker itself
          if (feature?.get("KINK_MARKER")) return;

          const featureId =
            feature?.getId?.() ??
            feature?.get?.("@_fid") ??
            feature?.get?.("id");

          // Remove kink markers for this feature
          const existingMarkers = source
            .getFeatures()
            .filter((f) => f.get("KINK_MARKER_FOR") === featureId);
          existingMarkers.forEach((marker) => source.removeFeature(marker));
        };

        addHandlers.set(layer, handleFeatureAdded);
        removeHandlers.set(layer, handleFeatureRemoved);
        source.on("addfeature", handleFeatureAdded);
        source.on("removefeature", handleFeatureRemoved);
      }
    });

    // Also listen for new layers being added
    const mapLayers = map.getLayers();
    const onLayerAdd = (e) => {
      const layer = e.element || e.layer;
      if (layer?.get?.("name") === "attributeeditor") {
        const source = layer.getSource?.();
        if (source) {
          const handleFeatureAdded = (event) => {
            const feature = event?.feature;
            // Skip kink markers
            if (feature?.get("KINK_MARKER")) return;
            if (feature && feature.get("USER_DRAWN")) {
              validateGeometry(feature, layer);
            }
          };

          const handleFeatureRemoved = (event) => {
            const feature = event?.feature;
            if (feature?.get("KINK_MARKER")) return;

            const featureId =
              feature?.getId?.() ??
              feature?.get?.("@_fid") ??
              feature?.get?.("id");

            const existingMarkers = source
              .getFeatures()
              .filter((f) => f.get("KINK_MARKER_FOR") === featureId);
            existingMarkers.forEach((marker) => source.removeFeature(marker));
          };

          addHandlers.set(layer, handleFeatureAdded);
          removeHandlers.set(layer, handleFeatureRemoved);
          source.on("addfeature", handleFeatureAdded);
          source.on("removefeature", handleFeatureRemoved);
        }
      }
    };

    mapLayers.on?.("add", onLayerAdd);

    return () => {
      for (const [layer, handler] of addHandlers.entries()) {
        const source = layer.getSource?.();
        if (source) {
          source.un("addfeature", handler);
        }
      }
      for (const [layer, handler] of removeHandlers.entries()) {
        const source = layer.getSource?.();
        if (source) {
          source.un("removefeature", handler);
        }
      }
      mapLayers.un?.("add", onLayerAdd);
    };
  }, [map, validateGeometry]);

  // Effect to listen for modify events from AttributeEditor
  React.useEffect(() => {
    const offGeomEdited = editBus.on("sketch:geometry-edited", (ev) => {
      const { id } = ev.detail || {};
      if (id == null) return;

      // Find the feature in attributeeditor layer(s)
      // Note: sketch:geometry-edited is only emitted for features in attributeeditor layers
      const layers = map?.getLayers?.()?.getArray?.() || [];
      const attributeEditorLayers = layers.filter(
        (lyr) => lyr?.get?.("name") === "attributeeditor"
      );

      // Find the feature and its layer
      let foundFeature = null;
      let foundLayer = null;

      for (const layer of attributeEditorLayers) {
        const src = layer.getSource?.();
        if (!src) continue;

        const feature = src.getFeatures().find((f) => {
          const fid = f.getId?.() ?? f.get?.("@_fid") ?? f.get?.("id");
          return (
            String(fid) === String(id) || String(fid).endsWith("." + String(id))
          );
        });

        if (feature) {
          foundFeature = feature;
          foundLayer = layer;
          break;
        }
      }

      if (foundFeature && foundLayer) {
        validateGeometry(foundFeature, foundLayer);
      }
    });

    return () => offGeomEdited();
  }, [map, validateGeometry]);

  // Effect to remove all kink markers when showKinkMarkers is disabled
  React.useEffect(() => {
    if (!map || showKinkMarkers) return;

    // Find all attributeeditor layers and remove all kink markers
    const layers = map.getLayers()?.getArray?.() || [];
    const attributeEditorLayers = layers.filter(
      (lyr) => lyr?.get?.("name") === "attributeeditor"
    );

    attributeEditorLayers.forEach((layer) => {
      const source = layer.getSource?.();
      if (!source) return;

      const kinkMarkers = source
        .getFeatures()
        .filter((f) => f.get("KINK_MARKER"));
      kinkMarkers.forEach((marker) => source.removeFeature(marker));
    });
  }, [map, showKinkMarkers]);
};

export default useGeometryValidation;
