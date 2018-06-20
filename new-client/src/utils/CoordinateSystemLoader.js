import proj4 from "proj4";

function add(projection) {
  proj4.defs(projection.code, projection.definition);
}

export default class CoordinateSystemLoader {
  constructor(config) {
    if (Array.isArray(config)) {
      config.forEach(projection => {
        add(projection);
      });
    }
  }

  getProj4() {
    return proj4;
  }
}
