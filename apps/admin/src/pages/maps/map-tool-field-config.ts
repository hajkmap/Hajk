/** Per-tool-type map settings fields exposed in admin and sent on save. */
export interface MapToolFieldConfig {
  target: boolean;
  windowPosition: boolean;
  windowWidth: boolean;
  windowHeight: boolean;
  index: boolean;
}

const ALL_MAP_TOOL_FIELDS: MapToolFieldConfig = {
  target: true,
  windowPosition: true,
  windowWidth: true,
  windowHeight: true,
  index: true,
};

const MAP_TOOL_FIELD_OVERRIDES: Record<string, Partial<MapToolFieldConfig>> = {
  externalLinks: {
    target: false,
    windowPosition: false,
    windowWidth: false,
    windowHeight: false,
  },
  information: {
    target: false,
    windowPosition: false,
    windowWidth: false,
    windowHeight: false,
    // The map always draws this button at the bottom of the controls.
    index: false,
  },
  documenthandler: {
    target: false,
    windowPosition: false,
    index: false,
  },
  infoclick: {
    target: false,
    index: false,
  },
  layercomparer: {
    windowPosition: false,
    windowWidth: false,
    windowHeight: false,
  },
  anchor: {
    windowPosition: false,
    windowWidth: false,
    windowHeight: false,
  },
  search: {
    target: false,
    windowPosition: false,
    windowWidth: false,
    windowHeight: false,
    index: false,
  },
  // Opens from the keyboard. The stored target and index are not a placement.
  commandpalette: {
    target: false,
    windowPosition: false,
    windowWidth: false,
    windowHeight: false,
    index: false,
  },
  preset: {
    target: false,
    windowPosition: false,
    windowWidth: false,
    windowHeight: false,
  },
};

export function getMapToolFieldConfig(toolType: string): MapToolFieldConfig {
  return {
    ...ALL_MAP_TOOL_FIELDS,
    ...(MAP_TOOL_FIELD_OVERRIDES[toolType] ?? {}),
  };
}
