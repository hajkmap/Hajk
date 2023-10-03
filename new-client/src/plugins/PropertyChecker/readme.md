## The PropertyChecker plugin

The purpose of this plugin is to **do a `GetFeatureInfo` request to an admin-specified WMS layer, group the incoming results using the admin-specified key `attributeNameToGroupBy` and display a list in its window**. The list show will contain the affected layers' names, one layer per row, and allow the user to change each layer's visibility. This will allow user to do a regular infoclick on the features that show up from these so called "affected" layers, while the PropertyChecker's list will stay visible in its own window.

So one way to see this is that this plugin is a kind of permanent infoclick window that queries a pre-specified layer, parses the results, looks for a couple of required attributes (see next paragraph) and displays the results as a list.

### Requirements

You must prepare a proper WMS layer to query in order to use this plugin. Currently, you must also add that layer to LayerSwitcher (so it gets added to the map). This way you'll get an ID (from `layers.json`) – you must next provide this id as part of this plugin's configuration (see [example](#example-configuration)).

So, here is a brief specification of this required WMS layer.

1. A WMS layer with at least these attributes:

   1.1 `id` - corresponds to Hajk layer's ID in `layers.json`

   1.2 `caption` - corresponds to Hajk layer's caption in `layers.json` OR (in case of a Hajk group layer) the affected sublayer's caption

   1.3 `layer` - - corresponds to Hajk layer's sublayer name in `layers.json`. Not required for non-group layers.

   1.4 Any field you wish to group on. For example, if we're creating some property checker (which was the main intention of this plugin), we may want to group the results per _property_ (in Swedish, _fastighet_). You specify the WMS layer's attribute name you wish to group by using the `attributeNameToGroupBy` setting for this plugin. In our example, it is set to `fastighet`.

### Example configuration

```jsonc
{
    "type": "propertychecker",
    "options": {
        "visibleAtStart": true,
        "checkLayerId": "ar8q1v", // Our WMS layer that we'll query
        "attributeNameToGroupBy": "fastighet", // The attribute name we wish to group by
        "target": "right",
        "position": "left",
        "height": "dynamic"
    },
    "index": 1
},
```
