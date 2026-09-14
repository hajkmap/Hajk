import GeoJSON from "ol/format/GeoJSON";
import buffer from "@turf/buffer";
import union from "@turf/union";
import lineSplit from "@turf/line-split";
import lineIntersect from "@turf/line-intersect";
import difference from "@turf/difference";
import { polygon as turfPolygon } from "@turf/helpers";
import { transform } from "ol/proj";

class HajkTransformer {
  #mapProjection;
  #geoJson;

  constructor(settings) {
    const { projection } = settings;
    if (!projection) {
      throw new Error("Projection required to initiated HajkTransformer");
    }

    this.#mapProjection = projection;

    this.#geoJson = new GeoJSON({
      // Tell GeoJSON that our features will come in the map's projection
      featureProjection: this.#mapProjection,
    });
  }

  getUnion(feature1, feature2) {
    // Create a GeoJSON Feature object by reading our OL Feature.
    // This object will be in WGS84.
    const f1 = this.#geoJson.writeFeatureObject(feature1);
    const f2 = this.#geoJson.writeFeatureObject(feature2);

    // Create a FeatureCollection containing both features
    const featureCollection = {
      type: "FeatureCollection",
      features: [f1, f2],
    };

    // union the features in the collection
    const unionFeatureObject = union(featureCollection);

    // convert GeoJSON feature object back to OpenLayer Feature using the maps projection.
    const olf = this.#geoJson.readFeature(unionFeatureObject, {
      // Tell the format reader to return features in our map's projection!
      featureProjection: this.#mapProjection,
    });
    olf.setId(Math.random() * 1e20);
    return olf;
  }

  getBuffered(feature, distance) {
    // Create a GeoJSON Feature object by reading our OL Feature.
    // This object will be in WGS84.
    const gjFeatureObject = this.#geoJson.writeFeatureObject(feature);

    // Create a buffer around the GeoJSON Feature object using buffer().
    // The distance we pass counionmes in meters, but buffer() expects kilometers,
    // hence the division by 1000.
    // The created buffered object will be in WGS84.
    const buffered = buffer(gjFeatureObject, distance / 1000, {
      units: "kilometers",
    });

    // buffer() has now created a new GeoJSON Feature Object. Before we
    // can add it back to the OL map, we must make an OL Feature of it.
    // In addition, the OL Feature we're about to create must be in the
    // map's projection (not WGS84 which it is right now).
    // So we use readFeature and pass the featureProjection as an argument.
    // This way readFeature will create a Feature in map's projection
    // and we can return it so it can be added to the map.
    const olf = this.#geoJson.readFeature(buffered, {
      // Tell the format reader to return features in our map's projection!
      featureProjection: this.#mapProjection,
    });
    olf.setId(Math.random() * 1e20);
    return olf;
  }

  getCoordinatesWithProjection(x, y, targetProjection, numberOfDecimals = 4) {
    const newCoords = transform([x, y], this.#mapProjection, targetProjection);
    return {
      x: parseFloat(newCoords[0].toFixed(numberOfDecimals)),
      y: parseFloat(newCoords[1].toFixed(numberOfDecimals)),
    };
  }

  getSplit(feature, cuttingLine) {
    const featureGeoJSON = this.#geoJson.writeFeatureObject(feature);
    const cuttingGeoJSON = this.#geoJson.writeFeatureObject(cuttingLine);

    const geomType = featureGeoJSON.geometry.type;

    if (geomType === "LineString") {
      return this.#splitLineString(featureGeoJSON, cuttingGeoJSON);
    } else if (geomType === "Polygon") {
      return this.#splitPolygon(featureGeoJSON, cuttingGeoJSON);
    }

    throw new Error(`Geometrityp ${geomType} kan inte delas`);
  }

  #splitLineString(lineFeature, cuttingLine) {
    const result = lineSplit(lineFeature, cuttingLine);
    if (!result.features || result.features.length < 2) {
      throw new Error(
        "Linjen kunde inte delas - klipplinjen måste korsa linjen"
      );
    }
    return result.features.map((f) => this.#toOLFeature(f));
  }

  #splitPolygon(polygonFeature, cuttingLine) {
    // Check that cutting line intersects the polygon at least twice
    const intersections = lineIntersect(polygonFeature, cuttingLine);
    if (intersections.features.length < 2) {
      throw new Error("Klipplinjen måste korsa polygonen på minst två ställen");
    }

    // Create a thin buffer around the cutting line to use with difference
    const bufferedLine = buffer(cuttingLine, 0.0001, { units: "kilometers" });

    // Use difference to cut the polygon
    // Turf v7 takes a FeatureCollection with both features
    const result = difference({
      type: "FeatureCollection",
      features: [polygonFeature, bufferedLine],
    });

    if (!result) {
      throw new Error("Kunde inte dela polygonen");
    }

    // If the result is a MultiPolygon, we have successfully split
    if (result.geometry.type === "MultiPolygon") {
      const polygons = result.geometry.coordinates.map((coords) => {
        return turfPolygon(coords);
      });
      return polygons.map((p) => this.#toOLFeature(p));
    }

    // If still a single polygon, the cut didn't work as expected
    if (result.geometry.type === "Polygon") {
      throw new Error(
        "Klipplinjen delade inte polygonen helt - se till att linjen korsar hela polygonen"
      );
    }

    throw new Error("Oväntat resultat vid delning av polygon");
  }

  #toOLFeature(geoJsonFeature) {
    const olf = this.#geoJson.readFeature(geoJsonFeature, {
      featureProjection: this.#mapProjection,
    });
    olf.setId(Math.random() * 1e20);
    return olf;
  }
}

export default HajkTransformer;
