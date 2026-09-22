## The FloodSimulator plugin

Renders a rising water surface on top of Hajk's existing background maps. A WebGL tile layer reads elevation from Terrain-RGB XYZ tiles and colors every pixel whose elevation is at or below the user-selected water level. Moving the slider only updates a GPU style variable — tiles are not reloaded.

This is a **bathtub model**: every pixel below the water level floods, including inland basins with no path to the sea. It is not a hydrological simulation.

The plugin does **not** add a background layer; Hajk already handles those. Closing the plugin window hides the overlay; the last water level is kept and applied again when the tool is reopened.

### Elevation source

XYZ image tiles in Mapbox Terrain-RGB or Terrarium encoding. Height is decoded from the RGB channels.

`elevationUrl` defaults to empty. The overlay is only created when a URL is configured. The public Mapzen/AWS Terrarium tiles are a convenient demo source (no API key) and are used in `map_1.json`; any Hajk instance that forgets to set `elevationUrl` will log a console warning instead of silently hitting that third-party bucket.

### CORS

Tiles are loaded with `crossOrigin: "anonymous"` by default so the pointer readout can read pixel values via `getData()`. The tile server must send `Access-Control-Allow-Origin` (a local pyramid on another origin or port needs this too). Set `crossOrigin` to `"use-credentials"` if the server requires cookies, or to `null` to omit the attribute — the overlay can still draw, but the elevation readout will not work.

### Projection constraint

`ol/source/ImageTile` **cannot reproject**. The plugin always uses the map view projection, so the tiles must already be in that CRS.

The demo Terrarium tiles are `EPSG:3857`, which matches `map_1`. They will not line up on SWEREF99 / `EPSG:3006` / `EPSG:3008` maps; you need a Terrain-RGB or Terrarium XYZ pyramid in that same projection. On mismatch the plugin logs a console warning and shows an alert dialog instead of silently rendering garbage.

### Mapbox precision

The `mapbox` encoding builds elevation as `R*6553.6 + G*25.6 + B*0.1`. On GPUs that run fragment shaders at `mediump` that magnitude can lose sub-decimetre precision and band visibly. Terrarium (the demo encoding) is far better conditioned.

### Where to get elevation data

- **Mapzen / AWS Terrarium tiles** (demo, no API key): `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` — `EPSG:3857`, encoding `terrarium`. Attribution: Mapzen Terrain Tiles.
- **Mapbox Terrain-RGB**: set `elevationEncoding` to `mapbox` and append an access token to `elevationUrl`.
- **Own pyramid**: a DEM GeoTIFF can be converted to Terrarium XYZ tiles with Python, Rasterio, etc., then served from any static host or GeoServer/GWC, in the map projection.

`minElevation` / `maxElevation` exist because terrain-RGB tiles encode sea and no-data areas as `0` / a very low (or very high) value, which would otherwise flood immediately. Values at or below `minElevation` or at or above `maxElevation` stay transparent. The pointer readout uses the same bounds.

### Depth coloring

With **Visa vattendjup** on, flooded pixels are colored by water depth (`level − elevation`):

- **Linear ramp** (default when no classes are configured): `waterColor` at depth 0 to `deepWaterColor` at `maxShadingDepth`. In **Färgskala**, a **Max djup** slider under **Djupvattenfärg** changes that depth. Its maximum is the same as the **Vattennivå** slider max.
- **Classed colors**: set `depthColors` to `{ maxDepth, color }` stops. Each class is the previous bound (0 for the first) up to `maxDepth`; the last class also covers everything deeper. Empty array, omitted or `null` keeps the linear ramp.
- **Smooth fade between classes**: **Mjuk övergång** (below **Interpolera**) keeps each class color through most of its range and blends only in a short band at the class boundary when **Djupklasser** is selected. The shoreline (depth 0) fades in over a similarly short band. On by default; the Admin option `smoothDepthColors` sets the initial state.
- **Isobaths**: with **Djupklasser** selected and **Visa vattendjup** on, **Djupkurvor** darkens pixels whose depth is near a `depthColors` stop (`maxDepth`). Off by default; session-only. Hidden, including on the map, when **Visa vattendjup** is off. With **Mjuk övergång** the darkening is strongest on the contour and fades out over a short depth band; otherwise it is a hard stripe.

When `depthColors` has classes the UI shows a toggle between **Djupklasser** (the classed colors, with a legend) and **Färgskala** (the linear ramp, with the deep-water picker). Classes are preselected. **Interpolera** and **Mjuk övergång** sit above **Visa vattendjup**. **Djupkurvor** is shown only for **Djupklasser**. All three colorings and the contours are part of the same WebGL style, so switching does not reload tiles. Without `depthColors` there is no class/ramp toggle — only the ramp.

### Example configuration

```json
{
  "type": "floodsimulator",
  "index": 20,
  "options": {
    "target": "toolbar",
    "position": "left",
    "visibleAtStart": false,
    "title": "Översvämning",
    "description": "Simulera en stigande vattennivå",
    "elevationUrl": "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
    "elevationEncoding": "terrarium",
    "crossOrigin": "anonymous",
    "tileSize": 256,
    "minZoom": 0,
    "maxZoom": 15,
    "attributions": "Elevation data: Mapzen Terrain Tiles",
    "minLevel": 0,
    "maxLevel": 10,
    "levelStep": 0.01,
    "defaultLevel": 1,
    "waterColor": "#86cbf9",
    "deepWaterColor": "#283d4b",
    "depthColors": [
      { "maxDepth": 0.5, "color": "#c6e8ff" },
      { "maxDepth": 1, "color": "#6baed6" },
      { "maxDepth": 2, "color": "#2171b5" },
      { "maxDepth": 5, "color": "#08306b" }
    ],
    "layerOpacity": 0.6,
    "enableDepthShading": true,
    "interpolate": true,
    "smoothDepthColors": true,
    "maxShadingDepth": 5,
    "animationDurationMs": 8000,
    "showElevationReadout": true,
    "minElevation": -100,
    "maxElevation": 100
  }
}
```

### Options

| Option                  | Default                           | Description                                                                                                                               |
| ----------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `elevationUrl`          | _(empty)_                         | Tile URL template (`{z}/{x}/{y}`). Overlay is not created until this is set                                                               |
| `elevationEncoding`     | `terrarium`                       | `terrarium` or `mapbox`                                                                                                                   |
| `crossOrigin`           | `anonymous`                       | CORS mode for elevation tiles (`anonymous`, `use-credentials`, or `null` to omit). Needed for the pointer readout                         |
| `tileSize`              | `256`                             | XYZ tile size                                                                                                                             |
| `minZoom`               | `0`                               | Lowest terrain `{z}` that exists. Lower Hajk zooms reuse these tiles                                                                      |
| `maxZoom`               | `15`                              | Highest terrain `{z}` that exists. Higher Hajk zooms reuse these tiles                                                                    |
| `terrainZoomByMapZoom`  | clamp to min/max                  | Optional Hajk zoom → terrain `{z}` mapping (array or breakpoints). Omit or `null` to use `minZoom`/`maxZoom`                              |
| `elevationExtent`       | map extent                        | DEM coverage `[minX, minY, maxX, maxY]`. Clips the tile grid and overlay; XYZ origin still comes from the map                             |
| `elevationTileGrid`     | Map origin / extent / resolutions | Override the elevation pyramid's tile grid                                                                                                |
| `hideAtMinZoom`         | _(none)_                          | Hide the overlay at this OpenLayers zoom and below (stops tile loads). `1` hides zoom 0 and 1. Unset keeps water visible when zoomed out  |
| `minMapZoom`            | _(none)_                          | Hide the overlay below this Hajk zoom. Unset so zooming out past `minZoom` still shows water (reuses that `{z}`)                          |
| `maxResolution`         | derived from `minMapZoom`         | OpenLayers layer `maxResolution` (exclusive). Set this directly if you prefer resolution units                                            |
| `maxResolutionSlack`    | `1`                               | Multiplier on the coarsest terrain resolution when deriving `maxResolution`. `1` uses the next coarser zoom                               |
| `attributions`          | _(empty)_                         | Shown in the map attribution control                                                                                                      |
| `minLevel` / `maxLevel` | `0` / `10`                        | Slider range, meters. Max is also adjustable in the plugin under more settings (up to 100 m)                                              |
| `levelStep`             | `0.01`                            | Slider step, meters                                                                                                                       |
| `defaultLevel`          | `1`                               | Initial water level, meters                                                                                                               |
| `waterColor`            | `#86cbf9`                         | Flood fill color when depth shading is off. Also changeable from the plugin UI                                                            |
| `deepWaterColor`        | darkened `waterColor`             | Deep-water end of the linear depth-shading ramp. Also changeable from the plugin UI                                                       |
| `depthColors`           | `[]`                              | Discrete depth classes (`{ maxDepth, color }`). Empty, omitted or `null` keeps the linear ramp. The user can switch to the ramp in the UI |
| `layerOpacity`          | `0.6`                             | Initial overlay opacity (`0`–`1`)                                                                                                         |
| `enableDepthShading`    | `false`                           | Start with depth shading on                                                                                                               |
| `interpolate`           | `true`                            | Linear resampling of elevation tiles (smoother shoreline). `false` uses nearest-neighbour. Also changeable from the plugin UI             |
| `smoothDepthColors`     | `true`                            | Start with **Mjuk övergång** on when Djupklasser is selected. The user can still toggle it                                                |
| `maxShadingDepth`       | `5`                               | Depth (m) that maps to `deepWaterColor` on the linear ramp. The Färgskala slider starts here; its maximum follows the water-level slider max |
| `animationDurationMs`   | `8000`                            | Initial play-button duration from min to max level. Adjustable in the UI (1–30 s by default; max can be raised under more settings)       |
| `showElevationReadout`  | `true`                            | Pointer elevation / depth readout                                                                                                         |
| `minElevation`          | `-100`                            | Elevations at or below this are treated as nodata                                                                                         |
| `maxElevation`          | `100`                             | Elevations at or above this are treated as nodata                                                                                         |

Configure the plugin from Admin → Kartor → Verktyg → Översvämning. The overlay is a system layer, so it does not appear in LayerSwitcher.

### Limited terrain pyramids

The elevation source often has fewer zoom levels than the Hajk map. `{x}` and `{y}` must still be computed at the terrain `{z}` that is actually requested — you cannot just rewrite `{z}` in the URL.

If the pyramid shares the map's tile grid (same origin, extent and resolutions, so Hajk zoom _N_ is the same matrix as terrain _N_), set `minZoom` / `maxZoom` to the levels that exist. Hajk zooms below `minZoom` keep using that coarsest terrain level; zooms above `maxZoom` keep using the finest.

A source that only has z 4, 5 and 6 (5.6 m / 2.8 m / 1.4 m) on an 11-level Hajk map:

| Hajk map zoom | Terrain `{z}` | Elevation resolution |
| ------------- | ------------- | -------------------- |
| 0–4           | 4             | 5.6 m                |
| 5             | 5             | 2.8 m                |
| 6–10          | 6             | 1.4 m                |

```json
{
  "minZoom": 4,
  "maxZoom": 6,
  "elevationExtent": [153039, 6318910, 182934, 6355840]
}
```

Zooming out past `minZoom` keeps using that coarsest terrain level, so the flood overlay stays on screen. Set `elevationExtent` to the DEM coverage so OpenLayers does not request `{z}=minZoom` tiles outside the pyramid (for example a world-wide Hajk extent around a municipal DEM). `{x}`/`{y}` are still computed from the map origin, not from this clip. If extra requests are still a problem at world zooms, set `hideAtMinZoom` (for example `1` or `2`) to hide the overlay and skip tile loads at that OpenLayers zoom and below. `minMapZoom` (or `maxResolution`) is the resolution-based alternative; `maxResolutionSlack` greater than 1 keeps it visible a bit further out than that cutoff.

The same mapping written out explicitly (useful when it is not a simple clamp):

```json
{
  "terrainZoomByMapZoom": [4, 4, 4, 4, 4, 5, 6, 6, 6, 6, 6]
}
```

or as breakpoints:

```json
{
  "terrainZoomByMapZoom": { "0": 4, "5": 5, "6": 6 }
}
```

The plugin builds the elevation tile grid from the map's origin and resolutions. Hajk `map.origin` is often the **bottom-left** of the extent (for example `0,0`). XYZ terrain tiles need the **top-left**, so a bottom-left origin is converted automatically using the **map** extent, not the `elevationExtent` clip. Override `elevationTileGrid.origin` only when the DEM pyramid uses a different top-left than the map.

`minZoom` / `maxZoom` on the OpenLayers source itself are unused whenever a `tileGrid` is provided (always, in Hajk). The clamp lives in `terrainZoomByMapZoom` / the lookup. If origin, extent or resolutions are missing the plugin logs a warning and OpenLayers falls back to a default `EPSG:3857` XYZ grid, which discards that mapping.

```json
{
  "elevationTileGrid": {
    "origin": [150000, 6360000],
    "extent": [150000, 6315000, 200000, 6360000],
    "resolutions": [84.0001, 56, 28, 14, 5.6, 2.8, 1.4, 0.56, 0.28, 0.14, 0.056]
  },
  "minZoom": 4,
  "maxZoom": 6
}
```

### Print and export

Print composites every `.ol-viewport canvas` after `rendercomplete`. WebGL canvases are a common blank-in-export case: some browsers clear the drawing buffer after compositing unless `preserveDrawingBuffer` is set, so the flood overlay may be missing from a printed PDF or a PNG export even though it is visible on screen. Treat that as a known WebGL limitation.

The pointer elevation readout only returns values for tiles already in the WebGL texture cache. Until a sample is available, and over nodata, the readout shows "–".
