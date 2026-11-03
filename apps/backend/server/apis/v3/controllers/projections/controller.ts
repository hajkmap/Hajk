import type { Request, Response } from "express";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import HajkStatusCodes from "../../../../common/hajk-status-codes.ts";
import { HajkError } from "../../../../common/classes.ts";
import ProjectionService from "../../services/projection.service.ts";
import {
  ProjectionCreateSchema,
  ProjectionUpdateSchema,
} from "../../schemas/projection.schemas.ts";

function parseId(raw: string | undefined): number {
  const id = Number.parseInt(raw ?? "", 10);
  if (Number.isNaN(id)) {
    throw new HajkError(
      HttpStatusCodes.BAD_REQUEST,
      "Projection id must be a number",
      HajkStatusCodes.INVALID_REQUEST_BODY
    );
  }
  return id;
}

class ProjectionsController {
  async getProjections(_req: Request, res: Response) {
    const projections = await ProjectionService.getProjectionsWithUsage();
    res
      .status(HttpStatusCodes.OK)
      .json({ count: projections.length, projections });
  }

  async createProjection(req: Request, res: Response) {
    const projections = await ProjectionService.createProjection(
      // Already validated by the router; parsing applies trims and defaults.
      ProjectionCreateSchema.parse(req.body)
    );
    res.status(HttpStatusCodes.CREATED).json({ projections });
  }

  async updateProjection(req: Request, res: Response) {
    const projections = await ProjectionService.updateProjection(
      parseId(String(req.params.id)),
      ProjectionUpdateSchema.parse(req.body)
    );
    res.status(HttpStatusCodes.OK).json({ projections });
  }

  async deleteProjection(req: Request, res: Response) {
    const result = await ProjectionService.deleteProjection(
      parseId(String(req.params.id))
    );
    res.status(HttpStatusCodes.OK).json(result);
  }
}

export default new ProjectionsController();
