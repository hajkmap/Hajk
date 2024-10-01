export interface Tool {
  id: string;
  type: string;
  options: Record<string, string>;
}

export interface MapsByToolName {
  id: string;
  name: string;
}
export interface ToolsApiResponse {
  tools: Tool[];
  count?: number;
  error: string;
  errorId: string;
}

export interface ToolsByMapNameApiResponse {
  mapsWithTool: MapsByToolName[];
  count?: number;
  error: string;
  errorId: string;
}
