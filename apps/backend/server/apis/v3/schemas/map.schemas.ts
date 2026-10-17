import { z } from "zod";

const ProjectionSchema = z.object({
  id: z.number().optional(),
  code: z.string().min(1, "Projection code is required"),
  definition: z.string().optional(),
  extent: z.array(z.number()).optional(),
  units: z.string().optional(),
});

import { ToolCreateSchema, ToolUpdateSchema } from "./tool.schemas.ts";

const MapProjectionSchema = z.object({
  code: z.string().min(1, "Projection code is required"),
});

export const MapCreateSchema = z.object({
  name: z.string().min(1, "Map name is required"),
  locked: z.boolean().default(false),
  options: z.record(z.string(), z.unknown()).default({}),
  projection: MapProjectionSchema.optional(),
  projections: z.array(ProjectionSchema).optional(),
  tools: z.array(ToolCreateSchema).optional(),
});

export const ProjectionCreateSchema = z.object({
  code: z.string().min(1, "Projection code is required"),
  definition: z.string().min(1, "Projection definition is required"),
  extent: z.array(z.number()).optional(),
  units: z.string().optional(),
  locked: z.boolean().default(false),
});

export const MapDuplicateSchema = z.object({
  name: z.string().min(1, "Map name is required"),
  includeLayers: z.boolean().default(true),
  includeGroups: z.boolean().default(true),
  includeTools: z.boolean().default(true),
});

export const MapUpdateSchema = z.object({
  name: z.string().min(1, "Map name is required").optional(),
  locked: z.boolean().optional(),
  options: z.record(z.string(), z.unknown()).optional(),
  projection: MapProjectionSchema.optional(),
  projections: z.array(ProjectionSchema).optional(),
  tools: z.array(ToolUpdateSchema).optional(),
});

/**
 * The search and editing layers a map uses, in order. Its display layers are
 * its layer tree and background (PUT /maps/:mapName/layer-tree).
 */
export const MapLayersUpdateSchema = z.object({
  layers: z
    .array(
      z.object({
        layerId: z.string().min(1, "Layer id is required"),
        zIndex: z.number().int().min(0).optional(),
      })
    )
    .default([]),
});

export const ProjectionUpdateSchema = z.object({
  code: z.string().min(1, "Projection code is required").optional(),
  definition: z.string().min(1, "Projection definition is required").optional(),
  extent: z.array(z.number()).optional(),
  units: z.string().optional(),
  locked: z.boolean().optional(),
});

export type MapDuplicateInput = z.infer<typeof MapDuplicateSchema>;
export type MapCreateInput = z.infer<typeof MapCreateSchema>;
export type ProjectionCreateInput = z.infer<typeof ProjectionCreateSchema>;
export type MapUpdateInput = z.infer<typeof MapUpdateSchema>;
export type ProjectionUpdateInput = z.infer<typeof ProjectionUpdateSchema>;
export type MapLayersUpdateInput = z.infer<typeof MapLayersUpdateSchema>;
