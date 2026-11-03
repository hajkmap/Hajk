import { Prisma } from "@prisma/client";
import log4js from "log4js";

import prisma from "../../../common/prisma.ts";
import { HajkError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../common/hajk-status-codes.ts";
import type {
  ProjectionCreateInput,
  ProjectionUpdateInput,
} from "../schemas/projection.schemas.ts";
import {
  epsgCodeForms,
  epsgNumber,
  ogcUrlCode,
} from "../utils/projection-codes.ts";

const logger = log4js.getLogger("service.v3.projection");

const usageInclude = {
  mapView: { select: { id: true, name: true, deletedAt: true } },
  maps: { select: { id: true, name: true, deletedAt: true } },
  service: { select: { id: true, name: true, deletedAt: true } },
} satisfies Prisma.ProjectionInclude;

type ProjectionWithUsage = Prisma.ProjectionGetPayload<{
  include: typeof usageInclude;
}>;

export interface ProjectionMapUsage {
  id: number;
  name: string;
  usage: "main" | "linked";
  deleted: boolean;
}

export interface ProjectionServiceUsage {
  id: string;
  name: string;
  deleted: boolean;
}

function toPublicProjection<T extends { extent: Prisma.Decimal[] }>(p: T) {
  return { ...p, extent: p.extent.map((value) => Number(value)) };
}

function toProjectionWithUsage(p: ProjectionWithUsage) {
  const { mapView, maps, service, ...projection } = p;
  const mapUsage: ProjectionMapUsage[] = [
    ...mapView.map((m) => ({
      id: m.id,
      name: m.name,
      usage: "main" as const,
      deleted: m.deletedAt !== null,
    })),
    ...maps
      // A map's main projection is normally also linked; list it once.
      .filter((m) => !mapView.some((main) => main.id === m.id))
      .map((m) => ({
        id: m.id,
        name: m.name,
        usage: "linked" as const,
        deleted: m.deletedAt !== null,
      })),
  ];
  const serviceUsage: ProjectionServiceUsage[] = service.map((s) => ({
    id: s.id,
    name: s.name,
    deleted: s.deletedAt !== null,
  }));
  return {
    ...toPublicProjection(projection),
    maps: mapUsage,
    services: serviceUsage,
  };
}

/** Human-readable list of what still uses a projection, or null if unused. */
function describeUsage(p: ProjectionWithUsage): string | null {
  const parts: string[] = [];
  const mapNames = Array.from(
    new Set([...p.mapView, ...p.maps].map((m) => m.name))
  );
  if (mapNames.length > 0) parts.push(`maps: ${mapNames.join(", ")}`);
  const serviceNames = p.service.map((s) => s.name);
  if (serviceNames.length > 0) {
    parts.push(`services: ${serviceNames.join(", ")}`);
  }
  return parts.length > 0 ? parts.join("; ") : null;
}

async function getProjectionOrThrow(id: number) {
  const projection = await prisma.projection.findUnique({
    where: { id },
    include: usageInclude,
  });
  if (!projection) {
    throw new HajkError(
      HttpStatusCodes.NOT_FOUND,
      `Projection with id ${id} not found`,
      HajkStatusCodes.UNKNOWN_PROJECTION
    );
  }
  return projection;
}

function assertNotLocked(projection: { code: string; locked: boolean }) {
  if (projection.locked) {
    throw new HajkError(
      HttpStatusCodes.CONFLICT,
      `Projection ${projection.code} is locked`,
      HajkStatusCodes.PROJECTION_CHANGE_BLOCKED
    );
  }
}

/** The other form (`EPSG:N` ↔ OGC URL) of a projection, if it exists. */
async function findPartner(code: string) {
  const n = epsgNumber(code);
  if (n === null) return null;
  const partnerCode = epsgCodeForms(n).find((c) => c !== code);
  if (!partnerCode) return null;
  return prisma.projection.findUnique({
    where: { code: partnerCode },
    include: usageInclude,
  });
}

class ProjectionService {
  constructor() {
    logger.debug("Initiating ProjectionService");
  }

  async getProjectionsWithUsage() {
    const projections = await prisma.projection.findMany({
      include: usageInclude,
      orderBy: { code: "asc" },
    });
    return projections.map(toProjectionWithUsage);
  }

  async createProjection(input: ProjectionCreateInput) {
    const { withOgcAlias, ...data } = input;
    const existing = await prisma.projection.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new HajkError(
        HttpStatusCodes.CONFLICT,
        `Projection ${data.code} already exists`,
        HajkStatusCodes.PROJECTION_ALREADY_EXISTS
      );
    }

    const codes = [data.code];
    const n = epsgNumber(data.code);
    if (
      withOgcAlias &&
      n !== null &&
      data.code.toUpperCase().startsWith("EPSG:")
    ) {
      const aliasCode = ogcUrlCode(n);
      const aliasExists = await prisma.projection.findUnique({
        where: { code: aliasCode },
      });
      if (!aliasExists) codes.push(aliasCode);
    }

    const created = await prisma.$transaction(
      codes.map((code) =>
        prisma.projection.create({
          data: {
            code,
            definition: data.definition,
            extent: data.extent,
            units: data.units || null,
          },
        })
      )
    );
    logger.info(`Created projection(s) ${codes.join(", ")}`);
    return created.map(toPublicProjection);
  }

  async updateProjection(id: number, input: ProjectionUpdateInput) {
    const projection = await getProjectionOrThrow(id);
    assertNotLocked(projection);

    const data: Prisma.ProjectionUpdateInput = {};
    if (input.definition !== undefined) data.definition = input.definition;
    if (input.extent !== undefined) data.extent = input.extent;
    if (input.units !== undefined) data.units = input.units || null;

    // Keep the pair in sync: the partner follows when it was identical.
    const partner = await findPartner(projection.code);
    const partnerFollows =
      partner !== null &&
      !partner.locked &&
      partner.definition === projection.definition;

    const updated = await prisma.$transaction([
      prisma.projection.update({ where: { id }, data }),
      ...(partnerFollows
        ? [prisma.projection.update({ where: { id: partner.id }, data })]
        : []),
    ]);
    logger.info(
      `Updated projection(s) ${updated.map((p) => p.code).join(", ")}`
    );
    return updated.map(toPublicProjection);
  }

  /**
   * Deletes a projection and, when unused, its other form (`EPSG:N` ↔ OGC
   * URL). Refuses while the projection is locked or used by any map
   * (soft-deleted ones included, since they still reference it) or service.
   */
  async deleteProjection(id: number) {
    const projection = await getProjectionOrThrow(id);
    assertNotLocked(projection);

    const usage = describeUsage(projection);
    if (usage) {
      throw new HajkError(
        HttpStatusCodes.CONFLICT,
        `Projection ${projection.code} is still used by ${usage}`,
        HajkStatusCodes.PROJECTION_CHANGE_BLOCKED
      );
    }

    const partner = await findPartner(projection.code);
    const deletePartner =
      partner !== null && !partner.locked && describeUsage(partner) === null;
    const ids = [id, ...(deletePartner ? [partner.id] : [])];

    await prisma.projection.deleteMany({ where: { id: { in: ids } } });
    const codes = [projection.code, ...(deletePartner ? [partner.code] : [])];
    logger.info(`Deleted projection(s) ${codes.join(", ")}`);
    return { deleted: codes };
  }
}

export default new ProjectionService();
