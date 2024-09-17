import type { Request, Response } from "express";

import HttpStatusCodes from "../../../../common/HttpStatusCodes.ts";
import SearchService from "../../services/search.service.ts";

class SearchController {
  async autocomplete(req: Request, res: Response) {
    const autocomplete = await SearchService.autocomplete(req.body);
    return res.status(HttpStatusCodes.OK).json({ autocomplete });
  }
}

export default new SearchController();
