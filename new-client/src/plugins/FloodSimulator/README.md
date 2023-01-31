# Flood Simulator Plugin

The main purpose for this plugin is to simulate how rising level of a body of water (mostly sea level) will affect the area in map. See [this Open Layers example](https://openlayers.org/en/latest/examples/webgl-sea-level.html) for a live demo.

## Developer info

### TODO:s

### Further development

Ideas for the future:

-

## Setup

Here's an example of the plugin config:

```json
{
    "type": "floodsimulator",
    "options": {
        "target": "control",
        "visibleAtStart": true,
        "floodLayerId": "bxrs5x", // Either specify an ID of an existing layer, or…
        "maptilerApiKey": "<getYourOwnKeyAt https://www.maptiler.com/cloud/>", //… use the Terrain RGB layer from MapTiler
        "title": "Översvämningssimulering",
        "description": "Simulera hur höjda vattennivåer påverkar kartområdet"
    },
    "index": 1
},
```

### The Admin UI

## Usage

The plugin is should be really simple to use. It is based on the idea of a slider, where the user can change the body of water level by dragging the slider. Flooded areas are visualized by a blue overlay.
