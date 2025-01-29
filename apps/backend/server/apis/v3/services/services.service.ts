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
        metadata: true,
        projection: true,
        // select all columns in the service table
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
    // Get service by id and include the foreign keys to get the metadata row and the projection
    const service = await prisma.service.findUnique({
      where: { id },
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

  async createService(data: Prisma.ServiceCreateInput) {
    const projectionCode = data?.projection?.code || DEFAULT_PROJECTION_CODE;
    const existingProjection = await prisma.projection.findUnique({
      where: { code: projectionCode },
    });

    if (!existingProjection) {
      throw new Error(`Projection with code ${projectionCode} not found`);
    }

    const newService = await prisma.service.create({
      data: {
        ...data,
        metadata: {
          create: { ...data.metadata },
        },
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

  async updateService(id: string, data: Prisma.ServiceUpdateInput) {
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        ...data,
        metadata: {
          upsert: {
            update: { ...data.metadata },
            create: { ...data.metadata },
          },
        },
      },
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
