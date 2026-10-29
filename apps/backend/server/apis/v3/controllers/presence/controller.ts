import type { Request, Response } from "express";

import PresenceService from "../../services/presence.service.ts";
import LayerTreeService from "../../services/layer-tree.service.ts";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import { asyncHandler } from "../../utils/async-handler.ts";
import { userNameOf } from "../../utils/user-name.ts";

class PresenceController {
  // Whether the tab is editing the page's tree, sent when that changes and as
  // a heartbeat.
  report = asyncHandler(async (req: Request, res: Response) => {
    PresenceService.report(
      PresenceService.parseReport(req.body),
      await userNameOf(req, res)
    );
    res.status(HttpStatusCodes.NO_CONTENT).end();
  });

  // Also sent as a beacon when the tab closes, so it is all in the query.
  leave = asyncHandler(async (req: Request, res: Response) => {
    PresenceService.leave(PresenceService.parseTab(req.query));
    res.status(HttpStatusCodes.NO_CONTENT).end();
  });

  // Who else is editing the tree, and when it was last saved.
  getPresence = asyncHandler(async (req: Request, res: Response) => {
    const tab = PresenceService.parseTab(req.query);
    res.status(HttpStatusCodes.OK).json({
      ...PresenceService.getEditors(tab),
      saved: await LayerTreeService.getTreeSaved(tab.type, tab.id),
    });
  });
}

export default new PresenceController();
