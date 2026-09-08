import InfoClickRenderer, { infoclickDefaults } from "./render-infoclick";
import PrintRenderer, { printDefaults } from "./render-print";
import AnchorRenderer, { anchorDefaults } from "./render-anchor";
import SketchRenderer, { sketchDefaults } from "./render-sketch";
import MeasurerRenderer, { measurerDefaults } from "./render-measurer";
import StreetViewRenderer, { streetviewDefaults } from "./render-streetview";
import SearchRenderer, { searchDefaults } from "./render-search";
import LayerSwitcherRenderer, {
  layerswitcherDefaults,
} from "./render-layerswitcher";
import DocumentHandlerRenderer from "./render-documenthandler";
import LocationRenderer, { locationDefaults } from "./render-location";
import BookmarksRenderer, { bookmarksDefaults } from "./render-bookmarks";
import RoutingRenderer, { routingDefaults } from "./render-routing";
import InformationRenderer, {
  informationDefaults,
} from "./render-information";
import PresetRenderer, { presetDefaults } from "./render-preset";
import React from "react";
import { Control, FieldValues, UseFormSetValue } from "react-hook-form";
import { Tool } from "../../../api/tools";

// Per-type option defaults, used by settings.tsx as the isDirty baseline.
// documenthandler isn't here yet — its fields don't use the `options.*` naming.
const toolOptionDefaults: Record<string, Record<string, unknown>> = {
  print: printDefaults,
  infoclick: infoclickDefaults,
  anchor: anchorDefaults,
  sketch: sketchDefaults,
  measurer: measurerDefaults,
  streetview: streetviewDefaults,
  search: searchDefaults,
  layerswitcher: layerswitcherDefaults,
  location: locationDefaults,
  bookmarks: bookmarksDefaults,
  routing: routingDefaults,
  information: informationDefaults,
  preset: presetDefaults,
};

export const getToolOptionDefaults = (
  type: string | undefined,
): Record<string, unknown> => (type ? toolOptionDefaults[type] : undefined) ?? {};

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
  location: LocationRenderer as React.ComponentType<ToolRendererProps>,
  bookmarks: BookmarksRenderer as React.ComponentType<ToolRendererProps>,
  routing: RoutingRenderer as React.ComponentType<ToolRendererProps>,
  information: InformationRenderer as React.ComponentType<ToolRendererProps>,
  preset: PresetRenderer as React.ComponentType<ToolRendererProps>,
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
