## The PropertyChecker plugin

The purpose of this plugin is to **do a `GetFeatureInfo` request to an admin-specified WMS layer, group the incoming results using the admin-specified key `checkLayerPropertyAttribute` and display a list in its window**. The list show will contain the affected layers' names, one layer per row, and allow the user to change each layer's visibility. This will allow user to do a regular infoclick on the features that show up from these so called "affected" layers, while the PropertyChecker's list will stay visible in its own window.

So one way to see this is that this plugin is a kind of permanent infoclick window that queries a pre-specified layer, parses the results, looks for a couple of required attributes (see next paragraph) and displays the results as a list.

### Requirements

#### The Check Layer

You must prepare a proper WMS layer to query in order to use this plugin. Currently, you must also add that layer to LayerSwitcher (so it gets added to the map). This way you'll get an ID (from `layers.json`) – you must next provide this id as part of this plugin's configuration (see [example](#example-configuration)).

So, here is a brief specification of this required WMS layer.

1. A WMS layer that returns **one feature per affected property**. The layer could, in theory, return more than one features and the UI could be extended to support it, but currently that functionality is disabled, as it was found to distract the users. But depending on where the user clicks, it can happen that more than one features is returned.

Anyway, the featured returned from the layer is required to have at least these two attributes:

1.1 **A grouping attribute** (e.g. `fastighet`) — identifies a single property. Results are grouped by its value in the UI. The attribute name is set via the plugin's `checkLayerPropertyAttribute` setting.

1.2 **An "affected by" attribute** (e.g. `paverkas_av`) — a JSON-encoded string listing the Hajk layers that affect this property. The attribute name is set via the plugin's `checkLayerAffectedByAttribute` setting. Expected format:

```json
[
  {
    "id": "<hajk-layer-id>",
    "text": "Optional explanation, shown when the row is expanded"
  }
]
```

- `id` must match a layer's ID in `layers.json`. The plugin uses it to look up the layer's caption and the OpenLayers layer reference (needed for the visibility toggle and sorting). Entries whose `id` is not found are skipped with a console warning.
- `text` is optional. When non-empty, it is rendered above the user's "Notering" field inside the expandable area of each layer row.

**Note:** Layer captions are resolved from `layers.json` via the looked-up `id`.

##### Example WMS Check Layer Response

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "fastighetskollen_data.7",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [9280.3736, 83207.631],
            [9254.0005, 83200.519],
            [256.0465, 83179.8],
            [282.5938, 83183.483],
            [285.5404, 83187.905],
            [280.3736, 83207.631]
          ]
        ]
      },
      "geometry_name": "geom",
      "properties": {
        "fastighet": "EXEMPLET 1:1",
        "omr": 1,
        "karta": "map_1",
        "paverkas_av": "[{\"id\":\"a14ad9\",\"text\":\"Exempeltext att visa i UI\"},{\"id\":\"m16c9a\",\"text\":\"Exempeltext att visa i UI\"}]",
        "primary_key": 7
      }
    }
  ],
  "totalFeatures": "unknown",
  "numberReturned": 1,
  "timeStamp": "2026-04-28T12:02:35.910Z",
  "crs": {
    "type": "name",
    "properties": { "name": "urn:ogc:def:crs:EPSG::3008" }
  }
}
```

### Example configuration

```jsonc
{
    "type": "propertychecker",
    "options": {
        /* Check Layer - see the documentation for definition */
        "checkLayerId": "ar8q1v", // ID of the WMS layer that will act as the "Check Layer".
        "checkLayerPropertyAttribute": "fastighet", // The attribute name to group Check Layer features by. Normally the field that holds property's name.
        "checkLayerAffectedByAttribute": "paverkas_av", // The attribute name on a Check Layer feature holding the JSON-encoded list of affecting layers (`[{"id":"<hajk-layer-id>","text":"This will be shown in the UI, could provide further explanation on why this layer is part of the layer check."}]`).

        /* Digital Plans Layer - roughly corresponds to the table layout delivered by the MyCarta Plan application.
         * We still have the ability to customize which column names are used, so this could work with other
         * providers, if you can figure out these values.
         * In general, you want to group the flat Features that come as a response from this layer into a two-level
         * structure: `planFeatures[level1][level2]`, where `level1` is a specific digital plan, while `level2` is
         * some other kind of grouping (a common grouping would be "type of regulation", if a plan contains different
         * regulation types).
         */
        "digitalPlansLayerId": "s5viu8", // ID of the WMS layer that holds the "Digital Plans".
        "groupDigitalPlansLayerByAttribute": "dokument", // The attribute name that response from Digital Plans layer will be grouped by in the first level.
        "groupDigitalPlansLayerSecondLevelByAttribute": "bestammelsetyp", // A second level grouping. This means we'll have an object like `planFeatures["PLAN-123"]["Generic regulations"] = { .../* Only features that belong to PLAN-123 and are of type 'Generic regulations' */}``.
        "digitalPlanStatusAttribute": "plan_planstatus", // The field that holds plan's legal status.
        "digitalPlanStatusDateAttribute": "plan_statusdatum", // Field with most recent legal status' actualization date.
        "digitalPlanDescriptionAttribute": "plan_syfte", // The field that holds plan's longer description.
        "digitalPlansLayerSecondLevelOrder": [ // Determines in which order the second level grouping values are printed in the report.
          "Användningsbestämmelse", // Must correspond to actual valid, unique values in column specified
          "Egenskapsbestämmelse"    // in `groupDigitalPlansLayerSecondLevelByAttribute`.
        ],
        "digitalPlanItemTitleAttribute": "label_text", // Each plan consists of regulations. This is the field that holds a regulation's unique name. Used as caption.
        "digitalPlanItemDescriptionAttributes": [ // Each regulation can have multiple descriptions, with corresponding labels. These are defined in the array below:
          {
            "label": "Formulering", // Label of the description, will be shown as "Label: ".
            "column": "formulering" // The column in the WMS layer that holds the description, its value is shown after the label
          },
          {
            "label": "Ursprunglig formulering",
            "column": "ursprungligformulering",
            "fallbackValue": "-" // An optional fallback value in case the attribute is not present in the
            // layer. `null` is a special value that this option can hold. When set to `null` and if the value
            // is falsy, nothing will be shown for this given field - not even its label.
          }
        ],

        /* QuickButtons defintion */
        "buildingsLayerIds": "1328", // ID(s) of layers to toggle when user clicks the buildings shortcut button.
        "bordersLayerIds": "1329,1358,1439,1357", // ID(s) of layers to toggle when user clicks the borders shortcut button.
        "plansLayerIds": "j77k2s,7vmhc3,tpgv5m,aoxhlq,h91wc9,s5viu8", // ID(s) of layers to toggle when user clicks the plans shortcut button.

        /* Which tabs/modules are active? */
        "enableCheckLayerTab": true, // Show the Check Layer tab? When false, no GetFeatureInfo request is made to the check layer. Default: true.
        "enableDigitalPlansTab": true, // Show the Digital Plans tab? When false, no GetFeatureInfo request is made to the digital plans layer. Default: true.

        /* Should report functionality be enabled? */
        "enableCheckLayerReport": true, // Allow generating reports for the "Check Layer" tab?
        "enableDigitalPlansReport": true, // Allow generating reports for the "Digital Plans" tab?

        /* Check Layer tab extras */
        "showToggleAllCheckLayers": false, // Show a "Tänd/Släck alla träffar" button that toggles all hit layers' visibility at once. Default: false.

        /* q_pc URL param support — lets external systems deep-link directly into PropertyChecker results.
         * Usage: append ?q_pc=EXEMPLET+1%3A1 (or #q_pc=...) to the URL.
         * The value is first looked up by property name via an existing WFS search source (propertyNameLookupWfsLayerId).
         * If no result is found and address lookup is configured, the value is tried against the address search source.
         * The map is panned/zoomed to the resolved geometry and the normal PropertyChecker search pipeline is triggered.
         * The q_pc param is also written back to the URL hash when the user clicks on the map, making all results shareable.
         *
         * The two settings below reference EXISTING WFS search sources configured in the Search tool — give the `id` of
         * the source (the same id as in layers.json). PropertyChecker reuses the app's SearchModel, so the WFS proxy,
         * projection handling and output-format parsing all come for free. Matching uses that source's configured
         * `searchFields` (exact, case-insensitive) — tune precision by configuring `searchFields` on the source itself. */
        "propertyNameLookupWfsLayerId": "985", // Id of the WFS search source used to resolve a property name to geometry. Required for q_pc to work.
        "addressLookupWfsLayerId": "339", // (Optional) Id of the WFS search source used for address-based fallback lookup.

        /* Generic Hajk plugin settings */
        "visibleAtStart": true,
        "target": "right",
        "position": "left",
        "height": "dynamic",
        "visibleForGroups": [
          "SOME_AD_GROUP",
          "NOTE_THAT_THIS_DOES_REQUIRE_AD_FUNCTIONALITY"
        ]
    },
    "index": 1
},
```
