/**
 * Ids for the "special"/non-server background layers that Hajk creates client
 * side (see `models/appModel/backgroundLayers.js`). They are real OpenLayers
 * layers added to the map, but the white/black ones only render via the
 * `div#map` background color rather than any tiles.
 *
 * The id equals the layer's OpenLayers `name` property.
 */
export const BACKGROUND_LAYER_IDS = {
  WHITE: "-1",
  BLACK: "-2",
  OSM: "-3",
};
