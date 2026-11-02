import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../../common/hajk-status-codes.ts";
import { HajkError } from "../../../../common/classes.ts";
import PublicService from "../../services/public.service.ts";
import DocumentService from "../../services/document.service.ts";
import { resolveClientDocumentHandler } from "../../utils/build-client-map-config.ts";

import type { Request, Response } from "express";

/** The AD user the request runs as, if any (set by the auth middleware). */
function adUserOf(res: Response): string | undefined {
  return typeof res.locals.authUser === "string"
    ? res.locals.authUser
    : undefined;
}

class PublicController {
  async getClientConfigForMap(req: Request, res: Response) {
    const mapConfig = await PublicService.getClientConfigForMap(
      req.params.mapName,
      req.user,
      adUserOf(res)
    );

    res.status(HttpStatusCodes.OK).json(mapConfig);
  }

  // ─── DocumentHandler (client-facing) ───────────────────────────────────────

  /** Every document the map's documenthandler menu references, in one response. */
  async loadAllDocumentsForMap(
    req: Request<{ mapName: string }>,
    res: Response
  ) {
    const { mapName } = req.params;
    const { toolInstanceId, options } = await resolveClientDocumentHandler(
      mapName,
      adUserOf(res)
    );

    if (options.consolidateDocumentLoading !== true) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `Consolidated document loading is not enabled for map "${mapName}".`,
        HajkStatusCodes.CONSOLIDATED_DOCUMENT_LOADING_DISABLED
      );
    }

    const menuConfig = options.menuConfig;
    const menu =
      menuConfig && typeof menuConfig === "object" && !Array.isArray(menuConfig)
        ? menuConfig.menu
        : undefined;

    const result = await DocumentService.loadAllDocumentsForClient(
      toolInstanceId,
      menu
    );
    res.status(HttpStatusCodes.OK).json(result);
  }

  async loadDocumentInFolderForMap(
    req: Request<{ mapName: string; folder: string; name: string }>,
    res: Response
  ) {
    const { toolInstanceId } = await resolveClientDocumentHandler(
      req.params.mapName,
      adUserOf(res)
    );
    const document = await DocumentService.loadDocumentForClient(
      toolInstanceId,
      req.params.folder,
      req.params.name
    );
    res.status(HttpStatusCodes.OK).json(document);
  }

  async loadDocumentRootForMap(
    req: Request<{ mapName: string; name: string }>,
    res: Response
  ) {
    const { toolInstanceId } = await resolveClientDocumentHandler(
      req.params.mapName,
      adUserOf(res)
    );
    const document = await DocumentService.loadDocumentForClient(
      toolInstanceId,
      null,
      req.params.name
    );
    res.status(HttpStatusCodes.OK).json(document);
  }
}
export default new PublicController();
