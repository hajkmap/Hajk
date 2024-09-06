import type { Request, Response } from "express";

import handleStandardResponse from "../../utils/handleStandardResponse.ts";

export class Controller {
  test(req: Request, res: Response) {
    handleStandardResponse(res, {
      message: `Hello ${req.params.variable || "World"}! API V3 is under construction - stay tuned`,
    });
  }
}
export default new Controller();
