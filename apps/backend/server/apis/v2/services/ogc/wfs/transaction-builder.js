import { XMLBuilder } from "fast-xml-parser";

const xmlBuilder = new XMLBuilder({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  format: true,
  suppressEmptyNode: true,
});

export function buildWfsTransactionXml(options) {
  const {
    version = "1.1.0",
    typeName,
    srsName,
    geometryName = "geometry",
    namespace,
    inserts = [],
    updates = [],
    deletes = [],
  } = options;

  const isV2 = version.startsWith("2.");
  const gmlNs = isV2
    ? "http://www.opengis.net/gml/3.2"
    : "http://www.opengis.net/gml";
  const wfsNs = isV2
    ? "http://www.opengis.net/wfs/2.0"
    : "http://www.opengis.net/wfs";

  // Split only on first colon to handle "workspace:schema:layer" correctly
  const colonIndex = typeName.indexOf(":");
  const [nsPrefix, localName] =
    colonIndex !== -1
      ? [typeName.slice(0, colonIndex), typeName.slice(colonIndex + 1)]
      : ["feature", typeName];

  // Use provided namespace or generate from prefix
  const namespaceUri = namespace || `http://hajk.se/wfs/${nsPrefix}`;

  const transaction = {
    "wfs:Transaction": {
      "@_service": "WFS",
      "@_version": version,
      "@_xmlns:wfs": wfsNs,
      "@_xmlns:gml": gmlNs,
      "@_xmlns:ogc": "http://www.opengis.net/ogc",
      [`@_xmlns:${nsPrefix}`]: namespaceUri,
    },
  };

  const operations = [];

  // INSERT operations
  inserts.forEach((feature) => {
    operations.push([
      "wfs:Insert",
      {
        [`${nsPrefix}:${localName}`]: buildFeatureXml(
          feature,
          geometryName,
          srsName,
          gmlNs
        ),
      },
    ]);
  });

  // UPDATE operations
  updates.forEach((feature) => {
    // Skip updates without valid feature ID
    if (feature.id == null || feature.id === "") {
      return;
    }

    const properties = [];

    Object.entries(feature.properties || {}).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== "") {
        properties.push([
          "wfs:Property",
          {
            "wfs:Name": key,
            "wfs:Value": value,
          },
        ]);
      }
    });

    if (feature.geometry) {
      properties.push([
        "wfs:Property",
        {
          "wfs:Name": geometryName,
          "wfs:Value": buildGeometryXml(feature.geometry, srsName, gmlNs),
        },
      ]);
    }

    if (properties.length === 0) return;

    operations.push([
      "wfs:Update",
      {
        "@_typeName": typeName,
        "wfs:Property":
          properties.length === 1
            ? properties[0][1]
            : properties.map((p) => p[1]),
        "ogc:Filter": {
          "ogc:FeatureId": {
            "@_fid": feature.id,
          },
        },
      },
    ]);
  });

  // DELETE operations
  deletes.forEach((featureId) => {
    // Skip deletes without valid feature ID
    if (featureId == null || featureId === "") {
      return;
    }

    operations.push([
      "wfs:Delete",
      {
        "@_typeName": typeName,
        "ogc:Filter": {
          "ogc:FeatureId": {
            "@_fid": featureId,
          },
        },
      },
    ]);
  });

  // Add operations to transaction in proper WFS-T order
  // Group operations by type while maintaining order: Insert -> Update -> Delete
  const groupedOps = {
    "wfs:Insert": [],
    "wfs:Update": [],
    "wfs:Delete": [],
  };

  operations.forEach(([key, value]) => {
    groupedOps[key].push(value);
  });

  // Add grouped operations to transaction
  ["wfs:Insert", "wfs:Update", "wfs:Delete"].forEach((opType) => {
    const ops = groupedOps[opType];
    if (ops.length === 1) {
      transaction["wfs:Transaction"][opType] = ops[0];
    } else if (ops.length > 1) {
      transaction["wfs:Transaction"][opType] = ops;
    }
  });

  const xml = xmlBuilder.build(transaction);
  return `<?xml version="1.0" encoding="UTF-8"?>\n${xml}`;
}

function buildFeatureXml(feature, geometryName, srsName, gmlNs) {
  const featureObj = {};

  Object.entries(feature.properties || {}).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== "") {
      featureObj[key] = value;
    }
  });

  if (feature.geometry) {
    featureObj[geometryName] = buildGeometryXml(
      feature.geometry,
      srsName,
      gmlNs
    );
  }

  return featureObj;
}

function buildGeometryXml(geojson, srsName, gmlNs) {
  // GeometryCollection uses geometries, not coordinates
  if (geojson.type === "GeometryCollection") {
    if (!Array.isArray(geojson.geometries)) {
      throw new Error("GeometryCollection requires geometries array");
    }
    return {
      "gml:MultiGeometry": {
        "@_srsName": srsName,
        "gml:geometryMember": geojson.geometries.map((g) =>
          buildGeometryXml(g, srsName, gmlNs)
        ),
      },
    };
  }

  // All other geometry types require coordinates
  const coords = geojson.coordinates;
  if (!Array.isArray(coords)) {
    throw new Error(`${geojson.type} requires coordinates array`);
  }

  switch (geojson.type) {
    case "Point":
      return {
        "gml:Point": {
          "@_srsName": srsName,
          "gml:pos": coords.join(" "),
        },
      };

    case "LineString":
      return {
        "gml:LineString": {
          "@_srsName": srsName,
          "gml:posList": coords.flat().join(" "),
        },
      };

    case "Polygon":
      const exterior = coords[0];
      const holes = coords.slice(1);

      const polygonObj = {
        "gml:Polygon": {
          "@_srsName": srsName,
          "gml:exterior": {
            "gml:LinearRing": {
              "gml:posList": exterior.flat().join(" "),
            },
          },
        },
      };

      if (holes.length) {
        polygonObj["gml:Polygon"]["gml:interior"] = holes.map((hole) => ({
          "gml:LinearRing": {
            "gml:posList": hole.flat().join(" "),
          },
        }));
      }

      return polygonObj;

    case "MultiPoint":
      return {
        "gml:MultiPoint": {
          "@_srsName": srsName,
          "gml:pointMember": coords.map((coord) => ({
            "gml:Point": {
              "gml:pos": coord.join(" "),
            },
          })),
        },
      };

    case "MultiLineString":
      return {
        "gml:MultiLineString": {
          "@_srsName": srsName,
          "gml:lineStringMember": coords.map((lineCoords) => ({
            "gml:LineString": {
              "gml:posList": lineCoords.flat().join(" "),
            },
          })),
        },
      };

    case "MultiPolygon":
      return {
        "gml:MultiPolygon": {
          "@_srsName": srsName,
          "gml:polygonMember": coords.map((polyCoords) => {
            const exterior = polyCoords[0];
            const holes = polyCoords.slice(1);

            const polygon = {
              "gml:Polygon": {
                "gml:exterior": {
                  "gml:LinearRing": {
                    "gml:posList": exterior.flat().join(" "),
                  },
                },
              },
            };

            if (holes.length) {
              polygon["gml:Polygon"]["gml:interior"] = holes.map((hole) => ({
                "gml:LinearRing": {
                  "gml:posList": hole.flat().join(" "),
                },
              }));
            }

            return polygon;
          }),
        },
      };

    default:
      throw new Error(`Unsupported geometry type: ${geojson.type}`);
  }
}
