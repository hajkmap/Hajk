import { z } from "zod";

const RoleOnToolSchema = z.object({
  toolId: z.number().min(1, "Tool ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

const ToolsOnMapsSchema = z.object({
  mapName: z.string().min(1, "Map name is required"),
  toolId: z.number().min(1, "Tool ID is required"),
  index: z.number().default(0),
  options: z.record(z.string(), z.unknown()).default({}),
});

export const ToolCreateSchema = z.object({
  type: z.string().min(1, "Tool type is required"),
  options: z.record(z.string(), z.unknown()).default({}),
  locked: z.boolean().default(false),
  maps: z.array(ToolsOnMapsSchema).optional(),
  restrictedToRoles: z.array(RoleOnToolSchema).optional(),
});

export const ToolsOnMapsCreateSchema = z.object({
  mapName: z.string().min(1, "Map name is required"),
  toolId: z.number().min(1, "Tool ID is required"),
  index: z.number().default(0),
  options: z.record(z.string(), z.unknown()).default({}),
});

export const ToolUpdateSchema = z.object({
  type: z.string().min(1, "Tool type is required").optional(),
  options: z.record(z.string(), z.unknown()).optional(),
  locked: z.boolean().optional(),
  maps: z.array(ToolsOnMapsSchema).optional(),
  restrictedToRoles: z.array(RoleOnToolSchema).optional(),
});

export const ToolsOnMapsUpdateSchema = z.object({
  mapName: z.string().min(1, "Map name is required").optional(),
  toolId: z.number().min(1, "Tool ID is required").optional(),
  index: z.number().optional(),
  options: z.record(z.string(), z.unknown()).optional(),
});

export type ToolCreateInput = z.infer<typeof ToolCreateSchema>;
export type ToolsOnMapsCreateInput = z.infer<typeof ToolsOnMapsCreateSchema>;
export type ToolUpdateInput = z.infer<typeof ToolUpdateSchema>;
export type ToolsOnMapsUpdateInput = z.infer<typeof ToolsOnMapsUpdateSchema>;
