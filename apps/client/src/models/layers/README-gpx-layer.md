# GPX layer

[GPXLayer.js](GPXLayer.js) loads a GPX file into an OpenLayers vector layer.
[gpx.js](gpx.js) validates the document, reads its features and supplies infoclick
metadata. For Admin setup and a complete layer entry, see
[Direct GPX layers](../../../../../docs/gpx-layers.md).

## Construction and configuration

```js
const instance = new GPXLayer(config, proxy, map, observer);
map.addLayer(instance.layer);
```

The constructor receives mapped options from `ConfigMapper.mapGPXConfig()`.
The stored layer `id` becomes `name`, `visibleAtStart` becomes `visible`, and
`drawOrder` becomes `zIndex`. Use the normal layer loader when adding configured
layers to Hajk.

| Option                                            | Purpose                                         |
| ------------------------------------------------- | ----------------------------------------------- |
| `name`, `caption`                                 | Layer identity and display name                 |
| `url`                                             | GPX document URL                                |
| `visible`                                         | Whether to fetch immediately on construction    |
| `queryable`                                       | Include features in infoclick when `true`       |
| `opacity`                                         | Whole-layer opacity, mapped to `1` when omitted |
| `minZoom`, `maxZoom`                              | Zoom limits; `-1` disables a limit              |
| `zIndex`                                          | Drawing order                                   |
| `attribution`                                     | Source attribution                              |
| `waypointInfobox`, `routeInfobox`, `trackInfobox` | Markdown templates by object type               |

Other layer information fields are passed to [LayerInfo.js](LayerInfo.js).

## Styles and legends

| Object type | Color option and default   | Size option and default |
| ----------- | -------------------------- | ----------------------- |
| Waypoint    | `waypointColor`: `#008000` | `waypointRadius`: `6`   |
| Route       | `routeColor`: `#ffa500`    | `routeWidth`: `3`       |
| Track       | `trackColor`: `#0000ff`    | `trackWidth`: `3`       |

Waypoints use filled circles. Routes and tracks use strokes. Canvas swatches for
all three types are stored in `layerInfo.legend` for the LayerSwitcher and print
legends. These defaults are defined in `GPX_DEFAULTS` in `gpx.js`.

## Parsing and infoclick

GPX 1.0 and 1.1 documents must have the matching GPX namespace and a `gpx` root.
Coordinates are transformed from WGS84 into the map view projection. Waypoints,
routes and tracks are included, with track segments kept separate. Loading does
not change the map extent. Empty GPX documents are valid.

Each feature has `gpxType` (`waypoint`, `route` or `track`) and an ID in the form
`layerName:objectType:ordinal`, with a separate zero-based ordinal per type.
The parser keeps the object's own supported GPX attributes. Missing fields are
omitted; waypoint elevation includes zero and waypoint time is normalized to an
ISO timestamp. Route and track point attributes, document metadata and vendor
extensions are not promoted to feature properties.

`getGPXClickInfo()` groups results by layer instance and object type and selects
the corresponding infobox template. An empty template uses the standard
attribute table. External attribute strings are escaped during Markdown
substitution by the infoclick renderer.

## Loading and disposal

The first transition to visible fetches `(proxy || "") + config.url` through
`hfetch`. Initially visible layers fetch during construction. Successful results
stay in the source across visibility toggles; pending and completed requests are
not duplicated. There is no automatic refresh.

HTTP, network and parsing failures set `gpxLoadError`. Toggle the layer off and
on to retry. Successful retries clear the error. If supplied, `observer` receives
`layerswitcher.wmsLayerLoadStatus` with `{ id, gpx: true, status }`, where status
is `loading`, `ok` or `loaderror`.

Disposing `instance.layer` aborts the pending request, removes its visibility
listener and prevents late results from being added. Requests use the configured
`hfetch` credentials; direct external requests require CORS access. The Admin
preview uses its own loader and fetches the URL directly.
