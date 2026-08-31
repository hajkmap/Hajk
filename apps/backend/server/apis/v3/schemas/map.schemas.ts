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
  groups: z.array(GroupCreateSchema).optional(),
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
  groups: z.array(GroupUpdateSchema).optional(),
});

const UsageSchema = z.enum(["BACKGROUND", "FOREGROUND"]);

export const MapLayersUpdateSchema = z.object({
  layers: z
    .array(
      z.object({
        layerId: z.string().min(1, "Layer id is required"),
        usage: UsageSchema.optional(),
        visibleAtStart: z.boolean().optional(),
        infoClickActive: z.boolean().optional(),
        zIndex: z.number().int().min(0).optional(),
      })
    )
    .default([]),
  /** When true, replace BACKGROUND even if `layers` has no BACKGROUND entries. */
  replaceBackground: z.boolean().optional(),
  /** When true, replace FOREGROUND even if `layers` has no FOREGROUND entries. */
  replaceForeground: z.boolean().optional(),
});

export const MapGroupsUpdateSchema = z.object({
  groups: z
    .array(
      z.object({
        id: z.string().optional(),
        groupId: z.string().min(1, "Group id is required"),
        parentGroupId: z.string().nullable().optional(),
        usage: UsageSchema.optional(),
        name: z.string().optional(),
        toggled: z.boolean().optional(),
        expanded: z.boolean().optional(),
        exclusiveGroup: z.boolean().optional(),
        infoDocument: z.boolean().optional(),
        index: z.number().int().min(0).optional(),
        metadata: z
          .object({
            title: z.string().optional(),
            description: z.string().optional(),
            owner: z.string().optional(),
            url: z.string().optional(),
            urlTitle: z.string().optional(),
            urlOpenData: z.string().optional(),
          })
          .nullable()
          .optional(),
      })
    )
    .default([]),
});

/** Atomic replace of direct map layers and group placements (Kartinnehåll). */
export const MapContentUpdateSchema = z.object({
  layers: MapLayersUpdateSchema.shape.layers,
  groups: MapGroupsUpdateSchema.shape.groups,
});

const LayerSwitcherLayerRefSchema = z.object({
  id: z.string().min(1),
  drawOrder: z.number().optional(),
  visibleAtStart: z.boolean().optional(),
  infobox: z.string().optional(),
});

type LayerSwitcherGroupWrite = {
  id: string;
  name?: string;
  toggled?: boolean;
  expanded?: boolean;
  exclusiveGroup?: boolean;
  infogroupvisible?: boolean;
  infogrouptitle?: string;
  infogrouptext?: string;
  infogroupurl?: string;
  infogroupurltext?: string;
  infogroupopendatalink?: string;
  infogroupowner?: string;
  layers?: z.infer<typeof LayerSwitcherLayerRefSchema>[];
  groups?: LayerSwitcherGroupWrite[];
};

const LayerSwitcherGroupSchema: z.ZodType<LayerSwitcherGroupWrite> = z.lazy(
  () =>
    z.object({
      id: z.string().min(1),
      name: z.string().optional(),
      toggled: z.boolean().optional(),
      expanded: z.boolean().optional(),
      exclusiveGroup: z.boolean().optional(),
      infogroupvisible: z.boolean().optional(),
      infogrouptitle: z.string().optional(),
      infogrouptext: z.string().optional(),
      infogroupurl: z.string().optional(),
      infogroupurltext: z.string().optional(),
      infogroupopendatalink: z.string().optional(),
      infogroupowner: z.string().optional(),
      layers: z.array(LayerSwitcherLayerRefSchema).optional(),
      groups: z.array(LayerSwitcherGroupSchema).optional(),
    }),
);

/** Atomic Kartlager + Bakgrund replace (GroupsOnMaps + BACKGROUND instances). */
export const MapLayerSwitcherUpdateSchema = z.object({
  groups: z.array(LayerSwitcherGroupSchema).default([]),
  baselayers: z
    .array(
      z.object({
        layerId: z.string().min(1, "Layer id is required"),
        visibleAtStart: z.boolean().optional(),
        infoClickActive: z.boolean().optional(),
        zIndex: z.number().int().min(0).optional(),
        infobox: z.string().optional(),
      }),
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
export type MapGroupsUpdateInput = z.infer<typeof MapGroupsUpdateSchema>;
export type MapContentUpdateInput = z.infer<typeof MapContentUpdateSchema>;
export type MapLayerSwitcherUpdateInput = z.infer<
  typeof MapLayerSwitcherUpdateSchema
>;
