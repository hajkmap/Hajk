# KML layer

[KMLLayer.js](KMLLayer.js) loads KML placemarks into an OpenLayers vector layer.
[kml.js](kml.js) validates the document, classifies geometries and supplies
infoclick metadata. For Admin setup and complete configuration examples, see
[Direct KML layers](../../../../../docs/kml-layers.md).

## Construction and configuration

```js
const instance = new KMLLayer(config, proxy, map, observer);
map.addLayer(instance.layer);
```

The constructor receives mapped options from `ConfigMapper.mapKMLConfig()`.
The stored layer `id` becomes `name`, `visibleAtStart` becomes `visible`, and
`drawOrder` becomes `zIndex`. Use the normal layer loader when adding configured
layers to Hajk.

| Option                                                               | Purpose                                         |
| -------------------------------------------------------------------- | ----------------------------------------------- |
| `name`, `caption`                                                    | Layer identity and display name                 |
| `url`                                                                | KML document URL                                |
| `visible`                                                            | Whether to fetch immediately on construction    |
| `queryable`                                                          | Include features in infoclick when `true`       |
| `opacity`                                                            | Whole-layer opacity, mapped to `1` when omitted |
| `minZoom`, `maxZoom`                                                 | Zoom limits; `-1` disables a limit              |
| `zIndex`                                                             | Drawing order                                   |
| `attribution`                                                        | Source attribution                              |
| `pointInfobox`, `lineInfobox`, `polygonInfobox`, `collectionInfobox` | Markdown templates by geometry type             |

Other layer information fields are passed to [LayerInfo.js](LayerInfo.js).

## Embedded styles and overrides

OpenLayers reads the file with `extractStyles: true` and `showPointNames: true`.
File styles are retained unless every field for a geometry type is present and
non-empty on the configuration. There are no stored override booleans and no
automatic style defaults for overrides.

| Geometry type | Required override fields                                                             | Result                                                 |
| ------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| Point         | `pointColor`, `pointRadius`                                                          | Filled circle, replacing the icon and point-name label |
| Line          | `lineColor`, `lineWidth`                                                             | Replacement stroke                                     |
| Polygon       | `polygonStrokeColor`, `polygonStrokeWidth`, `polygonFillColor`, `polygonFillOpacity` | Replacement stroke and fill                            |

For six-digit hex fill colors, `polygonFillOpacity` supplies the fill alpha.
The whole-layer `opacity` still applies to all geometries.

OpenLayers gives feature styles precedence over layer styles. After parsing,
`KMLLayer` applies overrides directly with `feature.setStyle()`. Features whose
types have no override keep their file styles. The Admin preview applies the
same rule.

Homogeneous MultiGeometries use their constituent type, including nested
collections. Mixed collections have type `collection` and retain their file
style. `gx:Track` and `gx:MultiTrack` use the line type. Legend swatches are
created only for overridden types, so a layer with no overrides has no generated
legend entries.

## Parsing and infoclick

Documents must have a `kml` root. Supported namespaces are OGC KML 2.2,
Google Earth KML 2.0/2.1/2.2, and no namespace. Folders are flattened and
placemarks without geometry are skipped. Empty documents are valid. Coordinates
are transformed from WGS84 to the map view projection without changing the map
extent.

Each feature has `kmlType` (`point`, `line`, `polygon` or `collection`) and an ID
in the form `layerName:geometryType:ordinal`, with a separate zero-based ordinal
per type. Properties include `name`, `description`, `address`, `phoneNumber`, and
string values from ExtendedData `Data` and `SimpleData`. Missing values and
document metadata are omitted.

ExtendedData is removed from the document copy passed to OpenLayers and read
separately. The reserved `geometry` field is omitted so external attributes
cannot replace the OpenLayers geometry. `kmlType` is assigned by the parser.

`getKMLClickInfo()` groups results by layer instance and geometry type and picks
the matching infobox template. An empty template uses the standard attribute
table. External attribute strings are escaped during Markdown substitution;
HTML in descriptions is shown as text.

KMZ archives, NetworkLinks and Ground/Screen/PhotoOverlays are not loaded.

## Loading and disposal

The first transition to visible fetches `(proxy || "") + config.url` through
`hfetch`. Initially visible layers fetch during construction. Successful results
stay in the source across visibility toggles; pending and completed requests are
not duplicated. There is no automatic refresh.

HTTP, network and parsing failures set `kmlLoadError`. Toggle the layer off and
on to retry. Successful retries clear the error. If supplied, `observer` receives
`layerswitcher.wmsLayerLoadStatus` with `{ id, kml: true, status }`, where status
is `loading`, `ok` or `loaderror`.

Disposing `instance.layer` aborts the pending request, removes its visibility
listener and prevents late results from being added. Only the KML document uses
Hajk's proxy prefix and `hfetch` credential overrides. Referenced icon images are
requested by OpenLayers. External document and image hosts must allow the
required CORS access. The Admin preview fetches the document URL directly.
