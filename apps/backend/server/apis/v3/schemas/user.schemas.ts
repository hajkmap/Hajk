import { z } from "zod";

// Enums
const AuthStrategySchema = z.enum(["LOCAL", "AZURE_AD", "GITHUB"]);

// Base schemas
const LocalAccountSchema = z.object({
  email: z.email("Valid email is required"),
  password: z.string().min(5, "Password must be at least 5 characters"),
  fullName: z.string().min(1, "Full name is required"),
  expires: z.date().optional(),
});

// Create schemas
export const UserCreateSchema = z.object({
  email: z.email("Valid email is required"),
  fullName: z.string().min(1, "Full name is required"),
  strategy: AuthStrategySchema.default("LOCAL"),
  localAccount: LocalAccountSchema.optional(),
});

export const LocalAccountCreateSchema = z.object({
  email: z.email("Valid email is required"),
  password: z.string().min(5, "Password must be at least 5 characters"),
  fullName: z.string().min(1, "Full name is required"),
  expires: z.date().optional(),
});

export const RoleCreateSchema = z.object({
  code: z.string().min(1, "Role code is required"),
  title: z.string().optional(),
  description: z.string().optional(),
  systemCriticalRole: z.boolean().default(false),
});

// Update schemas
export const UserUpdateSchema = z.object({
  email: z.email("Valid email is required").optional(),
  fullName: z.string().min(1, "Full name is required").optional(),
  strategy: AuthStrategySchema.optional(),
});

export const LocalAccountUpdateSchema = z.object({
  email: z.email("Valid email is required").optional(),
  password: z
    .string()
    .min(5, "Password must be at least 5 characters")
    .optional(),
  fullName: z.string().min(1, "Full name is required").optional(),
  expires: z.date().optional(),
});

export const RoleUpdateSchema = z.object({
  code: z.string().min(1, "Role code is required").optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  systemCriticalRole: z.boolean().optional(),
});

// Type exports
export type UserCreateInput = z.infer<typeof UserCreateSchema>;
export type LocalAccountCreateInput = z.infer<typeof LocalAccountCreateSchema>;
export type RoleCreateInput = z.infer<typeof RoleCreateSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
export type LocalAccountUpdateInput = z.infer<typeof LocalAccountUpdateSchema>;
export type RoleUpdateInput = z.infer<typeof RoleUpdateSchema>;
