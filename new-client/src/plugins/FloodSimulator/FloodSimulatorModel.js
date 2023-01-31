// import { Image as ImageLayer, Tile as TileLayer } from "ol/layer.js";
// import { Raster as RasterSource, XYZ } from "ol/source.js";
import TileLayer from "ol/layer/WebGLTile.js";
import XYZ from "ol/source/XYZ.js";

export default class FloodSimulatorModel {
  #app;
  #floodLayer;
  #floodSource;
  #localObserver;
  #map;
  #mapTilerLayer;
  #options;

  constructor(settings) {
    this.#map = settings.map;
    this.#app = settings.app;
    this.#options = settings.options;
    this.#localObserver = settings.localObserver;

    // Initiate listeners
    this.#initSubscriptions();

    // Initiate the flood layer
    this.#initFloodLayer();
  }

  // Sets up listeners on observers
  #initSubscriptions = () => {
    this.#localObserver.subscribe("newLevelValue", this.#handleNewLevelValue);
  };

  // Initiate the flooding source. Depending on Admin settings,
  // we will use either a local layer or MapTiler's Terrain RGB.
  #initFloodLayer = () => {
    if (this.#options.maptilerApiKey?.length > 0) {
      this.#initMaptilerLayer();
    } else if (this.#options.floodLayerId?.length > 0) {
      this.#initLocalLayer();
    } else {
      console.error(
        "Can't setup the FloodSimulator: either maptilerApiKey or floodLayerId must be specified in config."
      );
    }
  };

  #initMaptilerLayer = () => {
    // Using the Maptiler API
    console.log("Setting up the Maptiler way");

    // This is really just copied from the OL example:
    // band math operates on normalized values from 0-1
    // so we scale by 255 to align with the elevation formula
    // from https://cloud.maptiler.com/tiles/terrain-rgb/
    const elevation = [
      "+",
      -10000,
      [
        "*",
        0.1 * 255,
        [
          "+",
          ["*", 256 * 256, ["band", 1]],
          ["+", ["*", 256, ["band", 2]], ["band", 3]],
        ],
      ],
    ];

    this.#mapTilerLayer = new TileLayer({
      layerType: "system",
      zIndex: 5001,
      name: "pluginFloodSimulator",
      caption: "Flood Simulator",
      opacity: 0.6,
      source: new XYZ({
        url:
          "https://api.maptiler.com/tiles/terrain-rgb/{z}/{x}/{y}.png?key=" +
          this.#options.maptilerApiKey,
        tileSize: 256,
      }),
      style: {
        variables: {
          level: 0,
        },
        color: [
          "case",
          // use the `level` style variable to determine the color
          ["<=", elevation, ["var", "level"]],
          [139, 212, 255, 1],
          [139, 212, 255, 0],
        ],
      },
    });

    // TODO: Remove this later on. I want the background
    // layer for dev purposes only, as it is always visible
    // and makes it easier to debug reprojection issues.
    const backgroundLayer = new TileLayer({
      layerType: "system",
      zIndex: 5000,
      name: "pluginFloodSimulatorBackground",
      caption: "Flood Simulator background layer",
      source: new XYZ({
        // projection: "EPSG:3008",
        url:
          "https://api.maptiler.com/maps/streets/{z}/{x}/{y}.png?key=" +
          this.#options.maptilerApiKey,
        tileSize: 512,
      }),
    });

    console.log("backgroundLayer: ", backgroundLayer);
    this.#map.addLayer(backgroundLayer);

    // Add the Terrain RGB layer to map
    console.log("this.#mapTilerLayer: ", this.#mapTilerLayer);
    this.#map.addLayer(this.#mapTilerLayer);
  };

  #initLocalLayer = () => {
    // We expect the appropriate layer to already exist in map,
    // so the only thing that remains is to find it by it's ID
    this.#floodLayer = this.#map
      .getAllLayers()
      .find((l) => l.get("name") === this.#options.floodLayerId);
    console.log("Setting up using local layer: ", this.#floodLayer);

    // Yet another way could be to force admins to setup a dedicated layer
    // for this plugin. In that solution, we would initiate the layer
    // and then add it to map like this:
    // this.#map.addLayer(this.#floodLayer);
  };

  #handleNewLevelValue = (newValue = "0") => {
    console.log(newValue);
    this.#mapTilerLayer.updateStyleVariables({ level: parseFloat(newValue) });
  };
}
