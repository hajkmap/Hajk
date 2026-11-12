import { z } from "zod";

const dateTimeOrEmpty = z.union([
  z.literal(""),
  z.iso.datetime({ offset: true }),
]);

/**
 * The options of a map, a layer, a service or a group. They are free-form,
 * but the ones that decide whether the client's users get it are checked, see
 * utils/availability.ts.
 */
export const AvailabilityOptionsSchema = z
  .object({
    visible: z.enum(["true", "false"]).optional(),
    visibleFrom: dateTimeOrEmpty.optional(),
    visibleUntil: dateTimeOrEmpty.optional(),
  })
  .catchall(z.json())
  .refine(
    ({ visibleFrom, visibleUntil }) =>
      !visibleFrom ||
      !visibleUntil ||
      Date.parse(visibleFrom) < Date.parse(visibleUntil),
    {
      message: "visibleUntil must be after visibleFrom",
      path: ["visibleUntil"],
    }
  );
