import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import MapService from "../../services/map.service.ts";
import LayerTreeService from "../../services/layer-tree.service.ts";
import { userNameOf } from "../../utils/user-name.ts";

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

  async getLayersForMap(req: Request, res: Response) {
    const layers = await MapService.getLayersForMap(req.params.mapName);
    res.status(HttpStatusCodes.OK).json({ count: layers.length, layers });
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
    const { layers } = req.body as {
      layers: Parameters<typeof MapService.updateMapLayers>[1];
    };
    await MapService.updateMapLayers(req.params.mapName, layers ?? []);
    res.status(HttpStatusCodes.NO_CONTENT).send();
  }

  // The map's own tree, apart from the layerswitcher tool.
  async getMapLayerTree(req: Request, res: Response) {
    const tree = await LayerTreeService.getMapTree(req.params.mapName);
    res.status(HttpStatusCodes.OK).json(tree);
  }

  async updateMapLayerTree(req: Request, res: Response) {
    const tree = await LayerTreeService.updateMapTree(
      req.params.mapName,
      req.body,
      req.user?.id,
      await userNameOf(req, res)
    );
    res.status(HttpStatusCodes.OK).json(tree);
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

  async getDeletedMaps(_: Request, res: Response) {
    const maps = await MapService.getDeletedMaps();
    res.status(HttpStatusCodes.OK).json({ count: maps.length, maps });
  }

  async restoreMap(req: Request, res: Response) {
    const map = await MapService.restoreMap(req.params.mapName, req.user?.id);
    res.status(HttpStatusCodes.OK).json(map);
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
