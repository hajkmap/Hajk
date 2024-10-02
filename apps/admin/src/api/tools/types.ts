import { Map } from "../maps";

export interface Tool {
  id: string;
  type: string;
  options: Record<string, string>;
}

export interface ToolsApiResponse {
  tools: Tool[];
  count?: number;
  error: string;
  errorId: string;
}

export interface GlobalMapsApiResponse {
  maps?: Map[];
  mapsWithTool?: Map[];
  count?: number;
  error: string;
  errorId: string;
}
