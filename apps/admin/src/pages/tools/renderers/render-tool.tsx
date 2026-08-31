import InfoClickRenderer from "./render-infoclick";
import PrintRenderer from "./render-print";
import AnchorRenderer from "./render-anchor";
import SketchRenderer from "./render-sketch";
import MeasurerRenderer from "./render-measurer";
import StreetViewRenderer from "./render-streetview";
import SearchRenderer from "./render-search";
import LayerSwitcherRenderer from "./render-layerswitcher";
import DocumentHandlerRenderer from "./render-documenthandler";
// import RoutingRenderer from "./renderers/RoutingRenderer";
// import LocationRenderer from "./renderers/LocationRenderer";
// import PresetRenderer from "./renderers/PresetRenderer";
import React from "react";
import { Control, FieldValues, UseFormSetValue } from "react-hook-form";
import { Tool } from "../../../api/tools";

interface ToolRendererProps {
  tool: Tool;
  control?: Control<FieldValues>;
  setValue?: UseFormSetValue<FieldValues>;
}

const toolRenderers: Record<string, React.ComponentType<ToolRendererProps>> = {
  print: PrintRenderer as React.ComponentType<ToolRendererProps>,
  infoclick: InfoClickRenderer as React.ComponentType<ToolRendererProps>,
  anchor: AnchorRenderer as React.ComponentType<ToolRendererProps>,
  sketch: SketchRenderer as React.ComponentType<ToolRendererProps>,
  measurer: MeasurerRenderer as React.ComponentType<ToolRendererProps>,
  streetview: StreetViewRenderer as React.ComponentType<ToolRendererProps>,
  search: SearchRenderer as React.ComponentType<ToolRendererProps>,
  layerswitcher:
    LayerSwitcherRenderer as React.ComponentType<ToolRendererProps>,
  documenthandler:
    DocumentHandlerRenderer as React.ComponentType<ToolRendererProps>,
  // routing: RoutingRenderer,
  // location: LocationRenderer,
  // preset: PresetRenderer,
};

interface RenderToolProps {
  tool: Tool;
  control: Control<FieldValues>;
  setValue: UseFormSetValue<FieldValues>;
}

export default function RenderTool({ tool, control, setValue }: RenderToolProps) {
  const Renderer = toolRenderers[tool?.type];

  if (!Renderer) {
    return <div> Not rendering from render function: {tool?.type}</div>;
  }

  return <Renderer tool={tool} control={control} setValue={setValue} />;
}
