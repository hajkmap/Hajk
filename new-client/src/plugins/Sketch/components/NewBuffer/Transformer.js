import GeoJSON from "ol/format/GeoJSON.js";
import buffer from "@turf/buffer";

const createTransformer = (settings) => {
  const { projection } = settings;
  if (!projection) {
    throw new Error("Projection required to initiate Transformer");
  }

  const mapProjection = projection;

  const geoJson = new GeoJSON({
    featureProjection: mapProjection,
  });

  const getBuffered = (feature, distance) => {
    const gjFeatureObject = geoJson.writeFeatureObject(feature);
    const buffered = buffer(gjFeatureObject, distance / 1000, {
      units: "kilometers",
    });
    const olf = geoJson.readFeature(buffered, {
      featureProjection: mapProjection,
    });
    olf.setId(Math.random() * 1e20);
    return olf;
  };

  return {
    getBuffered,
    projection,
    geoJson,
  };
};

export default createTransformer;
