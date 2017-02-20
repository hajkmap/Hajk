function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return componentToHex(r) + componentToHex(g) + componentToHex(b);
}

function colorToArray(color, type) {
    var res = []
    var reg = type === "rgb" ? /rgb\((.+)\)/ :
                               /rgba\((.+)\)/;

    res = reg.exec(color)[1].split(',').map(a => parseFloat(a));

    if (type === "rgb") {
      res.push(1);
    }

    return res;
}

function toKmlColor(color) {
    var s, r, g, b, o;
    var res = /^rgba/.test(color) ? colorToArray(color, 'rgba') : colorToArray(color, 'rgb');
    s = rgbToHex(res[0], res[1], res[2]);
    r = s.substr(0, 2);
    g = s.substr(2, 2);
    b = s.substr(4, 2);
    o = (Math.floor(res[3] * 255)).toString(16);
    return o + b + g + r;
}

function toKmlString(str, type) {

  var strs = []
  ,   a
  ,   b;

  switch (type) {
      case 'point':
        str = str.replace(/^POINT\(/, '').replace(/\)$/, '');
        str = str.replace(/^POINT Z\(/, '').replace(/\)$/, '');
        str = str.replace(/^MULTIPOINT\(/, '').replace(/\)$/, '');
        str = str.replace(/^MULTIPOINT Z\(/, '').replace(/\)$/, '');
        break;
      case 'line':
        str = str.replace(/^LINESTRING\(/, '').replace(/\)$/, '');
        str = str.replace(/^LINESTRING Z\(/, '').replace(/\)$/, '');
        str = str.replace(/^MULTILINESTRING\(/, '').replace(/\)$/, '');
        str = str.replace(/^MULTILINESTRING Z\(/, '').replace(/\)$/, '');
        break;
      case 'polygon':
        strs = str.split('),(');
        str = "";
        _.each(strs, function (coords, i) {
          if (i === 0) {
            coords = coords.replace(/^POLYGON\(\(/, '').replace(/\)$/, '');
            str +=   '<outerBoundaryIs>';
            str +=     '<LinearRing>';
            str +=       '<coordinates>' + coords + '</coordinates>';
            str +=     '</LinearRing>';
            str +=   '</outerBoundaryIs>';
          } else {
            coords = coords.replace(/\)/g, '');
            str +=   '<innerBoundaryIs>';
            str +=     '<LinearRing>';
            str +=       '<coordinates>' + coords + '</coordinates>';
            str +=     '</LinearRing>';
            str +=   '</innerBoundaryIs>';
          }
        });
        break;

      case 'multiPolygon':
        a = str.split(')),((');
        str = "";
        _.each(a, function (coords, t) {

          if (t === 0) {
            coords = coords.replace(/^MULTIPOLYGON\(\(/, '').replace(/\)$/, '');
            coords = coords.replace(/^MULTIPOLYGON Z\(\(\(/, '').replace(/\)$/, '');
          }

          b = coords.split('),(');

          str += '<Polygon>';
          _.each(b, function (coordinates, i) {
            coordinates = coordinates
              .replace(/\)/g, '')
              .split(',')
              .map(coordString => {
                var coords = coordString.split(' ');
                return (coords[0] + " " + coords[1]);
              });

            if (i === 0) {
              str +=   '<outerBoundaryIs>';
              str +=     '<LinearRing>';
              str +=       '<coordinates>' + coordinates + '</coordinates>';
              str +=     '</LinearRing>';
              str +=   '</outerBoundaryIs>';
            } else {
              str +=   '<innerBoundaryIs>';
              str +=     '<LinearRing>';
              str +=       '<coordinates>' + coordinates + '</coordinates>';
              str +=     '</LinearRing>';
              str +=   '</innerBoundaryIs>';
            }
          });
          str += '</Polygon>';
        });

        break;
  }

  return str.replace(/ /g, '_')
            .replace(/,/g, ' ')
            .replace(/_/g, ',')
            .replace(/\(/g, '')
            .replace(/\)/g, '')
}

function point(f) {
  var str = "";
  str += '<Point>';
  str +=   '<coordinates>' + toKmlString(f, "point") + '</coordinates>';
  str += '</Point>';
  return str;
}

function line(f) {
  var str = "";
  str += '<LineString>';
  str +=    '<coordinates>' + toKmlString(f, "line") + '</coordinates>';
  str += '</LineString>';
  return str;
}

function polygon(f) {
  var str = "";
  str += '<Polygon>';
      str += toKmlString(f, "polygon");
  str += '</Polygon>';
  return str;
}

function multiPolygon(f) {
  var str = "";
  str += '<MultiGeometry>';
  str += toKmlString(f, "multiPolygon");
  str += '</MultiGeometry>';
  return str;
}

function safeInject(string) {
  return string.replace(/<\/?[^>]+(>|$)|&/g, "");
}

function extractStyle(style) {

  var obj = {
    text: "",
    image: "",
    pointRadius: 0,
    pointColor: "",
    fillColor: "",
    strokeColor: "",
    strokeWidth: "",
    strokeDash: ""
  };

  obj.text = style.getText() ? style.getText().getText() : "";
  obj.image = style.getImage() instanceof ol.style.Icon ? style.getImage().getSrc() : "";
  obj.pointRadius = style.getImage() instanceof ol.style.Circle ? style.getImage().getRadius() : "";
  obj.pointColor = style.getImage() instanceof ol.style.Circle ? style.getImage().getFill().getColor() : "";
  obj.fillColor = style.getFill().getColor();
  obj.strokeColor = style.getStroke().getColor();
  obj.strokeWidth = style.getStroke().getWidth();
  obj.strokeDash = style.getStroke().getLineDash();

  return obj;
}

function filterProperties (template, properties) {
  var props = {};
  Object.keys(properties).filter(property => {
    var regExp = new RegExp(`{export:${property}}`);
    if (regExp.test(template)) {
      props[property] = properties[property];
    }
  });
  console.log("Apply filter", props);
  return props;
}

var kmlWriter = {};

kmlWriter.transform = (features, from, to) => {
  return features.map(feature => {
    var c = feature.clone()
    ,   style = Array.isArray(feature.getStyle())
        ? feature.getStyle()[1]
        : feature.getStyle();
    c.getGeometry().transform(from, to);
    c.setStyle(style);
    c.caption = feature.caption;
    c.infobox = feature.infobox;
    return c;
  });
};

kmlWriter.createXML = (features, name) => {

  var header = ''
  ,   parser = new ol.format.WKT()
  ,   doc = ''
  ;

  header += '<kml xmlns="http://www.opengis.net/kml/2.2" xmlns:gx="http://www.google.com/kml/ext/2.2" xmlns:kml="http://www.opengis.net/kml/2.2" xmlns:atom="http://www.w3.org/2005/Atom">';
  doc += '<Document>';
  doc += '<name>' + name + '</name>';

  doc += "<Folder>";
  doc += "<name>" + name + "</name>";
  doc += "<open>0</open>";

  features.forEach((feature, i) => {

    var style = Array.isArray(feature.getStyle())
    ? feature.getStyle()[1]
    : feature.getStyle();

    doc += '<Style id="' + i + '">';
        if (style.getImage() instanceof ol.style.Icon) {
            doc += '<IconStyle>';
            doc +=   '<scale>' + (style.getImage().getSize()[0] / 32) + '</scale>';
            doc +=     '<Icon>';
            doc +=       '<href>' + style.getImage().getSrc() + '</href>';
            doc +=     '</Icon>';
            doc += '</IconStyle>';
        }

        if (style.getStroke() instanceof ol.style.Stroke) {
            doc += '<LineStyle>';
            doc +=   '<color>' + toKmlColor(style.getStroke().getColor()) + '</color>';
            doc +=   '<width>' + style.getStroke().getWidth() + '</width>';
            doc += '</LineStyle>';
        }

        if (style.getFill() instanceof ol.style.Fill) {
            doc += '<PolyStyle>';
            doc +=    '<color>' + toKmlColor(style.getFill().getColor()) + '</color>';
            doc += '</PolyStyle>';
        }

    doc += '</Style>';
  });

  features.forEach((feature, i) => {

    var style = Array.isArray(feature.getStyle())
    ? feature.getStyle()[1]
    : feature.getStyle();

    var text = style.getText()
    ? style.getText().getText()
    : "";

    var description = feature.getProperties().description || ""
    ,   name = feature.getProperties().namn || feature.getProperties().name || feature.caption || text
    ;

    if (!description && feature.getProperties()) {
        description = "<table>";
        let properties = feature.getProperties();

        console.log("Export to xml", feature);

        if (feature.infobox) {
          properties = filterProperties(feature.infobox, properties);
        }

        _.each(properties, function (value, attribute) {
            if (typeof value === "string" ||
                typeof value === "number" ||
                typeof value === "boolean") {
                description += "<tr>";
                    description += "<td>" + attribute + "</td>";
                    description += "<td>" + safeInject(value) + "</td>";
                description += "</tr>";
            }
        });

        description += "</table>";
    }

    doc += '<Placemark>';
    doc += '<name>' + (name || ('Ritobjekt ' + (i + 1))) + '</name>';
    doc += '<description>' + (description || ('Ritobjekt ' + (i + 1))) + '</description>';
    doc += '<styleUrl>#' + i + '</styleUrl>';

    if (feature.getGeometry() instanceof ol.geom.Point) {
        doc += point(parser.writeFeature(feature));
    }
    if (feature.getGeometry() instanceof ol.geom.MultiPoint) {
        doc += point(parser.writeFeature(feature));
    }
    if (feature.getGeometry() instanceof ol.geom.LineString) {
        doc += line(parser.writeFeature(feature));
    }
    if (feature.getGeometry() instanceof ol.geom.MultiLineString) {
        doc += line(parser.writeFeature(feature));
    }
    if (feature.getGeometry() instanceof ol.geom.Polygon) {
        doc += polygon(parser.writeFeature(feature));
    }
    if (feature.getGeometry() instanceof ol.geom.MultiPolygon) {
        doc += multiPolygon(parser.writeFeature(feature));
    }

    if (feature.getProperties().style) {
        doc += '<ExtendedData>';
        doc +=    '<Data name="style">';
        doc +=       '<value>' + feature.getProperties().style + '</value>';
        doc +=    '</Data>';
        doc += '</ExtendedData>';
    }
    doc += '</Placemark>';
  });

  doc += "</Folder>";
  doc += '</Document>';
  header += doc;
  header += '</kml>';

  return header
};

module.exports = kmlWriter;
