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

  const [nsPrefix, localName] = typeName.includes(":")
    ? typeName.split(":")
    : ["feature", typeName];

  const transaction = {
    "wfs:Transaction": {
      "@_service": "WFS",
      "@_version": version,
      "@_xmlns:wfs": wfsNs,
      "@_xmlns:gml": gmlNs,
      "@_xmlns:ogc": "http://www.opengis.net/ogc",
      [`@_xmlns:${nsPrefix}`]: `http://example.com/${nsPrefix}`,
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
          gmlNs,
          nsPrefix
        ),
      },
    ]);
  });

  // UPDATE operations
  updates.forEach((feature) => {
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

function buildFeatureXml(feature, geometryName, srsName, gmlNs, nsPrefix) {
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
  const coords = geojson.coordinates;

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
    case "MultiLineString":
    case "MultiPolygon":
      throw new Error(
        `Multi-geometry type ${geojson.type} not yet implemented`
      );

    default:
      throw new Error(`Unsupported geometry type: ${geojson.type}`);
  }
}
