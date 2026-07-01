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

  async getFolders(toolId: number) {
    return await prisma.documentFolder.findMany({
      where: { toolId },
      orderBy: { title: "asc" },
      include: { _count: { select: { documents: true } } },
    });
  }

  async createFolder(toolId: number, title: string, userId?: string) {
    const base = slugify(title);
    for (let attempt = 1; attempt <= SLUG_MAX_RETRIES; attempt++) {
      const existing = await prisma.documentFolder.findMany({
        where: { toolId },
        select: { name: true },
      });
      const existingNames = new Set(existing.map((f) => f.name));
      const name = uniqueSlug(base, existingNames);

      try {
        return await prisma.documentFolder.create({
          data: {
            name,
            title,
            toolId,
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
      `Could not generate a unique slug for folder '${title}' in tool '${toolId}'.`,
      HajkStatusCodes.DOCUMENT_ALREADY_EXISTS
    );
  }

  async renameFolder(
    toolId: number,
    folderName: string,
    title: string,
    userId?: string
  ) {
    const folder = await this.#requireFolder(toolId, folderName);

    return await prisma.documentFolder.update({
      where: { id: folder.id },
      data: {
        title,
        lastSavedBy: userId,
        lastSavedDate: new Date(),
      },
    });
  }

  async deleteFolder(toolId: number, folderName: string) {
    const folder = await prisma.documentFolder.findFirst({
      where: { toolId, name: folderName },
      include: { _count: { select: { documents: true } } },
    });
    if (!folder) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No folder '${folderName}' in tool '${toolId}'.`,
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

  async getDocuments(toolId: number, folderName: string) {
    const folder = await this.#requireFolder(toolId, folderName);
    return await prisma.document.findMany({
      where: { toolId, folderId: folder.id },
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

  async getDocument(toolId: number, folderName: string, docName: string) {
    const folder = await this.#requireFolder(toolId, folderName);
    const doc = await prisma.document.findFirst({
      where: { toolId, folderId: folder.id, name: docName },
    });
    if (!doc) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No document '${docName}' in folder '${folderName}' of tool '${toolId}'.`,
        HajkStatusCodes.UNKNOWN_DOCUMENT
      );
    }
    return doc;
  }

  async createDocument(
    toolId: number,
    folderName: string,
    title: string,
    userId?: string
  ) {
    const folder = await this.#requireFolder(toolId, folderName);
    const base = slugify(title);

    for (let attempt = 1; attempt <= SLUG_MAX_RETRIES; attempt++) {
      const existing = await prisma.document.findMany({
        where: { toolId, folderId: folder.id },
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
            toolId,
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
    toolId: number,
    folderName: string,
    docName: string,
    data: { title?: string; content: Record<string, unknown> },
    userId?: string
  ) {
    const folder = await this.#requireFolder(toolId, folderName);
    const doc = await prisma.document.findFirst({
      where: { toolId, folderId: folder.id, name: docName },
    });
    if (!doc) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No document '${docName}' in folder '${folderName}' of tool '${toolId}'.`,
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
    toolId: number,
    folderName: string,
    docName: string,
    targetFolderName: string,
    userId?: string
  ) {
    const folder = await this.#requireFolder(toolId, folderName);
    const targetFolder = await this.#requireFolder(toolId, targetFolderName);

    const doc = await prisma.document.findFirst({
      where: { toolId, folderId: folder.id, name: docName },
    });
    if (!doc) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No document '${docName}' in folder '${folderName}' of tool '${toolId}'.`,
        HajkStatusCodes.UNKNOWN_DOCUMENT
      );
    }

    const conflict = await prisma.document.findFirst({
      where: { toolId, folderId: targetFolder.id, name: docName },
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

  async deleteDocument(toolId: number, folderName: string, docName: string) {
    const folder = await this.#requireFolder(toolId, folderName);
    const doc = await prisma.document.findFirst({
      where: { toolId, folderId: folder.id, name: docName },
    });
    if (!doc) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No document '${docName}' in folder '${folderName}' of tool '${toolId}'.`,
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

  async loadDocumentForClient(toolId: number, folderName: string | null, docName: string) {
    let folder;
    if (folderName) {
      folder = await this.#requireFolder(toolId, folderName);
    } else {
      // Root-level load — no folder required. All documents now live in a folder,
      // so search by name across all folders for this tool; pick the lowest folderId
      // for a stable result when the same name appears in multiple folders.
      folder = null;
    }

    const doc = await prisma.document.findFirst({
      where: folder
        ? { toolId, folderId: folder.id, name: docName }
        : { toolId, name: docName },
      ...(folder === null && { orderBy: { folderId: "asc" } }),
    });

    if (!doc) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No document '${docName}' in tool '${toolId}'.`,
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

  async #requireFolder(toolId: number, folderName: string) {
    const folder = await prisma.documentFolder.findFirst({
      where: { toolId, name: folderName },
    });
    if (!folder) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No folder '${folderName}' in tool '${toolId}'.`,
        HajkStatusCodes.UNKNOWN_FOLDER
      );
    }
    return folder;
  }
}

export default new DocumentService();
