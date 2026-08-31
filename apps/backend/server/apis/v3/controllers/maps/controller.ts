import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import MapService from "../../services/map.service.ts";

import type { Request, Response } from "express";

class MapsController {
  async getMaps(_: Request, res: Response) {
    const maps = await MapService.getMaps();
    res.status(HttpStatusCodes.OK).json({ count: maps.length, maps });
  }

  async getMapByName(req: Request, res: Response) {
    const mapConfig = await MapService.getMapByName(
      req.params.mapName,
      req.user
    );

    res.status(HttpStatusCodes.OK).json(mapConfig);
  }

  async getGroupsForMap(req: Request, res: Response) {
    const groups = await MapService.getGroupsForMap(req.params.mapName);
    res.status(HttpStatusCodes.OK).json({ count: groups.length, groups });
  }

  async getLayersForMap(req: Request, res: Response) {
    const layers = await MapService.getLayersForMap(req.params.mapName);
    res.status(HttpStatusCodes.OK).json({ count: layers.length, layers });
  }

  async getMapContent(req: Request, res: Response) {
    const content = await MapService.getMapContent(req.params.mapName);
    res.status(HttpStatusCodes.OK).json({
      count: content.layers.length + content.groups.length,
      ...content,
    });
  }

  async getProjectionsForMap(req: Request, res: Response) {
    const projections = await MapService.getProjectionsForMap(
      req.params.mapName
    );
    res
      .status(HttpStatusCodes.OK)
      .json({ count: projections.length, projections });
  }

  async getToolsForMap(req: Request, res: Response) {
    const tools = await MapService.getToolsForMap(req.params.mapName);
    res.status(HttpStatusCodes.OK).json({ count: tools.length, tools });
  }

  async updateMapTools(req: Request, res: Response) {
    const { tools } = req.body as {
      tools: {
        toolId: number;
        index: number;
        target: string | null;
        active?: boolean;
        options?: Record<string, unknown>;
      }[];
    };
    await MapService.updateMapTools(req.params.mapName, tools ?? []);
    res.status(HttpStatusCodes.NO_CONTENT).send();
  }

  async updateMapLayers(req: Request, res: Response) {
    const { layers, replaceBackground, replaceForeground } = req.body as {
      layers: Parameters<typeof MapService.updateMapLayers>[1];
      replaceBackground?: boolean;
      replaceForeground?: boolean;
    };
    await MapService.updateMapLayers(req.params.mapName, layers ?? [], {
      replaceBackground,
      replaceForeground,
    });
    res.status(HttpStatusCodes.NO_CONTENT).send();
  }

  async getMapLayerSwitcher(req: Request, res: Response) {
    const state = await MapService.getMapLayerSwitcher(req.params.mapName);
    res.status(HttpStatusCodes.OK).json(state);
  }

  async updateMapLayerSwitcher(req: Request, res: Response) {
    const { groups, baselayers } = req.body as {
      groups: Parameters<typeof MapService.updateMapLayerSwitcher>[1]["groups"];
      baselayers: Parameters<
        typeof MapService.updateMapLayerSwitcher
      >[1]["baselayers"];
    };
    await MapService.updateMapLayerSwitcher(
      req.params.mapName,
      {
        groups: groups ?? [],
        baselayers: baselayers ?? [],
      },
      req.user?.id,
    );
    res.status(HttpStatusCodes.NO_CONTENT).send();
  }

  async updateMapGroups(req: Request, res: Response) {
    const { groups } = req.body as {
      groups: Parameters<typeof MapService.updateMapGroups>[1];
    };
    await MapService.updateMapGroups(req.params.mapName, groups ?? []);
    res.status(HttpStatusCodes.NO_CONTENT).send();
  }

  async updateMapContent(req: Request, res: Response) {
    const { layers, groups } = req.body as {
      layers: Parameters<typeof MapService.updateMapContent>[1]["layers"];
      groups: Parameters<typeof MapService.updateMapContent>[1]["groups"];
    };
    await MapService.updateMapContent(req.params.mapName, {
      layers: layers ?? [],
      groups: groups ?? [],
    });
    res.status(HttpStatusCodes.NO_CONTENT).send();
  }

  async createMap(req: Request, res: Response) {
    const map = await MapService.createMap(req.body, req.user?.id);
    res.status(HttpStatusCodes.CREATED).json(map);
  }

  async updateMap(req: Request, res: Response) {
    const map = await MapService.updateMap(
      req.params.mapName,
      req.body,
      req.user?.id
    );
    res.status(HttpStatusCodes.OK).json(map);
  }

  async deleteMap(req: Request, res: Response) {
    await MapService.deleteMap(req.params.mapName);
    res.status(HttpStatusCodes.NO_CONTENT).send();
  }

  async duplicateMap(req: Request, res: Response) {
    const { name, includeLayers, includeGroups, includeTools } = req.body as {
      name: string;
      includeLayers?: boolean;
      includeGroups?: boolean;
      includeTools?: boolean;
    };
    const map = await MapService.duplicateMap(
      req.params.mapName,
      name,
      { includeLayers, includeGroups, includeTools },
      req.user?.id
    );
    res.status(HttpStatusCodes.CREATED).json(map);
  }
}
export default new MapsController();
