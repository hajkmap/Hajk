import Error from './error.js';
import Plugin from './plugin.js';
import Map from 'ol/map';
import View from 'ol/view';
import Tile from 'ol/layer/tile';
import Image from 'ol/layer/image';
import OSM from 'ol/source/osm';
import ImageWMS from 'ol/source/imagewms';

const pluginsFolder = 'plugins';
var map;

class AppModel {

  constructor() {
    this.plugins = {};
    this.activeTool = undefined;
  }

  addPlugin(plugin) {
    this.plugins[plugin.type] = plugin;
  }

  togglePlugin(type) {

    console.log("Toggle plugin", type);

    if (this.activeTool !== undefined) {
      if (this.activeTool === type) {
        if (this.plugins[this.activeTool].isOpen()) {
          this.plugins[this.activeTool].minimize();
        } else {
          this.plugins[this.activeTool].open();
        }
      } else {
        this.plugins[this.activeTool].close();
        this.activeTool = type;
        this.plugins[this.activeTool].open();
      }
    } else {

      this.activeTool = type;

      console.log("No active tool, open only this", this.activeTool);
      this.plugins[this.activeTool].open();
    }
  }

  getPlugins() {
    return this.plugins;
  }

  getToolbarPlugins() {
    return Object
      .keys(this.plugins)
      .reduce((v, key) => {
        if (this.plugins[key].target === 'toolbar') {
          v = [...v, this.plugins[key]]
        }
        return v;
      }, []);
  }

  loadPlugins(plugins, callback) {
    if (undefined !== map) {
      plugins.forEach(plugin => {
        import(`../${pluginsFolder}/${plugin}/view.js`).then((module) => {
          this.addPlugin(new Plugin ({
            map: map,
            app: this,
            type: plugin,
            target: 'toolbar',
            component: module.default
          }));
          callback();
        });
      });
    } else {
      throw new Error("Initialize map before loading plugins.");
    }
  }

  createMap(target) {
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

  getMap() {
    return map;
  }

}

export default AppModel;