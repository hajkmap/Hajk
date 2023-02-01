## Vision-integration plugin

A plugin used to communicate with the EDP Vision software. The communication is handled via a SignalR communication-hub.

### Prerequisites

To have any use of this plugin, your organization has to use the EDP Vision software. Furthermore, a communication-hub has to be configured.

#### Communication-hub handlers

The plugin is built to subscribe and publish to some specific events on the communication-hub.

_The events that the plugin is subscribed to are the following:_

- `HandleRealEstatesIdentifiers(List<RealEstateIdentifier> realEstateIdentifiers)`  
  When invoked, the plugin shows the geometry connected to the supplied real-estate-objects. The geometries are not sent trough the communication-hub, instead the geometries are fetched by doing a WFS-lookup against the specified `WFS-service`.
- `HandleCoordinates(List<Coordinate> coordinates)`  
  When invoked, the plugin shows the supplied coordinates in the map. Here, no lookup against a `WFS-service` is necessary, since the coordinates are supplied trough the connection. (See the DTO's further down).
- `HandleAskingForRealEstateIdentifiers()`  
  When invoked, the plugin sends all currently selected real-estates to Vision. Could be used to create a filter in Vision for example.
- `HandleAskingForCoordinates()`  
  When invoked, the plugin sends all the currently selected coordinates to Vision. Could be used to connect a Vision entry to a location for example.
- `HandleAskingForFeatures()`  
   When invoked, the plugin sends all currently selected environment-features to Vision. Could be used to create a filter in Vision for example.
- `HandleFeatures(List<Features> features)`  
  When invoked, the plugin shows the geometry connected to the supplied environment-objects. The geometries are not sent trough the communication-hub, instead the geometries are fetched by doing a WFS-lookup against the specified `WFS-service`.
- `HandleAskingForFeatureGeometry(Feature feature)`  
  When invoked, the plugin enables the edit-view, allowing the user to create/modify the geometry connected to the current object. When Vision asks for feature geometry eventual already existing geometries are not sent trough the communication-hub, instead the geometries are fetched by doing a WFS-lookup against the specified `WFS-service`.
- `HandleOperationFeedback(OperationFeedback feedback)`  
  Vision sends sends feedback regarding the save-event of a new geometry. The flow is as follow: 1. Visions asks for a feature geometry. 2. Edit view is enabled in Hajk, and the user draws a geometry. 3. The user clicks save and the geometry is sent to Vision. 4. Vision saves the geometry and sends feedback over this subscription.

_The events that the plugin publishes are the following:_

- `SendRealEstateIdentifiers(List<RealEstateIdentifier> realEstateIdentifiers)`  
  Invoked when real-estates are to be sent to Vision. This event is invoked after `HandleAskingForRealEstateIdentifiers()` has been invoked. (The event will never be invoked from the plugin itself, instead Vision is always the first to invoke).
- `SendCoordinates(List<Coordinate> coordinates)`  
  Invoked when coordinates are to be sent to Vision. This event is invoked after `HandleAskingForCoordinates()` has been invoked. (The event will never be invoked from the plugin itself, instead Vision is always the first to invoke).
- `SendFeatures(List<Feature> features)`  
  Invoked when environment-features are to be sent to Vision. This event is invoked after `HandleAskingForFeatures()` has been invoked. (The event will never be invoked from the plugin itself, instead Vision is always the first to invoke).
- `SendGeometry(<Geometry> payload)`  
  Invoked when environment-features are to be sent to Vision. This event is invoked after `HandleAskingForFeatures()` has been invoked. (The event will never be invoked from the plugin itself, instead Vision is always the first to invoke).

#### DTO's

The data to send between Hajk and Vision trough the hub must follow the following structure:  
**Coordinate:**

```json
{
  Northing: <number>,
  Easting: <number>,
  SpatialReferenceSystemIdentifier: <integer> example 3007 <= notice lack of "EPSG",
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

**Geometry**

```json
{
    Wkt: <string>,
    SrsId: <integer>,
}

```

**Feature**

```json
{
  Id: <string>,
  Type: <integer>,
}

```

**OperationFeedback**

```json
{
    Operation: <integer>,
    Success: <boolean>,
    Text: <string>,
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
    "searchSources": [{ "id": "aabb00", "visibleForGroups": [] }],
    "integrationSettings": [
      {
        "id": "ESTATES",
        "searchKey": "uuid",
        "wmsId": "aabb11",
        "wfsId": "aabb22",
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
            "featureProperty": "uuid",
            "overrideValue": ""
          },
          {
            "key": "municipality",
            "featureProperty": null,
            "overrideValue": "Gothenburg"
          }
        ]
      },
      {
        "id": "ENVIRONMENT_1",
        "searchKey": "id",
        "wmsId": "aabb33",
        "wfsId": "aabb44",
        "fieldsToSend": [
          {
            "key": "id",
            "featureProperty": "stromraadekod",
            "overrideValue": null
          },
          {
            "key": "type",
            "featureProperty": null,
            "overrideValue": 1
          }
        ]
      },
      {
        "id": "ENVIRONMENT_2",
        "searchKey": "id",
        "wmsId": "aabb55",
        "wfsId": "aabb66",
        "fieldsToSend": [
          {
            "key": "id",
            "featureProperty": "recundersoekningytaid",
            "overrideValue": null
          },
          {
            "key": "type",
            "featureProperty": null,
            "overrideValue": 2
          }
        ]
      },
      {
        "id": "ENVIRONMENT_3",
        "searchKey": "id",
        "wmsId": "aabb77",
        "wfsId": "aabb88",
        "fieldsToSend": [
          {
            "key": "id",
            "featureProperty": "strfoeroreningkod",
            "overrideValue": null
          },
          {
            "key": "type",
            "featureProperty": null,
            "overrideValue": 3
          }
        ]
      }
    ],
    "visibleForGroups": []
  },
  "index": 10
}
```

There are some settings that might seem confusing. I'll try to explain:

- `hubUrl`: A url that points to a SignalR communication-hub with the functionality described earlier.
- `userOverride`: To allow communication between the plugin and Vision we have to establish a communication path between the user session in Vision and the user session in Hajk. To do this, we use the logged-on user (which should be the same in Vision and in Hajk). If you (maybe for testing purposes?) would like to override the logged-on user (and send some other user-name trough to the communication-hub), this is where it is stated.
- `searchSources`: To be able to find the geometry connected to the real-estates, we do lookups against a `WFS-service`. For now, the only required `WFS-service` is the real-estate-service. (As you can see in the `integrationSettings[0].wfsId` we use that `WFS-service` in the real-estate part of the plugin). The `id` and `visibleForGroups` properties of the `searchSources` follow the same pattern as throughout Hajk (the `id` is referencing a layer-configuration in the layers.json-file).
- `integrationSettings`: Here settings regarding different parts of the plugin are stored. The `integrationSettings` might seem messy, but they are there for a reason. The `id` should be left as-is, the `searchKey` should specify in what field we can find the key sent from Vision in the connected WFS-source, the `wmsId` should specify what id the WMS-layer has (must be added to the layer-switcher separately), the `wfsId` should specify what id the WFS-source id, and the `fieldsToSend` is there to allow an admin to change what is sent to Vision (if the DTO changes).

### Functionality

The plugin has the following functionality:

- Select estates in the map and send them to Vision
- Select coordinates in the map and send them to Vision
- Select environment features in the map and send them to Vision (Area, investigation, and pollution features)
- Send estates from Vision and show their geometry in the map
- Send coordinates from Vision and show their geometry in the map
- Send environment features from Vision and show their geometry in the map (Area, investigation, and pollution features)
- Create/Modify environment features and send the result to Vision

### Support

For information regarding the communication-hub, Vision etc. contact The environmental administration office in Gothenburg.
