import { Prisma } from "@prisma/client";
import log4js from "log4js";
import prisma from "../../../common/prisma.ts";
import { HajkError } from "../../../common/classes.ts";
import HttpStatusCodes from "../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../common/hajk-status-codes.ts";
import { slugify, uniqueSlug } from "../utils/slugify.ts";

interface Chapter {
  headerIdentifier?: string;
  chapters?: Chapter[];
  [key: string]: unknown;
}

const SLUG_MAX_RETRIES = 5;

const logger = log4js.getLogger("service.v3.document");

class DocumentService {
  constructor() {
    logger.debug("Initiating Document Service");
  }

  // ─── Folders ─────────────────────────────────────────────────────────────

  async getFolders(mapName: string) {
    return await prisma.documentFolder.findMany({
      where: { mapName },
      orderBy: { title: "asc" },
      include: { _count: { select: { documents: true } } },
    });
  }

  async createFolder(mapName: string, title: string, userId?: string) {
    const base = slugify(title);
    for (let attempt = 1; attempt <= SLUG_MAX_RETRIES; attempt++) {
      const existing = await prisma.documentFolder.findMany({
        where: { mapName },
        select: { name: true },
      });
      const existingNames = new Set(existing.map((f) => f.name));
      const name = uniqueSlug(base, existingNames);

      try {
        return await prisma.documentFolder.create({
          data: {
            name,
            title,
            mapName,
            createdBy: userId,
            createdDate: new Date(),
            lastSavedBy: userId,
            lastSavedDate: new Date(),
          },
        });
      } catch (err) {
        const isUniqueViolation =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002";
        if (!isUniqueViolation || attempt === SLUG_MAX_RETRIES) throw err;
      }
    }
    // Unreachable — the loop always returns or throws.
    throw new HajkError(
      HttpStatusCodes.CONFLICT,
      `Could not generate a unique slug for folder '${title}' in map '${mapName}'.`,
      HajkStatusCodes.DOCUMENT_ALREADY_EXISTS
    );
  }

  async renameFolder(
    mapName: string,
    folderName: string,
    title: string,
    userId?: string
  ) {
    const folder = await this.#requireFolder(mapName, folderName);

    return await prisma.documentFolder.update({
      where: { id: folder.id },
      data: {
        title,
        lastSavedBy: userId,
        lastSavedDate: new Date(),
      },
    });
  }

  async deleteFolder(mapName: string, folderName: string) {
    const folder = await prisma.documentFolder.findFirst({
      where: { mapName, name: folderName },
      include: { _count: { select: { documents: true } } },
    });
    if (!folder) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No folder '${folderName}' in map '${mapName}'.`,
        HajkStatusCodes.UNKNOWN_FOLDER
      );
    }
    if (folder._count.documents > 0) {
      throw new HajkError(
        HttpStatusCodes.CONFLICT,
        `Folder '${folderName}' still contains ${folder._count.documents} document(s). Delete them first.`,
        HajkStatusCodes.FOLDER_NOT_EMPTY
      );
    }

    await prisma.documentFolder.delete({ where: { id: folder.id } });
  }

  // ─── Documents ────────────────────────────────────────────────────────────

  async getDocuments(mapName: string, folderName: string) {
    const folder = await this.#requireFolder(mapName, folderName);
    return await prisma.document.findMany({
      where: { mapName, folderId: folder.id },
      select: {
        id: true,
        name: true,
        title: true,
        createdDate: true,
        lastSavedDate: true,
      },
      orderBy: { title: "asc" },
    });
  }

  async getDocument(mapName: string, folderName: string, docName: string) {
    const folder = await this.#requireFolder(mapName, folderName);
    const doc = await prisma.document.findFirst({
      where: { mapName, folderId: folder.id, name: docName },
    });
    if (!doc) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No document '${docName}' in folder '${folderName}' of map '${mapName}'.`,
        HajkStatusCodes.UNKNOWN_DOCUMENT
      );
    }
    return doc;
  }

  async createDocument(
    mapName: string,
    folderName: string,
    title: string,
    userId?: string
  ) {
    const folder = await this.#requireFolder(mapName, folderName);
    const base = slugify(title);

    for (let attempt = 1; attempt <= SLUG_MAX_RETRIES; attempt++) {
      const existing = await prisma.document.findMany({
        where: { mapName, folderId: folder.id },
        select: { name: true },
      });
      const existingNames = new Set(existing.map((d) => d.name));
      const name = uniqueSlug(base, existingNames);

      try {
        return await prisma.document.create({
          data: {
            name,
            title,
            content: { chapters: [] },
            mapName,
            folderId: folder.id,
            createdBy: userId,
            createdDate: new Date(),
            lastSavedBy: userId,
            lastSavedDate: new Date(),
          },
        });
      } catch (err) {
        const isUniqueViolation =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === "P2002";
        if (!isUniqueViolation || attempt === SLUG_MAX_RETRIES) throw err;
      }
    }
    throw new HajkError(
      HttpStatusCodes.CONFLICT,
      `Could not generate a unique slug for document '${title}' in folder '${folderName}'.`,
      HajkStatusCodes.DOCUMENT_ALREADY_EXISTS
    );
  }

  async saveDocument(
    mapName: string,
    folderName: string,
    docName: string,
    data: { title?: string; content: Record<string, unknown> },
    userId?: string
  ) {
    const folder = await this.#requireFolder(mapName, folderName);
    const doc = await prisma.document.findFirst({
      where: { mapName, folderId: folder.id, name: docName },
    });
    if (!doc) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No document '${docName}' in folder '${folderName}' of map '${mapName}'.`,
        HajkStatusCodes.UNKNOWN_DOCUMENT
      );
    }

    return await prisma.document.update({
      where: { id: doc.id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        content: data.content,
        lastSavedBy: userId,
        lastSavedDate: new Date(),
      },
    });
  }

  async moveDocument(
    mapName: string,
    folderName: string,
    docName: string,
    targetFolderName: string,
    userId?: string
  ) {
    const folder = await this.#requireFolder(mapName, folderName);
    const targetFolder = await this.#requireFolder(mapName, targetFolderName);

    const doc = await prisma.document.findFirst({
      where: { mapName, folderId: folder.id, name: docName },
    });
    if (!doc) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No document '${docName}' in folder '${folderName}' of map '${mapName}'.`,
        HajkStatusCodes.UNKNOWN_DOCUMENT
      );
    }

    const conflict = await prisma.document.findFirst({
      where: { mapName, folderId: targetFolder.id, name: docName },
      select: { id: true },
    });
    if (conflict) {
      throw new HajkError(
        HttpStatusCodes.CONFLICT,
        `A document named '${docName}' already exists in folder '${targetFolderName}'.`,
        HajkStatusCodes.DOCUMENT_ALREADY_EXISTS
      );
    }

    try {
      return await prisma.document.update({
        where: { id: doc.id },
        data: {
          folderId: targetFolder.id,
          lastSavedBy: userId,
          lastSavedDate: new Date(),
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new HajkError(
          HttpStatusCodes.CONFLICT,
          `A document named '${docName}' already exists in folder '${targetFolderName}'.`,
          HajkStatusCodes.DOCUMENT_ALREADY_EXISTS
        );
      }
      throw err;
    }
  }

  async deleteDocument(mapName: string, folderName: string, docName: string) {
    const folder = await this.#requireFolder(mapName, folderName);
    const doc = await prisma.document.findFirst({
      where: { mapName, folderId: folder.id, name: docName },
    });
    if (!doc) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No document '${docName}' in folder '${folderName}' of map '${mapName}'.`,
        HajkStatusCodes.UNKNOWN_DOCUMENT
      );
    }

    await prisma.document.delete({ where: { id: doc.id } });
  }

  async getDocumentById(id: number) {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: { folder: { select: { name: true } } },
    });
    if (!doc) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No document with id '${id}'.`,
        HajkStatusCodes.UNKNOWN_DOCUMENT
      );
    }
    const { folder, ...rest } = doc;
    return { ...rest, folderName: folder.name };
  }

  async loadDocumentForClient(mapName: string, folderName: string | null, docName: string) {
    let folder;
    if (folderName) {
      folder = await this.#requireFolder(mapName, folderName);
    } else {
      // Root-level document — no folder required
      folder = null;
    }

    const doc = await prisma.document.findFirst({
      where: folder
        ? { mapName, folderId: folder.id, name: docName }
        : { mapName, folderId: null, name: docName },
    });

    if (!doc) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No document '${docName}' in map '${mapName}'.`,
        HajkStatusCodes.UNKNOWN_DOCUMENT
      );
    }

    const chapters = this.#ensureHeaderIdentifiers(doc.content?.chapters || []);

    return {
      title: doc.title,
      chapters,
    };
  }

  #ensureHeaderIdentifiers(chapters: Chapter[]): Chapter[] {
    const counter = { current: 0 };
    const processChapter = (chapter: Chapter): Chapter => {
      const processed: Chapter = { ...chapter };
      if (!processed.headerIdentifier) {
        processed.headerIdentifier = `header-${++counter.current}`;
      }
      if (Array.isArray(processed.chapters)) {
        processed.chapters = processed.chapters.map((child) => processChapter(child));
      }
      return processed;
    };
    return chapters.map((ch) => processChapter(ch));
  }

  // ─── Private ──────────────────────────────────────────────────────────────

  async #requireFolder(mapName: string, folderName: string) {
    const folder = await prisma.documentFolder.findFirst({
      where: { mapName, name: folderName },
    });
    if (!folder) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No folder '${folderName}' in map '${mapName}'.`,
        HajkStatusCodes.UNKNOWN_FOLDER
      );
    }
    return folder;
  }
}

export default new DocumentService();
