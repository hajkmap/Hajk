import { PrismaClient } from "@prisma/client";

import log4js from "log4js";

const logger = log4js.getLogger("service.v3.layer");
const prisma = new PrismaClient();

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
}

export default new ServicesService();