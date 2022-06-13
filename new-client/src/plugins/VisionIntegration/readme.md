## Vison-integration plugin

A plugin used to communicate with the EDP Vision software. The communication is handled via a SignalR communication-hub.

### Prerequisites

To have any use of this plugin, your organisation has to use the EDP Vision software. Furthermore, a communication-hub has to be configured.

#### Communication-hub handlers

The plugin is built to subscribe and publish to some specific events on the communication-hub.

_The events that the plugin is subscribed to are the following:_

- `HandleRealEstatesIdentifiers(List<RealEstateIdentifier> realEstateIdentifiers)`  
  When invoked, the plugin shows the geometry connected to the supplied real-estate-objects. The geometries are not sent trough the communication-hub, instead the geometries are fetched by doing a WFS-lookup against the specified `WFS-service` (more on that later).
- `HandleCoordinates(List<Coordinate> coordinates)`  
  When invoked, the plugin shows the supplied coordinates in the map. Here, no lookup against a `WFS-serivce` is neccesary, since the coordinates are supplied trough the connection. (See the DTO's further down).
- `HandleAskingForRealEstateIdentifiers()`  
  When invoked, the plugin sends all currently selected real-estates to Vision. Could be used to create a filter in Vision for example.
- `HandleAskingForCoordinates()`  
  When invoked, the plugin sends all the currently selected coordinates to Vision. Could be used to connect a Vision entry to a location for example.

_The events that the plugin publishes are the following:_

- `SendRealEstateIdentifiers(List<RealEstateIdentifier> realEstateIdentifiers)`  
  Invoked when real-estates are to be sent to Vision. This event is invoked after `HandleAskingForRealEstateIdentifiers()` has been invoked. (The event will never be invoked from the plugin itself, instead Vision is always the first to invoke).
- `SendCoordinates(List<Coordinate> coordinates)`  
  Invoked when coordinates are to be sent to Vision. This event is invoked after `HandleAskingForCoordinates()` has been invoked. (The event will never be invoked from the plugin itself, instead Vision is always the first to invoke).

#### DTO's

The data to send between Hajk and Vision trought the hub must follow the following structure:  
**Coordinate:**

```json
{
  Northing: <string>,
  Easting: <string>,
  SpatialReferenceSystemIdentifier: <string> example ”3007” <= notice lack of "EPSG",
  Label: <string>,
}
```

**realEstateIdentifier**

```json
{
  Fnr: <string>,
  Uuid: <string>,
  Municipality: <string>,
  Name: <string>,
}
```

### Configuration

To be able to use the plugin, a proper plugin-configuration is crucial. Below is an example of how the plugin configuration might look:

```json
{
  "type": "visionintegration",
  "options": {
    "target": "left",
    "position": "left",
    "visibleAtStart": true,
    "hubUrl": "https://a-proper-communication-hub.com",
    "userOverride": "",
    "searchSources": [{ "id": "2", "visibleForGroups": [] }],
    "integrationSettings": [
      {
        "id": "ESTATES",
        "searchKey": "fnr",
        "wmsId": "1",
        "wfsId": "2",
        "fieldsToSend": [
          {
            "key": "fnr",
            "featureProperty": "fnr_fr",
            "overrideValue": null
          },
          {
            "key": "name",
            "featureProperty": "fastighet_enkel",
            "overrideValue": null
          },
          {
            "key": "uuid",
            "featureProperty": null,
            "overrideValue": ""
          },
          {
            "key": "municipality",
            "featureProperty": null,
            "overrideValue": "Gothenburg"
          }
        ]
      }
    ],
    "visibleForGroups": []
  },
  "index": 10
}
```

There are some settings that might seem confusing. I'll try to explan:

- `hubUrl`: A url that points to a SignalR communication-hub with the functionality described earlier.
- `userOverride`: To allow communication between the plugin and Vision we have to establish a communication path between the user session in Vision and the user session in Hajk. To do this, we use the logged-on user (which should be the same in Vision and in Hajk). If you (maybe for testing pruposes?) would like to override the logged-on user (and send some other user-name trough to the communicaiton-hub), this is where it is stated.
- `searchSources`: To be able to find the geometry connected to the real-estates, we do lookups agains a `WFS-service`. For now, the only required `WFS-service` is the real-estate-service. (As you can see in the `integrationSettings[0].wfsId` we use that `WFS-service` in the real-estate part of the plugin). The `id` and `visibleForGroups` properties of the `searchSources` follow the same pattern as troughout Hajk (the `id` is referencing a layer-configuration in the layers.json-file).
- `integrationSettings`: Here setttings regarding different parts of the plugin are stored. (As of today, we only really have one part of the plugin that need settings (the real-estates part), but more will probably come in the future). The `integrationSettings` might seem messy, but they are there for a reason. The `id` should be left as-is, the `searchKey` should specify in what field we can find the FNR in the estate-search-source, the `wmsId` should specify what id the estate-WMS-layer has (must be added to the layer-switcher separately), the `wfsId` should specify what id the estate-WFS-source has, and the `fieldsToSend` is there to allow an admin to change what is sent to Vison (if the DTO changes).

### Usage

There isn't much to say regarding how the plugin is to be used really. There isn't that much functionality. Select estates/coordinates in the map and send them to Vision, or look at estates/coordinates sent from Vision in the map.

### Support

For information regarding the communication-hub, Vision etc. contact The environmental administration office in Gothenburg.
