## The PropertyChecker plugin

The purpose of this plugin is to **do a `GetFeatureInfo` request to an admin-specified WMS layer, group the incoming results using the admin-specified key `checkLayerPropertyAttribute` and display a list in its window**. The list show will contain the affected layers' names, one layer per row, and allow the user to change each layer's visibility. This will allow user to do a regular infoclick on the features that show up from these so called "affected" layers, while the PropertyChecker's list will stay visible in its own window.

So one way to see this is that this plugin is a kind of permanent infoclick window that queries a pre-specified layer, parses the results, looks for a couple of required attributes (see next paragraph) and displays the results as a list.

### Requirements

#### The Check Layer

You must prepare a proper WMS layer to query in order to use this plugin. Currently, you must also add that layer to LayerSwitcher (so it gets added to the map). This way you'll get an ID (from `layers.json`) – you must next provide this id as part of this plugin's configuration (see [example](#example-configuration)).

So, here is a brief specification of this required WMS layer.

1. A WMS layer with at least these attributes:

   1.1 `id` - corresponds to Hajk layer's ID in `layers.json`

   1.2 `caption` - corresponds to Hajk layer's caption in `layers.json` OR (in case of a Hajk group layer) the affected sublayer's caption

   1.3 `layer` - - corresponds to Hajk layer's sublayer name in `layers.json`. Not required for non-group layers.

   1.4 Any field you wish to group on. For example, if we're creating some property checker (which was the main intention of this plugin), we may want to group the results per _property_ (in Swedish, _fastighet_). You specify the WMS layer's attribute name you wish to group by using the `checkLayerPropertyAttribute` setting for this plugin. In our example, it is set to `fastighet`.

### Example configuration

```jsonc
{
    "type": "propertychecker",
    "options": {
        /* Check Layer - see the documentation for definition */
        "checkLayerId": "ar8q1v", // ID of the WMS layer that will act as the "Check Layer".
        "checkLayerPropertyAttribute": "fastighet", // The attribute name to group Check Layer features by. Normally the field that holds property's name.

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

        /* Should report functionality be enabled? */
        "enableCheckLayerReport": true, // Allow generating reports for the "Check Layer" tab?
        "enableDigitalPlansReport": true, // Allow generating reports for the "Digital Plans" tab?

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
