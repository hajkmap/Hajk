import type { Request, Response } from "express";

import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import { isAdLookupActive } from "../../utils/group-visibility.ts";

class ActiveDirectoryController {
  // Whether the backend looks users up in AD, so that the AD groups admin
  // gives maps, groups, layers and tools (visibleForGroups) apply.
  getStatus(_req: Request, res: Response) {
    res.status(HttpStatusCodes.OK).json({ lookupActive: isAdLookupActive() });
  }
}

export default new ActiveDirectoryController();
