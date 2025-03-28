import type { Request, Response } from "express";

import GroupsService from "../../services/groups.service.ts";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import { HajkError } from "../../../../common/classes.ts";
import HajkStatusCodes from "../../../../common/hajk-status-codes.ts";

class GroupsController {
  async getGroups(_: Request, res: Response) {
    const groups = await GroupsService.getGroups();
    res.status(HttpStatusCodes.OK).json({ count: groups.length, groups });
  }

  async getGroupById(req: Request, res: Response) {
    const group = await GroupsService.getGroupById(req.params.id);
    if (group === null) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No group with id: ${req.params.id} could be found.`,
        HajkStatusCodes.UNKNOWN_GROUP_ID
      );
    }

    res.status(HttpStatusCodes.OK).json(group);
  }

  async getLayersByGroupId(req: Request, res: Response) {
    const layers = await GroupsService.getLayersByGroupId(req.params.id);
    res.status(HttpStatusCodes.OK).json({ count: layers.length, layers });
  }

  async getMapsByGroupId(req: Request, res: Response) {
    const maps = await GroupsService.getMapsByGroupId(req.params.id);
    res.status(HttpStatusCodes.OK).json({ count: maps.length, maps });
  }
  async createGroup(req: Request, res: Response) {
    const group = await GroupsService.createGroup(req.body);
    res.status(HttpStatusCodes.CREATED).json(group);
  }
  async updateGroup(req: Request, res: Response) {
    const group = await GroupsService.updateGroup(req.params.id, req.body);
    res.status(HttpStatusCodes.OK).json(group);
  }
  async deleteGroup(req: Request, res: Response) {
    await GroupsService.deleteGroup(req.params.id);
    res.status(HttpStatusCodes.NO_CONTENT).send();
  }
}
export default new GroupsController();
