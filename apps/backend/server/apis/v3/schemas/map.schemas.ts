import { z } from "zod";

// Base schemas
const ProjectionSchema = z.object({
  id: z.number().optional(),
  code: z.string().min(1, "Projection code is required"),
  definition: z.string().optional(),
  extent: z.array(z.number()).optional(),
  units: z.string().optional(),
});

const ToolSchema = z.object({
  id: z.number().optional(),
  type: z.string().min(1, "Tool type is required"),
  options: z.record(z.string(), z.unknown()).optional(),
  locked: z.boolean().optional(),
});

const LayerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Layer name is required"),
  internalName: z.string().optional(),
  description: z.string().optional(),
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
});

const GroupSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Group name is required"),
  internalName: z.string().optional(),
  type: z.enum(["Layer", "Search"]).default("Layer"),
  locked: z.boolean().optional(),
});

// Create schemas
export const MapCreateSchema = z.object({
  name: z.string().min(1, "Map name is required"),
  locked: z.boolean().default(false),
  options: z.record(z.string(), z.unknown()).default({}),
  projections: z.array(ProjectionSchema).optional(),
  tools: z.array(ToolSchema).optional(),
  layers: z.array(LayerSchema).optional(),
  groups: z.array(GroupSchema).optional(),
});

export const ProjectionCreateSchema = z.object({
  code: z.string().min(1, "Projection code is required"),
  definition: z.string().min(1, "Projection definition is required"),
  extent: z.array(z.number()).optional(),
  units: z.string().optional(),
  locked: z.boolean().default(false),
});

export const ToolCreateSchema = z.object({
  type: z.string().min(1, "Tool type is required"),
  options: z.record(z.string(), z.unknown()).default({}),
  locked: z.boolean().default(false),
});

// Update schemas
export const MapUpdateSchema = z.object({
  name: z.string().min(1, "Map name is required").optional(),
  locked: z.boolean().optional(),
  options: z.record(z.string(), z.unknown()).optional(),
  projections: z.array(ProjectionSchema).optional(),
  tools: z.array(ToolSchema).optional(),
  layers: z.array(LayerSchema).optional(),
  groups: z.array(GroupSchema).optional(),
});

export const ProjectionUpdateSchema = z.object({
  code: z.string().min(1, "Projection code is required").optional(),
  definition: z.string().min(1, "Projection definition is required").optional(),
  extent: z.array(z.number()).optional(),
  units: z.string().optional(),
  locked: z.boolean().optional(),
});

export const ToolUpdateSchema = z.object({
  type: z.string().min(1, "Tool type is required").optional(),
  options: z.record(z.string(), z.unknown()).optional(),
  locked: z.boolean().optional(),
});

// Type exports
export type MapCreateInput = z.infer<typeof MapCreateSchema>;
export type ProjectionCreateInput = z.infer<typeof ProjectionCreateSchema>;
export type ToolCreateInput = z.infer<typeof ToolCreateSchema>;
export type MapUpdateInput = z.infer<typeof MapUpdateSchema>;
export type ProjectionUpdateInput = z.infer<typeof ProjectionUpdateSchema>;
export type ToolUpdateInput = z.infer<typeof ToolUpdateSchema>;
