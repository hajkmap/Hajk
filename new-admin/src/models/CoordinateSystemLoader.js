import proj4 from "proj4";

function add(projection) {
  proj4.defs(projection.code, projection.definition);
}

const definitions = [
  {
    code: "EPSG:3006",
    name: "Sweref 99 TM",
    definition:
      "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [218128.7031, 6126002.9379, 1083427.297, 7692850.9468],
    units: null
  },
  {
    code: "EPSG:3007",
    name: "Sweref 99 12 00",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [60436.5084, 6192389.565, 217643.4713, 6682784.4276],
    units: null
  },
  {
    code: "EPSG:3008",
    name: "Sweref 99 13 30",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=13.5 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [60857.4994, 6120098.8505, 223225.0217, 6906693.7888],
    units: null
  },
  {
    code: "EPSG:3009",
    name: "Sweref 99 15 00",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=15 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [56294.0365, 6203542.5282, 218719.0581, 6835499.2391],
    units: null
  },
  {
    code: "EPSG:3010",
    name: "Sweref 99 16 30",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=16.5 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [97213.6352, 6228930.1419, 225141.8681, 6916524.0785],
    units: null
  },
  {
    code: "EPSG:3011",
    name: "Sweref 99 18 00",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=18 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [96664.5565, 6509617.2232, 220146.6914, 6727103.5879],
    units: null
  },
  {
    code: "EPSG:3012",
    name: "Sweref 99 14 15",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=14.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [30462.5263, 6829647.9842, 216416.1584, 7154168.0208],
    units: null
  },
  {
    code: "EPSG:3013",
    name: "Sweref 99 15 45",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=15.75 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [34056.6264, 6710433.2884, 218692.0214, 7224144.732],
    units: null
  },
  {
    code: "EPSG:3014",
    name: "Sweref 99 17 15",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=17.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [-1420.28, 6888655.5779, 212669.1333, 7459585.3378],
    units: null
  },
  {
    code: "EPSG:3015",
    name: "Sweref 99 18 45",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=18.75 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [58479.4774, 6304213.2147, 241520.5226, 7276832.4419],
    units: null
  },
  {
    code: "EPSG:3016",
    name: "Sweref 99 20 15",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=20.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [-93218.3385, 7034909.8738, 261434.6246, 7676279.8691],
    units: null
  },
  {
    code: "EPSG:3017",
    name: "Sweref 99 21 45",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=21.75 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [67451.0699, 7211342.8483, 145349.5699, 7254837.254],
    units: null
  },
  {
    code: "EPSG:3018",
    name: "Sweref 99 23 15",
    definition:
      "+proj=tmerc +lat_0=0 +lon_0=23.25 +k=1 +x_0=150000 +y_0=0 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs",
    extent: [38920.7048, 7267405.2323, 193050.246, 7597992.2419],
    units: null
  }
];

export default class CoordinateSystemLoader {
  constructor(config) {
    definitions.forEach(definition => {
      add(definition);
    });
    if (Array.isArray(config)) {
      config.forEach(projection => {
        add(projection);
      });
    }
  }

  getDefinitions() {
    return definitions;
  }

  getProj4() {
    return proj4;
  }
}
