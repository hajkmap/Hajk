import type { Request, Response } from "express";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";
import ThemeService from "../../services/theme.service.ts";

class ThemesController {
  async getThemes(req: Request, res: Response) {
    const themes = await ThemeService.getThemes(req.params.mapName);
    res.status(HttpStatusCodes.OK).json({ count: themes.length, themes });
  }

  async getTheme(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ error: "Theme id must be a number." });
      return;
    }
    const theme = await ThemeService.getTheme(req.params.mapName, id);
    res.status(HttpStatusCodes.OK).json(theme);
  }

  async createTheme(req: Request, res: Response) {
    const theme = await ThemeService.createTheme(
      req.params.mapName,
      req.body,
      req.user?.id
    );
    res.status(HttpStatusCodes.CREATED).json(theme);
  }

  async updateTheme(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ error: "Theme id must be a number." });
      return;
    }
    const theme = await ThemeService.updateTheme(
      req.params.mapName,
      id,
      req.body,
      req.user?.id
    );
    res.status(HttpStatusCodes.OK).json(theme);
  }

  async deleteTheme(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ error: "Theme id must be a number." });
      return;
    }
    await ThemeService.deleteTheme(req.params.mapName, id);
    res.status(HttpStatusCodes.NO_CONTENT).send();
  }

  async getDeletedThemes(_: Request, res: Response) {
    const themes = await ThemeService.getDeletedThemes();
    res.status(HttpStatusCodes.OK).json({ count: themes.length, themes });
  }

  async restoreTheme(req: Request, res: Response) {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) {
      res
        .status(HttpStatusCodes.BAD_REQUEST)
        .json({ error: "Theme id must be a number." });
      return;
    }
    const theme = await ThemeService.restoreTheme(id, req.user?.id);
    res.status(HttpStatusCodes.OK).json(theme);
  }
}

export default new ThemesController();
