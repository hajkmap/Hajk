import log4js from "log4js";

import prisma from "../../../common/prisma.ts";
import { HajkError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../common/hajk-status-codes.ts";
import type {
  ThemeCreateInput,
  ThemeUpdateInput,
} from "../schemas/theme.schemas.ts";

const logger = log4js.getLogger("service.v3.theme");

class ThemeService {
  constructor() {
    logger.debug("Initiating Theme Service");
  }

  async #requireMap(mapName: string) {
    const map = await prisma.map.findUnique({ where: { name: mapName } });
    if (!map) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `"${mapName}" is not a valid map`,
        HajkStatusCodes.UNKNOWN_MAP_NAME
      );
    }
    return map;
  }

  async #requireTheme(mapName: string, id: number) {
    const theme = await prisma.theme.findFirst({
      where: { id, mapName, deletedAt: null },
    });
    if (!theme) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No theme with id ${id} in map '${mapName}'.`,
        HajkStatusCodes.UNKNOWN_THEME
      );
    }
    return theme;
  }

  async getThemes(mapName: string) {
    await this.#requireMap(mapName);
    return prisma.theme.findMany({
      where: { mapName, deletedAt: null },
      orderBy: { title: "asc" },
    });
  }

  async getTheme(mapName: string, id: number) {
    return this.#requireTheme(mapName, id);
  }

  async createTheme(mapName: string, data: ThemeCreateInput, userId?: string) {
    await this.#requireMap(mapName);
    return prisma.theme.create({
      data: {
        mapName,
        title: data.title.trim(),
        owner: data.owner?.trim() || null,
        description: data.description?.trim() || null,
        keywords: data.keywords ?? [],
        data: data.data,
        createdBy: userId,
        createdDate: new Date(),
        lastSavedBy: userId,
        lastSavedDate: new Date(),
      },
    });
  }

  async updateTheme(
    mapName: string,
    id: number,
    data: ThemeUpdateInput,
    userId?: string
  ) {
    await this.#requireTheme(mapName, id);
    return prisma.theme.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title.trim() } : {}),
        ...(data.owner !== undefined
          ? { owner: data.owner.trim() || null }
          : {}),
        ...(data.description !== undefined
          ? { description: data.description.trim() || null }
          : {}),
        ...(data.keywords !== undefined ? { keywords: data.keywords } : {}),
        ...(data.data !== undefined ? { data: data.data } : {}),
        lastSavedBy: userId,
        lastSavedDate: new Date(),
      },
    });
  }

  async deleteTheme(mapName: string, id: number) {
    await this.#requireTheme(mapName, id);

    const deletedAt = new Date();

    await prisma.theme.updateMany({
      where: { id, mapName, deletedAt: null },
      data: { deletedAt, lastSavedDate: deletedAt },
    });
  }
}

export default new ThemeService();
