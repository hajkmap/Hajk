import { z } from "zod";

const GroupTypeSchema = z.enum(["Layer", "Search"]);

const RoleOnGroupSchema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  roleId: z.string().min(1, "Role ID is required"),
});

const RoleOnGroupWriteSchema = z.object({
  roleId: z.string().min(1, "Role ID is required"),
  groupId: z.string().optional(),
});

/** A layer a new group starts with: in a layer group's tree, or a search layer. */
const GroupLayerSchema = z.object({
  layerId: z.string().min(1, "Layer ID is required"),
});

export const GroupCreateSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  internalName: z.string().optional(),
  type: GroupTypeSchema.default("Layer"),
  locked: z.boolean().default(false),
  layers: z.array(GroupLayerSchema).optional(),
  restrictedToRoles: z.array(RoleOnGroupWriteSchema).optional(),
});

/** A group's own fields; a layer group's content is saved with its tree. */
export const GroupUpdateSchema = z.object({
  name: z.string().min(1, "Group name is required").optional(),
  internalName: z.string().optional(),
  type: GroupTypeSchema.optional(),
  locked: z.boolean().optional(),
  restrictedToRoles: z.array(RoleOnGroupWriteSchema).optional(),
});

export type GroupCreateInput = z.infer<typeof GroupCreateSchema>;
export type GroupUpdateInput = z.infer<typeof GroupUpdateSchema>;
export { RoleOnGroupSchema };
