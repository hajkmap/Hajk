import type { Request, Response } from "express";

import GroupsService from "../../services/groups.service.ts";
import LayerTreeService from "../../services/layer-tree.service.ts";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import { HajkError } from "../../../../common/classes.ts";
import HajkStatusCodes from "../../../../common/hajk-status-codes.ts";
import { asyncHandler } from "../../utils/async-handler.ts";
import { userNameOf } from "../../utils/user-name.ts";

class GroupsController {
  getGroups = asyncHandler(async (_: Request, res: Response) => {
    const groups = await GroupsService.getGroups();
    res.status(HttpStatusCodes.OK).json({ count: groups.length, groups });
  });

  getGroupById = asyncHandler(async (req: Request, res: Response) => {
    const group = await GroupsService.getGroupById(req.params.id);
    if (group === null) {
      throw new HajkError(
        HttpStatusCodes.NOT_FOUND,
        `No group with id: ${req.params.id} could be found.`,
        HajkStatusCodes.UNKNOWN_GROUP_ID
      );
    }

    res.status(HttpStatusCodes.OK).json(group);
  });

  getMapsByGroupId = asyncHandler(async (req: Request, res: Response) => {
    const maps = await GroupsService.getMapsByGroupId(req.params.id);
    res.status(HttpStatusCodes.OK).json({ count: maps.length, maps });
  });

  // Which groups and maps each group and layer is placed in.
  getPlacements = asyncHandler(async (_req: Request, res: Response) => {
    const placements = await LayerTreeService.getPlacements();
    res.status(HttpStatusCodes.OK).json(placements);
  });

  // The group's own content, with linked groups expanded.
  getGroupTree = asyncHandler(async (req: Request, res: Response) => {
    const tree = await LayerTreeService.getGroupTree(req.params.id);
    res.status(HttpStatusCodes.OK).json(tree);
  });

  updateGroupTree = asyncHandler(async (req: Request, res: Response) => {
    const tree = await LayerTreeService.updateGroupTree(
      req.params.id,
      req.body,
      req.user?.id,
      await userNameOf(req, res)
    );
    res.status(HttpStatusCodes.OK).json(tree);
  });

  createGroup = asyncHandler(async (req: Request, res: Response) => {
    const group = await GroupsService.createGroup(req.body, req.user?.id);
    res.status(HttpStatusCodes.CREATED).json(group);
  });

  updateGroup = asyncHandler(async (req: Request, res: Response) => {
    const group = await GroupsService.updateGroup(
      req.params.id,
      req.body,
      req.user?.id
    );
    res.status(HttpStatusCodes.OK).json(group);
  });

  deleteGroup = asyncHandler(async (req: Request, res: Response) => {
    await GroupsService.deleteGroup(req.params.id);
    res.status(HttpStatusCodes.NO_CONTENT).send();
  });

  getDeletedGroups = asyncHandler(async (_: Request, res: Response) => {
    const groups = await GroupsService.getDeletedGroups();
    res.status(HttpStatusCodes.OK).json({ count: groups.length, groups });
  });

  restoreGroup = asyncHandler(async (req: Request, res: Response) => {
    const group = await GroupsService.restoreGroup(req.params.id, req.user?.id);
    res.status(HttpStatusCodes.OK).json(group);
  });
}

export default new GroupsController();
