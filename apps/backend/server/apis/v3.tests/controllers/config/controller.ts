import type { Request, Response } from "express";

import handleStandardResponse from "../../utils/handleStandardResponse.ts";

export class Controller {
  byMap(req: Request, res: Response) {
    handleStandardResponse(
      res,
      {
        message: `This endpoint would result in displaying the configuration for map: ${req.params.map}. However, the V3 API is under construction - stay tuned!`,
      },
      501
    );
  }
}
export default new Controller();
