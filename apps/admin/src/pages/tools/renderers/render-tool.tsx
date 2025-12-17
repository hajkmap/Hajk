import InfoClickRenderer from "./render-infoclick";
import PrintRenderer from "./render-print";
import AnchorRenderer from "./render-anchor";
import SketchRenderer from "./render-sketch";
import MeasureRenderer from "./render-measure";
import StreetViewRenderer from "./render-streetview";
import SearchRenderer from "./render-search";
// import RoutingRenderer from "./renderers/RoutingRenderer";
// import LocationRenderer from "./renderers/LocationRenderer";
// import PresetRenderer from "./renderers/PresetRenderer";
import React from "react";

const toolRenderers: Record<string, React.ComponentType<any>> = {
  print: PrintRenderer as React.ComponentType<any>,
  infoclick: InfoClickRenderer as React.ComponentType<any>,
  anchor: AnchorRenderer as React.ComponentType<any>,
  sketch: SketchRenderer as React.ComponentType<any>,
  measure: MeasureRenderer as React.ComponentType<any>,
  streetview: StreetViewRenderer as React.ComponentType<any>,
  search: SearchRenderer as React.ComponentType<any>,
  // routing: RoutingRenderer,
  // location: LocationRenderer,
  // preset: PresetRenderer,
};

export default function RenderTool({
  tool,
}: {
  tool: { type: string; [key: string]: any };
}) {
  const Renderer = toolRenderers[tool?.type];

  if (!Renderer) {
    return <div> Not rendering from render function: {tool?.type}</div>;
  }

  return <Renderer tool={tool} />;
}
