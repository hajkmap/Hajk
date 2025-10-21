import { z } from "zod";

const ServiceTypeSchema = z.enum([
  "ARCGIS",
  "VECTOR",
  "WFS",
  "WFST",
  "WMS",
  "WMTS",
]);
const ServerTypeSchema = z.enum(["QGIS_SERVER", "GEOSERVER"]);
const SearchOutputFormatSchema = z.enum(["GML2", "GML3", "GML32"]);
const UseTypeSchema = z.enum(["BACKGROUND", "FOREGROUND"]);

const MetadataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  owner: z.string().optional(),
  url: z.string().optional(),
  urlTitle: z.string().optional(),
  attribution: z.string().optional(),
});

const ServiceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Service name is required"),
  url: z.url("Valid URL is required"),
  type: ServiceTypeSchema,
  serverType: ServerTypeSchema.default("GEOSERVER"),
  version: z.string().default("1.3.0"),
  imageFormat: z.string().default("image/png"),
  workspace: z.string().optional(),
  getMapUrl: z.string().optional(),
  comment: z.string().optional(),
  locked: z.boolean().default(false),
});

const InfoClickSettingsSchema = z.object({
  definition: z.string().optional(),
  icon: z.string().optional(),
  format: z.string().default("application/json"),
  sortProperty: z.string().optional(),
  sortMethod: z.string().default("text"),
  sortDescending: z.boolean().default(false),
});

const SearchSettingsSchema = z.object({
  active: z.boolean().default(false),
  url: z.string().optional(),
  searchFields: z.array(z.string()).optional(),
  primaryDisplayFields: z.array(z.string()).optional(),
  secondaryDisplayFields: z.array(z.string()).optional(),
  shortDisplayFields: z.array(z.string()).optional(),
  outputFormat: SearchOutputFormatSchema.default("GML3"),
  geometryField: z.string().optional(),
});

export const LayerCreateSchema = z.object({
  name: z.string().min(1, "Layer name is required"),
  internalName: z.string().optional(),
  description: z.string().optional(),
  serviceId: z.string().min(1, "Service ID is required"),
  metadataId: z.string().optional(),
  searchSettingsId: z.string().optional(),
  infoClickSettingsId: z.string().optional(),
  selectedLayers: z.array(z.string()).default([]),
  locked: z.boolean().default(false),
  opacity: z.number().min(0).max(1).default(1),
  maxZoom: z.number().default(-1),
  minZoom: z.number().default(-1),
  minMaxZoomAlertOnToggleOnly: z.boolean().default(false),
  tiled: z.boolean().default(false),
  singleTile: z.boolean().default(false),
  hidpi: z.boolean().default(false),
  legendOptions: z.string().optional(),
  legendUrl: z.string().optional(),
  legendIconUrl: z.string().optional(),
  style: z.string().optional(),
  customRatio: z.number().default(0),
  showMetadata: z.boolean().default(false),
  infoClickActive: z.boolean().default(true),
  timeSliderVisible: z.boolean().default(false),
  timeSliderStart: z.string().optional(),
  timeSliderEnd: z.string().optional(),
  hideExpandArrow: z.boolean().default(false),
  zIndex: z.number().default(0),
  options: z.record(z.string(), z.unknown()).default({}),
  service: ServiceSchema.optional(),
  metadata: MetadataSchema.optional(),
  infoClickSettings: InfoClickSettingsSchema.optional(),
  searchSettings: SearchSettingsSchema.optional(),
});

export const LayerInstanceCreateSchema = z.object({
  layerId: z.string().min(1, "Layer ID is required"),
  mapId: z.number().optional(),
  groupId: z.string().optional(),
  usage: UseTypeSchema,
  infoClickActive: z.boolean().default(true),
  visibleAtStart: z.boolean().default(false),
  zIndex: z.number().default(0),
  options: z.record(z.string(), z.unknown()).default({}),
});

export const MetadataCreateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  owner: z.string().optional(),
  url: z.string().optional(),
  urlTitle: z.string().optional(),
  attribution: z.string().optional(),
});

export const InfoClickSettingsCreateSchema = z.object({
  layerId: z.string().optional(),
  layerInstanceId: z.string().optional(),
  definition: z.string().optional(),
  icon: z.string().optional(),
  format: z.string().default("application/json"),
  sortProperty: z.string().optional(),
  sortMethod: z.string().default("text"),
  sortDescending: z.boolean().default(false),
});

export const SearchSettingsCreateSchema = z.object({
  active: z.boolean().default(false),
  url: z.string().optional(),
  searchFields: z.array(z.string()).optional(),
  primaryDisplayFields: z.array(z.string()).optional(),
  secondaryDisplayFields: z.array(z.string()).optional(),
  shortDisplayFields: z.array(z.string()).optional(),
  outputFormat: SearchOutputFormatSchema.default("GML3"),
  geometryField: z.string().optional(),
});

export const LayerUpdateSchema = z.object({
  name: z.string().min(1, "Layer name is required").optional(),
  internalName: z.string().optional(),
  description: z.string().optional(),
  serviceId: z.string().min(1, "Service ID is required").optional(),
  metadataId: z.string().optional(),
  searchSettingsId: z.string().optional(),
  infoClickSettingsId: z.string().optional(),
  selectedLayers: z.array(z.string()).optional(),
  locked: z.boolean().optional(),
  opacity: z.number().min(0).max(1).optional(),
  maxZoom: z.number().optional(),
  minZoom: z.number().optional(),
  minMaxZoomAlertOnToggleOnly: z.boolean().optional(),
  tiled: z.boolean().optional(),
  singleTile: z.boolean().optional(),
  hidpi: z.boolean().optional(),
  legendOptions: z.string().optional(),
  legendUrl: z.string().optional(),
  legendIconUrl: z.string().optional(),
  style: z.string().optional(),
  customRatio: z.number().optional(),
  showMetadata: z.boolean().optional(),
  infoClickActive: z.boolean().optional(),
  timeSliderVisible: z.boolean().optional(),
  timeSliderStart: z.string().optional(),
  timeSliderEnd: z.string().optional(),
  hideExpandArrow: z.boolean().optional(),
  zIndex: z.number().optional(),
  options: z.record(z.string(), z.unknown()).optional(),
  service: ServiceSchema.optional(),
  metadata: MetadataSchema.optional(),
  infoClickSettings: InfoClickSettingsSchema.optional(),
  searchSettings: SearchSettingsSchema.optional(),
});

export const LayerInstanceUpdateSchema = z.object({
  layerId: z.string().min(1, "Layer ID is required").optional(),
  mapId: z.number().optional(),
  groupId: z.string().optional(),
  usage: UseTypeSchema.optional(),
  infoClickActive: z.boolean().optional(),
  visibleAtStart: z.boolean().optional(),
  zIndex: z.number().optional(),
  options: z.record(z.string(), z.unknown()).optional(),
});

export const MetadataUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  owner: z.string().optional(),
  url: z.string().optional(),
  urlTitle: z.string().optional(),
  attribution: z.string().optional(),
});

export const InfoClickSettingsUpdateSchema = z.object({
  layerId: z.string().optional(),
  layerInstanceId: z.string().optional(),
  definition: z.string().optional(),
  icon: z.string().optional(),
  format: z.string().optional(),
  sortProperty: z.string().optional(),
  sortMethod: z.string().optional(),
  sortDescending: z.boolean().optional(),
});

export const SearchSettingsUpdateSchema = z.object({
  active: z.boolean().optional(),
  url: z.string().optional(),
  searchFields: z.array(z.string()).optional(),
  primaryDisplayFields: z.array(z.string()).optional(),
  secondaryDisplayFields: z.array(z.string()).optional(),
  shortDisplayFields: z.array(z.string()).optional(),
  outputFormat: SearchOutputFormatSchema.optional(),
  geometryField: z.string().optional(),
});

export type LayerCreateInput = z.infer<typeof LayerCreateSchema>;
export type LayerInstanceCreateInput = z.infer<
  typeof LayerInstanceCreateSchema
>;
export type MetadataCreateInput = z.infer<typeof MetadataCreateSchema>;
export type InfoClickSettingsCreateInput = z.infer<
  typeof InfoClickSettingsCreateSchema
>;
export type SearchSettingsCreateInput = z.infer<
  typeof SearchSettingsCreateSchema
>;
export type LayerUpdateInput = z.infer<typeof LayerUpdateSchema>;
export type LayerInstanceUpdateInput = z.infer<
  typeof LayerInstanceUpdateSchema
>;
export type MetadataUpdateInput = z.infer<typeof MetadataUpdateSchema>;
export type InfoClickSettingsUpdateInput = z.infer<
  typeof InfoClickSettingsUpdateSchema
>;
export type SearchSettingsUpdateInput = z.infer<
  typeof SearchSettingsUpdateSchema
>;
