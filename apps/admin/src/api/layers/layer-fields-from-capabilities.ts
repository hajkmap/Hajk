import type { CapabilitiesLayerInfo } from "../services/types";
import type { LayerCreateInput } from "./types";

/**
 * A new layer's name, description and info title from its own part of the
 * service's GetCapabilities. Without a title the source layer's name is the
 * name, and an abstract that only repeats the title is left out.
 */
export function layerFieldsFromCapabilities(
  layerName: string,
  info: CapabilitiesLayerInfo | undefined,
): Pick<LayerCreateInput, "name" | "description" | "metadata"> {
  const { title, abstract } = info ?? {};
  return {
    name: title ?? layerName,
    ...(abstract && abstract !== title ? { description: abstract } : {}),
    ...(title ? { metadata: { title } } : {}),
  };
}
