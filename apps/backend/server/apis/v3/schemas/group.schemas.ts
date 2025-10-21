import { z } from "zod";

const GroupTypeSchema = z.enum(["Layer", "Search"]);
const UseTypeSchema = z.enum(["BACKGROUND", "FOREGROUND"]);

const RoleOnGroupSchema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

const LayerInstanceSchema = z.object({
  id: z.string().optional(),
  layerId: z.string().min(1, "Layer ID is required"),
  mapId: z.number().optional(),
  groupId: z.string().optional(),
  usage: UseTypeSchema,
  infoClickActive: z.boolean().default(true),
  visibleAtStart: z.boolean().default(false),
  zIndex: z.number().default(0),
  options: z.record(z.string(), z.unknown()).default({}),
});

const GroupsOnMapsSchema = z.object({
  id: z.string().optional(),
  mapName: z.string().min(1, "Map name is required"),
  groupId: z.string().min(1, "Group ID is required"),
  parentGroupId: z.string().optional(),
  usage: UseTypeSchema,
  name: z.string().min(1, "Group name is required"),
  toggled: z.boolean().default(false),
  expanded: z.boolean().default(false),
});

export const GroupCreateSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  internalName: z.string().optional(),
  type: GroupTypeSchema.default("Layer"),
  locked: z.boolean().default(false),
  layers: z.array(LayerInstanceSchema).optional(),
  maps: z.array(GroupsOnMapsSchema).optional(),
  restrictedToRoles: z.array(RoleOnGroupSchema).optional(),
});

export const GroupsOnMapsCreateSchema = z.object({
  mapName: z.string().min(1, "Map name is required"),
  groupId: z.string().min(1, "Group ID is required"),
  parentGroupId: z.string().optional(),
  usage: UseTypeSchema,
  name: z.string().min(1, "Group name is required"),
  toggled: z.boolean().default(false),
  expanded: z.boolean().default(false),
});

export const GroupUpdateSchema = z.object({
  name: z.string().min(1, "Group name is required").optional(),
  internalName: z.string().optional(),
  type: GroupTypeSchema.optional(),
  locked: z.boolean().optional(),
  layers: z.array(LayerInstanceSchema).optional(),
  maps: z.array(GroupsOnMapsSchema).optional(),
  restrictedToRoles: z.array(RoleOnGroupSchema).optional(),
});

export const GroupsOnMapsUpdateSchema = z.object({
  mapName: z.string().min(1, "Map name is required").optional(),
  groupId: z.string().min(1, "Group ID is required").optional(),
  parentGroupId: z.string().optional(),
  usage: UseTypeSchema.optional(),
  name: z.string().min(1, "Group name is required").optional(),
  toggled: z.boolean().optional(),
  expanded: z.boolean().optional(),
});

export type GroupCreateInput = z.infer<typeof GroupCreateSchema>;
export type GroupsOnMapsCreateInput = z.infer<typeof GroupsOnMapsCreateSchema>;
export type GroupUpdateInput = z.infer<typeof GroupUpdateSchema>;
export type GroupsOnMapsUpdateInput = z.infer<typeof GroupsOnMapsUpdateSchema>;
