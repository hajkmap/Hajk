import { z } from "zod";

// Base schemas
const RoleOnUserSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

const RoleOnMapSchema = z.object({
  mapId: z.number().min(1, "Map ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

const RoleOnLayerSchema = z.object({
  layerId: z.string().min(1, "Layer ID is required"),
  roleId: z.string().optional(),
});

const RoleOnLayerInstanceSchema = z.object({
  layerInstanceId: z.string().min(1, "Layer Instance ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

const RoleOnToolSchema = z.object({
  toolId: z.number().min(1, "Tool ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

const RoleOnGroupSchema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

// Create schemas
export const RoleCreateSchema = z.object({
  code: z.string().min(1, "Role code is required"),
  title: z.string().optional(),
  description: z.string().optional(),
  systemCriticalRole: z.boolean().default(false),
  users: z.array(RoleOnUserSchema).optional(),
  RoleOnMap: z.array(RoleOnMapSchema).optional(),
  RoleOnLayer: z.array(RoleOnLayerSchema).optional(),
  RoleOnLayerInstance: z.array(RoleOnLayerInstanceSchema).optional(),
  RoleOnTool: z.array(RoleOnToolSchema).optional(),
  RoleOnGroup: z.array(RoleOnGroupSchema).optional(),
});

export const RoleOnUserCreateSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

export const RoleOnMapCreateSchema = z.object({
  mapId: z.number().min(1, "Map ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

export const RoleOnLayerCreateSchema = z.object({
  layerId: z.string().min(1, "Layer ID is required"),
  roleId: z.string().optional(),
});

export const RoleOnLayerInstanceCreateSchema = z.object({
  layerInstanceId: z.string().min(1, "Layer Instance ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

export const RoleOnToolCreateSchema = z.object({
  toolId: z.number().min(1, "Tool ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

export const RoleOnGroupCreateSchema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

// Update schemas
export const RoleUpdateSchema = z.object({
  code: z.string().min(1, "Role code is required").optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  systemCriticalRole: z.boolean().optional(),
  users: z.array(RoleOnUserSchema).optional(),
  RoleOnMap: z.array(RoleOnMapSchema).optional(),
  RoleOnLayer: z.array(RoleOnLayerSchema).optional(),
  RoleOnLayerInstance: z.array(RoleOnLayerInstanceSchema).optional(),
  RoleOnTool: z.array(RoleOnToolSchema).optional(),
  RoleOnGroup: z.array(RoleOnGroupSchema).optional(),
});

export const RoleOnUserUpdateSchema = z.object({
  userId: z.string().min(1, "User ID is required").optional(),
  roleId: z.string().min(1, "Role ID is required").optional(),
});

export const RoleOnMapUpdateSchema = z.object({
  mapId: z.number().min(1, "Map ID is required").optional(),
  roleId: z.string().min(1, "Role ID is required").optional(),
});

export const RoleOnLayerUpdateSchema = z.object({
  layerId: z.string().min(1, "Layer ID is required").optional(),
  roleId: z.string().optional(),
});

export const RoleOnLayerInstanceUpdateSchema = z.object({
  layerInstanceId: z
    .string()
    .min(1, "Layer Instance ID is required")
    .optional(),
  roleId: z.string().min(1, "Role ID is required").optional(),
});

export const RoleOnToolUpdateSchema = z.object({
  toolId: z.number().min(1, "Tool ID is required").optional(),
  roleId: z.string().min(1, "Role ID is required").optional(),
});

export const RoleOnGroupUpdateSchema = z.object({
  groupId: z.string().min(1, "Group ID is required").optional(),
  roleId: z.string().min(1, "Role ID is required").optional(),
});

// Type exports
export type RoleCreateInput = z.infer<typeof RoleCreateSchema>;
export type RoleOnUserCreateInput = z.infer<typeof RoleOnUserCreateSchema>;
export type RoleOnMapCreateInput = z.infer<typeof RoleOnMapCreateSchema>;
export type RoleOnLayerCreateInput = z.infer<typeof RoleOnLayerCreateSchema>;
export type RoleOnLayerInstanceCreateInput = z.infer<
  typeof RoleOnLayerInstanceCreateSchema
>;
export type RoleOnToolCreateInput = z.infer<typeof RoleOnToolCreateSchema>;
export type RoleOnGroupCreateInput = z.infer<typeof RoleOnGroupCreateSchema>;
export type RoleUpdateInput = z.infer<typeof RoleUpdateSchema>;
export type RoleOnUserUpdateInput = z.infer<typeof RoleOnUserUpdateSchema>;
export type RoleOnMapUpdateInput = z.infer<typeof RoleOnMapUpdateSchema>;
export type RoleOnLayerUpdateInput = z.infer<typeof RoleOnLayerUpdateSchema>;
export type RoleOnLayerInstanceUpdateInput = z.infer<
  typeof RoleOnLayerInstanceUpdateSchema
>;
export type RoleOnToolUpdateInput = z.infer<typeof RoleOnToolUpdateSchema>;
export type RoleOnGroupUpdateInput = z.infer<typeof RoleOnGroupUpdateSchema>;
