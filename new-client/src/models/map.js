import Error from './error.js';
import Map from 'ol/map';
import View from 'ol/view';
import Tile from 'ol/layer/tile';
import Image from 'ol/layer/image';
import OSM from 'ol/source/osm';
import ImageWMS from 'ol/source/imagewms';

const pluginsFolder = 'plugins';
var map;

export function loadPlugins(plugins, callback) {
  if (undefined !== map) {
    plugins.forEach(plugin => {
      import(`../${pluginsFolder}/${plugin}/view.js`).then((module) => {
        callback(module.default);
      });
    });
  } else {
    throw new Error("Initialize map before loading plugins.");
  }
}

export function createMap(target) {
  map = new Map({
    layers: [
      new Tile({
        source: new OSM()
      }),
      new Image({
        extent: [-13884991, 2870341, -7455066, 6338219],
        source: new ImageWMS({
          url: 'https://ahocevar.com/geoserver/wms',
          params: {'LAYERS': 'topp:states'},
          ratio: 1,
          serverType: 'geoserver'
        })
      })
    ],
    target: target,
    view: new View({
      center: [-10997148, 4569099],
      zoom: 4
    })
  });
  return map;
}

export function getMap() {
  return map;
}