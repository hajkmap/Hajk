import React from "react";
import { useSnackbar } from "notistack";
import GeoJSON from "ol/format/GeoJSON";
import kinks from "@turf/kinks";
import { editBus } from "../../../buses/editBus";

/**
 * Custom hook for geometry validation (self-intersection detection)
 * Validates geometries when drawn or edited, showing warnings for self-intersecting polygons/lines
 */
const useGeometryValidation = ({
  map,
  drawModel,
  allowedGeometryTypes,
  activityId,
}) => {
  const { enqueueSnackbar } = useSnackbar();

  // Helper function to validate geometry using turf/kinks
  const validateGeometry = React.useCallback(
    (feature) => {
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
        }
      } catch (error) {
        console.error("Geometry validation error:", error);
      }
    },
    [allowedGeometryTypes, activityId, enqueueSnackbar]
  );

  // Effect to listen for geometry draw/edit events and validate
  React.useEffect(() => {
    if (!drawModel) return;

    // Listen for when a feature is added (drawn)
    const handleFeatureAdded = (event) => {
      const feature = event?.feature;
      if (feature && feature.get("USER_DRAWN")) {
        validateGeometry(feature);
      }
    };

    const source = drawModel.getCurrentVectorSource?.();
    if (source) {
      source.on("addfeature", handleFeatureAdded);
    }

    return () => {
      if (source) {
        source.un("addfeature", handleFeatureAdded);
      }
    };
  }, [drawModel, validateGeometry]);

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

      // Collect all features from attributeeditor layers
      // Note: measurement guides are never synced to attributeeditor layers,
      // so no need to filter them out here
      const allFeatures = [];
      attributeEditorLayers.forEach((layer) => {
        const src = layer.getSource?.();
        if (src) {
          allFeatures.push(...src.getFeatures());
        }
      });

      const feature = allFeatures.find((f) => {
        const fid = f.getId?.() ?? f.get?.("@_fid") ?? f.get?.("id");
        return (
          String(fid) === String(id) || String(fid).endsWith("." + String(id))
        );
      });

      if (feature) {
        validateGeometry(feature);
      }
    });

    return () => offGeomEdited();
  }, [map, validateGeometry]);
};

export default useGeometryValidation;
