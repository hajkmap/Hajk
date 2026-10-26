import type { Request, Response } from "express";

import PresenceService from "../../services/presence.service.ts";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import { asyncHandler } from "../../utils/async-handler.ts";

class PresenceController {
  // The tab's page and the parts it has unsaved changes in, sent when that
  // changes and as a heartbeat. The name comes from the login, if there is one.
  report = asyncHandler(async (req: Request, res: Response) => {
    PresenceService.report(
      PresenceService.parseReport(req.body),
      req.user?.fullName ?? null
    );
    res.status(HttpStatusCodes.NO_CONTENT).end();
  });

  // Also sent as a beacon when the tab closes, so it is all in the query.
  leave = asyncHandler(async (req: Request, res: Response) => {
    PresenceService.leave(PresenceService.parseTab(req.query));
    res.status(HttpStatusCodes.NO_CONTENT).end();
  });

  getPresence = asyncHandler(async (req: Request, res: Response) => {
    const presence = await PresenceService.getPresence(
      PresenceService.parseTab(req.query)
    );
    res.status(HttpStatusCodes.OK).json(presence);
  });
}

export default new PresenceController();
