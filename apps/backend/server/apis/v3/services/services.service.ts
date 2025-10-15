import { Prisma } from "@prisma/client";
import log4js from "log4js";

import prisma from "../../../common/prisma.ts";

const logger = log4js.getLogger("service.v3.layer");
const DEFAULT_PROJECTION_CODE = "EPSG:3006";
class ServicesService {
  constructor() {
    logger.debug("Initiating Services Service");
  }

  async getServices() {
    // Get all services and the sum of layers
    // per each service
    const services = await prisma.service.findMany({
      include: {
        // select all columns in the service table
        metadata: true,
        projection: true,
        _count: {
          select: {
            layers: true,
          },
        },
      },
    });

    return services;
  }

  async getServiceById(id: string) {
    const service = await prisma.service.findUnique({
      where: { id },
      include: { metadata: true, projection: true },
    });

    return service;
  }

  async getLayersByServiceId(id: string) {
    const layers = await prisma.layer.findMany({
      where: { serviceId: id },
    });

    return layers;
  }

  // Get all maps that use a layer or a group that uses a layer
  // that belongs to the service
  async getMapsByServiceId(id: string) {
    const maps = await prisma.map.findMany({
      select: {
        id: true,
        name: true,
      },
      where: {
        OR: [
          {
            layers: {
              some: {
                layer: {
                  serviceId: id,
                },
              },
            },
          },
          {
            groups: {
              some: {
                group: {
                  layers: {
                    some: {
                      layer: {
                        serviceId: id,
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    });

    return maps;
  }

  async getAllProjections() {
    const projections = await prisma.projection.findMany();

    return projections;
  }

  async createService(
    data: Prisma.ServiceCreateInput & {
      projection?: { code: string };
      metadata?: Record<string, unknown>;
    }
  ) {
    const projectionCode = data?.projection?.code || DEFAULT_PROJECTION_CODE;
    const existingProjection = await prisma.projection.findUnique({
      where: { code: projectionCode },
    });

    if (!existingProjection) {
      throw new Error(`Projection with code ${projectionCode} not found`);
    }

    // Transform user input to Prisma format
    const { metadata, ...serviceData } = data;

    const newService = await prisma.service.create({
      data: {
        ...serviceData,
        metadata: metadata
          ? {
              create: metadata,
            }
          : undefined,
        projection: {
          connect: { id: existingProjection.id },
        },
      },
      include: {
        metadata: true,
        projection: true,
      },
    });

    return newService;
  }

  async updateService(
    id: string,
    data: Prisma.ServiceUpdateInput & {
      projection?: { code: string };
      metadata?: Record<string, unknown>;
    }
  ) {
    // Transform user input to Prisma format
    const { projection, metadata, ...serviceData } = data;

    // Build the update data object conditionally
    const updateData: Record<string, unknown> = { ...serviceData };

    // Handle projection update
    if (projection?.code) {
      const existingProjection = await prisma.projection.findUnique({
        where: { code: projection.code },
      });

      if (!existingProjection) {
        throw new Error(`Projection with code ${projection.code} not found`);
      }

      updateData.projection = {
        connect: { id: existingProjection.id },
      };
    }

    // Handle metadata update
    if (metadata) {
      updateData.metadata = {
        upsert: {
          update: metadata,
          create: metadata,
        },
      };
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        metadata: true,
        projection: true,
      },
    });
    return updatedService;
  }

  async deleteService(id: string) {
    await prisma.$transaction(async (transaction) => {
      const service = await transaction.service.findUnique({
        where: { id },
        select: { metadata: true },
      });

      if (service?.metadata) {
        await transaction.metadata.delete({
          where: { id: service.metadata.id },
        });
      }

      await transaction.service.delete({ where: { id } });
    });
  }
}

export default new ServicesService();
