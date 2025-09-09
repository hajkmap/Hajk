import type { Request, Response } from "express";
import type { WebSocket, WebSocketServer } from "ws";
import HttpStatusCodes from "../../../../common/http-status-codes.ts";

interface WebSocketHealthData {
  status: string;
  timestamp: string;
  clients: WebSocket[];
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  platform: string;
  arch: string;
  version: string;
  networkUsage?: unknown;
  diskUsage?: unknown;
}

class WebsocketsController {
  async getHealth(req: Request, res: Response) {
    const wss = req.app.get("wss") as WebSocketServer | undefined;

    if (!wss) {
      return res.status(HttpStatusCodes.SERVICE_UNAVAILABLE).json({
        status: "WebSocket server is not enabled",
        timestamp: new Date().toISOString(),
        error: "WebSocket server is not running or not configured",
      });
    }

    const healthData: WebSocketHealthData = {
      status: "WebSocket server is running",
      timestamp: new Date().toISOString(),
      clients: Array.from(wss.clients),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      platform: process.platform,
      arch: process.arch,
      version: process.version,
    };

    // Add networkUsage and diskUsage if available (Node.js 18.6.0+)
    if (typeof (process as any).networkUsage === "function") {
      healthData.networkUsage = (process as any).networkUsage();
    }

    if (typeof (process as any).diskUsage === "function") {
      healthData.diskUsage = (process as any).diskUsage();
    }

    res.status(HttpStatusCodes.OK).json(healthData);
  }
}
export default new WebsocketsController();
