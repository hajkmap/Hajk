import { z } from "zod";

const ProjectionSchema = z.object({
  id: z.number().optional(),
  code: z.string().min(1, "Projection code is required"),
  definition: z.string().optional(),
  extent: z.array(z.number()).optional(),
  units: z.string().optional(),
});

import { ToolCreateSchema, ToolUpdateSchema } from "./tool.schemas.ts";
import { GroupCreateSchema, GroupUpdateSchema } from "./group.schemas.ts";

export const MapCreateSchema = z.object({
  name: z.string().min(1, "Map name is required"),
  locked: z.boolean().default(false),
  options: z.record(z.string(), z.unknown()).default({}),
  projections: z.array(ProjectionSchema).optional(),
  tools: z.array(ToolCreateSchema).optional(),
  groups: z.array(GroupCreateSchema).optional(),
});

export const ProjectionCreateSchema = z.object({
  code: z.string().min(1, "Projection code is required"),
  definition: z.string().min(1, "Projection definition is required"),
  extent: z.array(z.number()).optional(),
  units: z.string().optional(),
  locked: z.boolean().default(false),
});

export const MapUpdateSchema = z.object({
  name: z.string().min(1, "Map name is required").optional(),
  locked: z.boolean().optional(),
  options: z.record(z.string(), z.unknown()).optional(),
  projections: z.array(ProjectionSchema).optional(),
  tools: z.array(ToolUpdateSchema).optional(),
  groups: z.array(GroupUpdateSchema).optional(),
});

export const ProjectionUpdateSchema = z.object({
  code: z.string().min(1, "Projection code is required").optional(),
  definition: z.string().min(1, "Projection definition is required").optional(),
  extent: z.array(z.number()).optional(),
  units: z.string().optional(),
  locked: z.boolean().optional(),
});

export type MapCreateInput = z.infer<typeof MapCreateSchema>;
export type ProjectionCreateInput = z.infer<typeof ProjectionCreateSchema>;
export type MapUpdateInput = z.infer<typeof MapUpdateSchema>;
export type ProjectionUpdateInput = z.infer<typeof ProjectionUpdateSchema>;
