# Sketch-plugin

The main purpose for this plugin is to allow for the users to draw features.

Drawn features can be imported and exported as **KML**, **GPX** and **GeoJSON**
(`.kml`, `.gpx`, `.geojson` / `.json`) from the upload activity, or by dragging a
file onto the map.

- **KML** and **GeoJSON** keep all geometry types, including polygons, and
  round-trip Sketch styling. Circles are stored as polygons plus
  `CIRCLE_RADIUS` / `CIRCLE_CENTER` so they can be restored as real circles on
  import.
- **GPX** only supports points (waypoints) and lines (tracks/routes); polygons
  and other complex geometries are excluded on export.

GeoJSON is written in WGS84 (EPSG:4326) per RFC 7946. On import, a legacy
`crs` member is honoured if the named projection is already registered in the
map (for example a QGIS export in SWEREF 99 TM).
