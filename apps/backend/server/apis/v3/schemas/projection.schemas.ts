import { z } from "zod";

const ExtentSchema = z
  .array(z.number().finite())
  .length(4, "Extent must have exactly 4 numbers: minX, minY, maxX, maxY");

export const ProjectionCreateSchema = z.object({
  code: z.string().trim().min(1, "Projection code is required"),
  definition: z.string().trim().min(1, "Projection definition is required"),
  extent: ExtentSchema,
  units: z.string().trim().optional(),
  /**
   * When the code is `EPSG:N`, also create its OGC URL alias
   * (`http://www.opengis.net/gml/srs/epsg.xml#N`) with the same values.
   */
  withOgcAlias: z.boolean().default(false),
});

export const ProjectionUpdateSchema = z.object({
  definition: z
    .string()
    .trim()
    .min(1, "Projection definition is required")
    .optional(),
  extent: ExtentSchema.optional(),
  units: z.string().trim().optional(),
});

export type ProjectionCreateInput = z.infer<typeof ProjectionCreateSchema>;
export type ProjectionUpdateInput = z.infer<typeof ProjectionUpdateSchema>;
