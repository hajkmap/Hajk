import GeoJSON from "ol/format/GeoJSON.js";
import buffer from "@turf/buffer";
import union from "@turf/union";
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

    // union the 2 incoming geometries.
    const unionFeatureObject = union(f1.geometry, f2.geometry);

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
}

export default HajkTransformer;
