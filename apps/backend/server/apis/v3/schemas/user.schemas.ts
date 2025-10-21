import { z } from "zod";

const AuthStrategySchema = z.enum(["LOCAL", "AZURE_AD", "GITHUB"]);

const LocalAccountSchema = z.object({
  email: z.email("Valid email is required"),
  password: z.string().min(5, "Password must be at least 5 characters"),
  fullName: z.string().min(1, "Full name is required"),
  expires: z.date().optional(),
});

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

export type UserCreateInput = z.infer<typeof UserCreateSchema>;
export type LocalAccountCreateInput = z.infer<typeof LocalAccountCreateSchema>;
export type UserUpdateInput = z.infer<typeof UserUpdateSchema>;
export type LocalAccountUpdateInput = z.infer<typeof LocalAccountUpdateSchema>;
