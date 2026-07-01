import type { Request, Response } from "express";
import DocumentService from "../../services/document.service.ts";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";

class DocumentHandlerController {
  // ─── By id ─────────────────────────────────────────────────────────────────

  async getDocumentById(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ error: "Document id must be a number." });
      return;
    }
    const document = await DocumentService.getDocumentById(id);
    res.status(HttpStatusCodes.OK).json(document);
  }

  // ─── Folders ───────────────────────────────────────────────────────────────

  async getFolders(req: Request, res: Response) {
    const toolId = parseInt(req.params.toolId, 10);
    const folders = await DocumentService.getFolders(toolId);
    res.status(HttpStatusCodes.OK).json({ count: folders.length, folders });
  }

  async createFolder(req: Request, res: Response) {
    const toolId = parseInt(req.params.toolId, 10);
    const folder = await DocumentService.createFolder(
      toolId,
      req.body.title as string,
      req.user?.id
    );
    res.status(HttpStatusCodes.CREATED).json(folder);
  }

  async renameFolder(req: Request, res: Response) {
    const toolId = parseInt(req.params.toolId, 10);
    const folder = await DocumentService.renameFolder(
      toolId,
      req.params.folder,
      req.body.title as string,
      req.user?.id
    );
    res.status(HttpStatusCodes.OK).json(folder);
  }

  async deleteFolder(req: Request, res: Response) {
    const toolId = parseInt(req.params.toolId, 10);
    await DocumentService.deleteFolder(toolId, req.params.folder);
    res.status(HttpStatusCodes.NO_CONTENT).send();
  }

  // ─── Documents ─────────────────────────────────────────────────────────────

  async getDocuments(req: Request, res: Response) {
    const toolId = parseInt(req.params.toolId, 10);
    const documents = await DocumentService.getDocuments(
      toolId,
      req.params.folder
    );
    res.status(HttpStatusCodes.OK).json({ count: documents.length, documents });
  }

  async createDocument(req: Request, res: Response) {
    const toolId = parseInt(req.params.toolId, 10);
    const document = await DocumentService.createDocument(
      toolId,
      req.params.folder,
      req.body.title as string,
      req.user?.id
    );
    res.status(HttpStatusCodes.CREATED).json(document);
  }

  async getDocument(req: Request, res: Response) {
    const toolId = parseInt(req.params.toolId, 10);
    const document = await DocumentService.getDocument(
      toolId,
      req.params.folder,
      req.params.name
    );
    res.status(HttpStatusCodes.OK).json(document);
  }

  async saveDocument(req: Request, res: Response) {
    const toolId = parseInt(req.params.toolId, 10);
    const document = await DocumentService.saveDocument(
      toolId,
      req.params.folder,
      req.params.name,
      req.body as { title?: string; content: Record<string, unknown> },
      req.user?.id
    );
    res.status(HttpStatusCodes.OK).json(document);
  }

  async moveDocument(req: Request, res: Response) {
    const toolId = parseInt(req.params.toolId, 10);
    const document = await DocumentService.moveDocument(
      toolId,
      req.params.folder,
      req.params.name,
      req.body.targetFolder as string,
      req.user?.id
    );
    res.status(HttpStatusCodes.OK).json(document);
  }

  async deleteDocument(req: Request, res: Response) {
    const toolId = parseInt(req.params.toolId, 10);
    await DocumentService.deleteDocument(
      toolId,
      req.params.folder,
      req.params.name
    );
    res.status(HttpStatusCodes.NO_CONTENT).send();
  }

  // ─── Load (client-facing) ──────────────────────────────────────────────────

  async loadDocumentInFolder(req: Request, res: Response) {
    const toolId = parseInt(req.params.toolId, 10);
    const document = await DocumentService.loadDocumentForClient(
      toolId,
      req.params.folder,
      req.params.name
    );
    res.status(HttpStatusCodes.OK).json(document);
  }

  async loadDocumentRoot(req: Request, res: Response) {
    const toolId = parseInt(req.params.toolId, 10);
    const document = await DocumentService.loadDocumentForClient(
      toolId,
      null,
      req.params.name
    );
    res.status(HttpStatusCodes.OK).json(document);
  }
}

export default new DocumentHandlerController();
