import WKT from "ol/format/WKT.js";
import { Icon, Stroke, Fill } from "ol/style.js";
import {
  Point,
  MultiPoint,
  Polygon,
  MultiPolygon,
  LineString,
  MultiLineString
} from "ol/geom.js";

function componentToHex(c) {
  var hex = c.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
  return componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function colorToArray(color, type) {
  var res = [],
    reg = type === "rgb" ? /rgb\((.+)\)/ : /rgba\((.+)\)/;

  if (Array.isArray(color)) {
    res = color;
  } else {
    res = reg
      .exec(color)[1]
      .split(",")
      .map(a => parseFloat(a));
    if (type === "rgb") {
      res.push(1);
    }
  }

  return res;
}

function toKmlColor(color) {
  var s, r, g, b, o;
  if (color) {
    let res;
    if (/^rgba/.test(color)) {
      res = colorToArray(color, "rgba");
    } else if (/^rgb/.test(color)) {
      res = colorToArray(color, "rgb");
    }
    if (Array.isArray(res)) {
      s = rgbToHex(res[0], res[1], res[2]);
    } else {
      s = color = color.replace("#", "");
    }
    r = s.substr(0, 2);
    g = s.substr(2, 2);
    b = s.substr(4, 2);
    o = "ff";
    if (res && res[3]) {
      o = Math.floor(res[3] * 255).toString(16);
    }
    return o + b + g + r;
  }
}

function toKmlString(str, type) {
  var strs = [],
    a,
    b;

  switch (type) {
    case "point":
      str = str.replace(/^POINT\(/, "").replace(/\)$/, "");
      str = str.replace(/^POINT Z\(/, "").replace(/\)$/, "");
      str = str.replace(/^MULTIPOINT\(/, "").replace(/\)$/, "");
      str = str.replace(/^MULTIPOINT Z\(/, "").replace(/\)$/, "");
      break;
    case "line":
      str = str.replace(/^LINESTRING\(/, "").replace(/\)$/, "");
      str = str.replace(/^LINESTRING Z\(/, "").replace(/\)$/, "");
      str = str.replace(/^MULTILINESTRING\(/, "").replace(/\)$/, "");
      str = str.replace(/^MULTILINESTRING Z\(/, "").replace(/\)$/, "");
      break;
    case "polygon":
      strs = str.split("),(");
      str = "";
      strs.forEach((coords, i) => {
        if (i === 0) {
          coords = coords.replace(/^POLYGON\(\(/, "").replace(/\)$/, "");
          coords = coords.replace(/^POLYGON Z\(\(/, "").replace(/\)$/, "");
          str += "<outerBoundaryIs>";
          str += "<LinearRing>";
          str += "<coordinates>" + coords + "</coordinates>";
          str += "</LinearRing>";
          str += "</outerBoundaryIs>";
        } else {
          coords = coords.replace(/\)/g, "");
          str += "<innerBoundaryIs>";
          str += "<LinearRing>";
          str += "<coordinates>" + coords + "</coordinates>";
          str += "</LinearRing>";
          str += "</innerBoundaryIs>";
        }
      });
      break;
    case "multiPolygon":
      a = str.split(")),((");
      str = "";
      a.forEach((coords, t) => {
        if (t === 0) {
          coords = coords.replace(/^MULTIPOLYGON\(\(/, "").replace(/\)$/, "");
          coords = coords
            .replace(/^MULTIPOLYGON Z\(\(\(/, "")
            .replace(/\)$/, "");
        }

        b = coords.split("),(");

        str += "<Polygon>";
        b.forEach((coordinates, i) => {
          coordinates = coordinates
            .replace(/\)/g, "")
            .split(",")
            .map(coordString => {
              var coords = coordString.split(" ");
              return coords[0] + " " + coords[1];
            });

          if (i === 0) {
            str += "<outerBoundaryIs>";
            str += "<LinearRing>";
            str += "<coordinates>" + coordinates + "</coordinates>";
            str += "</LinearRing>";
            str += "</outerBoundaryIs>";
          } else {
            str += "<innerBoundaryIs>";
            str += "<LinearRing>";
            str += "<coordinates>" + coordinates + "</coordinates>";
            str += "</LinearRing>";
            str += "</innerBoundaryIs>";
          }
        });
        str += "</Polygon>";
      });
      break;
    default:
      break;
  }

  return str
    .replace(/ /g, "_")
    .replace(/,/g, " ")
    .replace(/_/g, ",")
    .replace(/\(/g, "")
    .replace(/\)/g, "");
}

function point(f) {
  var str = "";
  str += "<Point>";
  str += "<coordinates>" + toKmlString(f, "point") + "</coordinates>";
  str += "</Point>";
  return str;
}

function line(f) {
  var str = "";
  str += "<LineString>";
  str += "<coordinates>" + toKmlString(f, "line") + "</coordinates>";
  str += "</LineString>";
  return str;
}

function polygon(f) {
  var str = "";
  str += "<Polygon>";
  str += toKmlString(f, "polygon");
  str += "</Polygon>";
  return str;
}

function multiPolygon(f) {
  var str = "";
  str += "<MultiGeometry>";
  str += toKmlString(f, "multiPolygon");
  str += "</MultiGeometry>";
  return str;
}

function safeInject(string) {
  string = string.toString();
  return string.replace(/<\/?[^>]+(>|$)|&/g, "");
}

function filterProperties(template, properties) {
  var props = {};
  Object.keys(properties).forEach(property => {
    var regExp = new RegExp(`{export:${property}}`);
    if (regExp.test(template)) {
      props[property] = properties[property];
    }
  });
  return props;
}

export function transform(features, from, to) {
  return features.map(feature => {
    var c = feature.clone(),
      style = Array.isArray(feature.getStyle())
        ? feature.getStyle()[1]
        : feature.getStyle();
    c.getGeometry().transform(from, to);
    c.setStyle(style);
    c.caption = feature.caption;
    c.infobox = feature.infobox;
    return c;
  });
}

export function createXML(features, name) {
  var header = "",
    parser = new WKT(),
    doc = "";

  header +=
    '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom">';
  doc += "<Document>";
  doc += "<name>" + name + "</name>";

  doc += "<Folder>";
  doc += "<name>" + name + "</name>";
  doc += "<open>0</open>";

  features.forEach((feature, i) => {
    var style = Array.isArray(feature.getStyle())
      ? feature.getStyle()[1] || feature.getStyle()[0]
      : feature.getStyle();

    doc += '<Style id="' + i + '">';
    if (style.getImage() instanceof Icon) {
      doc += "<IconStyle>";
      doc += "<scale>" + style.getImage().getSize()[0] / 32 + "</scale>";
      doc += "<Icon>";
      doc += "<href>" + style.getImage().getSrc() + "</href>";
      doc += "</Icon>";
      doc += "</IconStyle>";
    }

    if (style.getStroke() instanceof Stroke) {
      doc += "<LineStyle>";
      doc += "<color>" + toKmlColor(style.getStroke().getColor()) + "</color>";
      doc += "<width>" + style.getStroke().getWidth() + "</width>";
      doc += "</LineStyle>";
    }

    if (style.getFill() instanceof Fill) {
      doc += "<PolyStyle>";
      doc += "<color>" + toKmlColor(style.getFill().getColor()) + "</color>";
      doc += "</PolyStyle>";
    }

    doc += "</Style>";
  });

  features.forEach((feature, i) => {
    var style = Array.isArray(feature.getStyle())
      ? feature.getStyle()[1] || feature.getStyle()[0]
      : feature.getStyle();

    var text = style.getText() ? style.getText().getText() : "";

    var description = feature.getProperties().description || "",
      name =
        feature.getProperties().namn ||
        feature.getProperties().name ||
        feature.caption ||
        text;

    if (!description && feature.getProperties()) {
      description = "<table>";
      let properties = feature.getProperties();

      if (feature.infobox) {
        properties = filterProperties(feature.infobox, properties);
      }

      Object.keys(properties).forEach(property => {
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          description += "<tr>";
          description += "<td>" + property + "</td>";
          description += "<td>" + safeInject(properties[property]) + "</td>";
          description += "</tr>";
        }
      });

      description += "</table>";
    }

    doc += "<Placemark>";
    doc += "<name>" + (name || "Ritobjekt " + (i + 1)) + "</name>";
    doc +=
      "<description>" +
      (description || "Ritobjekt " + (i + 1)) +
      "</description>";
    doc += "<styleUrl>#" + i + "</styleUrl>";

    if (feature.getGeometry() instanceof Point) {
      doc += point(parser.writeFeature(feature));
    }
    if (feature.getGeometry() instanceof MultiPoint) {
      doc += point(parser.writeFeature(feature));
    }
    if (feature.getGeometry() instanceof LineString) {
      doc += line(parser.writeFeature(feature));
    }
    if (feature.getGeometry() instanceof MultiLineString) {
      doc += line(parser.writeFeature(feature));
    }
    if (feature.getGeometry() instanceof Polygon) {
      doc += polygon(parser.writeFeature(feature));
    }
    if (feature.getGeometry() instanceof MultiPolygon) {
      doc += multiPolygon(parser.writeFeature(feature));
    }

    if (feature.getProperties().style) {
      doc += "<ExtendedData>";
      doc += '<Data name="style">';
      doc += "<value>" + feature.getProperties().style + "</value>";
      doc += "</Data>";
      doc += "</ExtendedData>";
    }
    doc += "</Placemark>";
  });

  doc += "</Folder>";
  doc += "</Document>";
  header += doc;
  header += "</kml>";

  return header;
}
