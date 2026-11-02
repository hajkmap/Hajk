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

interface MenuDocument {
  /** The folder name the menu item names, "" when it names none. */
  folder: string;
  name: string;
}

/**
 * The documents a documenthandler's `menuConfig.menu` references, nested `menu`
 * arrays included, deduplicated by folder+name with the first occurrence kept
 * (the same as v2's /informative/loadall).
 */
function uniqueMenuDocuments(menu: unknown): MenuDocument[] {
  const result: MenuDocument[] = [];
  const seen = new Set<string>();
  const visit = (items: unknown) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      const {
        document,
        folder,
        menu: children,
      } = item as Record<string, unknown>;
      visit(children);
      if (typeof document !== "string" || document === "") continue;
      const folderName = typeof folder === "string" ? folder : "";
      const key = `${folderName}/${document}`;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ folder: folderName, name: document });
    }
  };
  visit(menu);
  return result;
}

const logger = log4js.getLogger("service.v3.document");

class DocumentService {
  constructor() {
    logger.debug("Initiating Document Service");
  }

  // ─── Folders ─────────────────────────────────────────────────────────────

  async getFolders(toolInstanceId: number) {
    return await prisma.documentFolder.findMany({
      where: { toolInstanceId },
      orderBy: { title: "asc" },
      include: { _count: { select: { documents: true } } },
    });
  }

  async createFolder(toolInstanceId: number, title: string, userId?: string) {
    const base = slugify(title);
    for (let attempt = 1; attempt <= SLUG_MAX_RETRIES; attempt++) {
      const existing = await prisma.documentFolder.findMany({
        where: { toolInstanceId },
        select: { name: true },
      });
      const existingNames = new Set(existing.map((f) => f.name));
      const name = uniqueSlug(base, existingNames);

      try {
        return await prisma.documentFolder.create({
          data: {
            name,
            title,
            toolInstanceId,
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
      `Could not generate a unique slug for folder '${title}' in tool '${toolInstanceId}'.`,
      HajkStatusCodes.DOCUMENT_ALREADY_EXISTS
    );
  }

  async renameFolder(
    toolInstanceId: number,
    folderName: string,
    title: string,
    userId?: string
  ) {
    const folder = await this.#requireFolder(toolInstanceId, folderName);

    return await prisma.documentFolder.update({
      where: { id: folder.id },
      data: {
        title,
        lastSavedBy: userId,
        lastSavedDate: new Date(),
      },
    });
  }

  async deleteFolder(toolInstanceId: number, folderName: string) {
    const folder = await prisma.documentFolder.findFirst({
      where: { toolInstanceId, name: folderName },
      include: { _count: { select: { documents: true } } },
    });
    if (!folder) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No folder '${folderName}' in tool '${toolInstanceId}'.`,
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

  async getDocuments(toolInstanceId: number, folderName: string) {
    const folder = await this.#requireFolder(toolInstanceId, folderName);
    return await prisma.document.findMany({
      where: { toolInstanceId, folderId: folder.id },
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

  async getDocument(toolInstanceId: number, folderName: string, docName: string) {
    const folder = await this.#requireFolder(toolInstanceId, folderName);
    const doc = await prisma.document.findFirst({
      where: { toolInstanceId, folderId: folder.id, name: docName },
    });
    if (!doc) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No document '${docName}' in folder '${folderName}' of tool '${toolInstanceId}'.`,
        HajkStatusCodes.UNKNOWN_DOCUMENT
      );
    }
    return doc;
  }

  async createDocument(
    toolInstanceId: number,
    folderName: string,
    title: string,
    userId?: string
  ) {
    const folder = await this.#requireFolder(toolInstanceId, folderName);
    const base = slugify(title);

    for (let attempt = 1; attempt <= SLUG_MAX_RETRIES; attempt++) {
      const existing = await prisma.document.findMany({
        where: { toolInstanceId, folderId: folder.id },
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
            toolInstanceId,
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
    toolInstanceId: number,
    folderName: string,
    docName: string,
    data: { title?: string; content: Record<string, unknown> },
    userId?: string
  ) {
    const folder = await this.#requireFolder(toolInstanceId, folderName);
    const doc = await prisma.document.findFirst({
      where: { toolInstanceId, folderId: folder.id, name: docName },
    });
    if (!doc) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No document '${docName}' in folder '${folderName}' of tool '${toolInstanceId}'.`,
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
    toolInstanceId: number,
    folderName: string,
    docName: string,
    targetFolderName: string,
    userId?: string
  ) {
    const folder = await this.#requireFolder(toolInstanceId, folderName);
    const targetFolder = await this.#requireFolder(toolInstanceId, targetFolderName);

    const doc = await prisma.document.findFirst({
      where: { toolInstanceId, folderId: folder.id, name: docName },
    });
    if (!doc) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No document '${docName}' in folder '${folderName}' of tool '${toolInstanceId}'.`,
        HajkStatusCodes.UNKNOWN_DOCUMENT
      );
    }

    const conflict = await prisma.document.findFirst({
      where: { toolInstanceId, folderId: targetFolder.id, name: docName },
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

  async deleteDocument(toolInstanceId: number, folderName: string, docName: string) {
    const folder = await this.#requireFolder(toolInstanceId, folderName);
    const doc = await prisma.document.findFirst({
      where: { toolInstanceId, folderId: folder.id, name: docName },
    });
    if (!doc) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No document '${docName}' in folder '${folderName}' of tool '${toolInstanceId}'.`,
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

  async loadDocumentForClient(toolInstanceId: number, folderName: string | null, docName: string) {
    let folder;
    if (folderName) {
      folder = await this.#requireFolder(toolInstanceId, folderName);
    } else {
      // Root-level load — no folder required. All documents now live in a folder,
      // so search by name across all folders for this tool; pick the lowest folderId
      // for a stable result when the same name appears in multiple folders.
      folder = null;
    }

    const doc = await prisma.document.findFirst({
      where: folder
        ? { toolInstanceId, folderId: folder.id, name: docName }
        : { toolInstanceId, name: docName },
      ...(folder === null && { orderBy: { folderId: "asc" } }),
    });

    if (!doc) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No document '${docName}' in tool '${toolInstanceId}'.`,
        HajkStatusCodes.UNKNOWN_DOCUMENT
      );
    }

    return this.#toClientDocument(doc);
  }

  /**
   * All documents a documenthandler menu references, in one query, for the
   * consolidated document loading (`consolidateDocumentLoading`). Same shape as
   * v2's /informative/loadall: one { folder, name, document } entry per unique
   * folder+name, in menu order. A document that can't be loaded gets
   * `document: null` and an `error: { code, message }`; it never fails the rest.
   */
  async loadAllDocumentsForClient(toolInstanceId: number, menu: unknown) {
    const items = uniqueMenuDocuments(menu);
    const names = [...new Set(items.map((item) => item.name))];

    const docs =
      names.length > 0
        ? await prisma.document.findMany({
            where: { toolInstanceId, name: { in: names } },
            include: { folder: { select: { name: true } } },
            orderBy: { folderId: "asc" },
          })
        : [];

    const documents = items.map(({ folder, name }) => {
      const label = `${folder && `${folder}/`}${name}`;
      try {
        // With a folder: that folder's document. Without one: the first by name,
        // lowest folderId, the same rule as loadDocumentForClient's root load.
        const doc = docs.find(
          (d) => d.name === name && (!folder || d.folder.name === folder)
        );
        if (!doc) {
          return {
            folder,
            name,
            document: null,
            error: {
              code: "DOCUMENT_NOT_FOUND",
              message: `Document "${label}" was not found.`,
            },
          };
        }
        return { folder, name, document: this.#toClientDocument(doc) };
      } catch (error) {
        logger.warn(
          `Consolidated load for tool '${toolInstanceId}': could not load document "${label}".`,
          error
        );
        return {
          folder,
          name,
          document: null,
          error: {
            code: "DOCUMENT_LOAD_ERROR",
            message:
              (error instanceof Error && error.message) ||
              `Could not load document "${label}".`,
          },
        };
      }
    });

    return { documents };
  }

  #toClientDocument(doc: { title: string; content: Prisma.JsonValue }) {
    const content =
      doc.content &&
      typeof doc.content === "object" &&
      !Array.isArray(doc.content)
        ? doc.content
        : {};
    const chapters = Array.isArray(content.chapters)
      ? (content.chapters as unknown as Chapter[])
      : [];

    return {
      title: doc.title,
      chapters: this.#ensureHeaderIdentifiers(chapters),
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

  async #requireFolder(toolInstanceId: number, folderName: string) {
    const folder = await prisma.documentFolder.findFirst({
      where: { toolInstanceId, name: folderName },
    });
    if (!folder) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No folder '${folderName}' in tool '${toolInstanceId}'.`,
        HajkStatusCodes.UNKNOWN_FOLDER
      );
    }
    return folder;
  }
}

export default new DocumentService();
