import { z } from "zod";

import { AvailabilityOptionsSchema } from "./availability.schemas.ts";

const MetadataSchema = z.object({
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  owner: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  urlTitle: z.string().nullable().optional(),
  attribution: z.string().nullable().optional(),
});

const ProjectionSchema = z.object({
  id: z.number().optional(),
  code: z.string().min(1, "Projection code is required"),
});

const ServiceTypeSchema = z.enum([
  "ARCGIS",
  "VECTOR",
  "WFS",
  "WFST",
  "WMS",
  "WMTS",
]);
const ServerTypeSchema = z.enum(["QGIS_SERVER", "GEOSERVER"]);

export const ServiceCreateSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  url: z.url("Valid URL is required"),
  type: ServiceTypeSchema,
  serverType: ServerTypeSchema.default("GEOSERVER"),
  version: z.string().default("1.3.0"),
  imageFormat: z.string().default("image/png"),
  workspace: z.string().optional(),
  getMapUrl: z.string().optional(),
  comment: z.string().nullable().optional(),
  locked: z.boolean().default(false),
  projection: ProjectionSchema,
  metadata: MetadataSchema.optional(),
  options: AvailabilityOptionsSchema.optional(),
});

export const ServiceUpdateSchema = z.object({
  name: z.string().min(1, "Service name is required").optional(),
  url: z.url("Valid URL is required").optional(),
  type: ServiceTypeSchema.optional(),
  serverType: ServerTypeSchema.optional(),
  version: z.string().optional(),
  imageFormat: z.string().optional(),
  workspace: z.string().optional(),
  getMapUrl: z.string().nullable().optional(),
  comment: z.string().nullable().optional(),
  locked: z.boolean().optional(),
  projection: ProjectionSchema.optional(),
  metadata: MetadataSchema.optional(),
  options: AvailabilityOptionsSchema.optional(),
});

export type ServiceCreateInput = z.infer<typeof ServiceCreateSchema>;
export type ServiceUpdateInput = z.infer<typeof ServiceUpdateSchema>;
