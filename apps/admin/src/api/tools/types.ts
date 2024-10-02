export interface Tool {
  id: string;
  type: string;
  options: Record<string, string>;
}

export interface ToolsApiResponse {
  tools: Tool[];
  count: number;
  error: string;
  errorId: string;
}

export interface GlobalMapsApiResponse {
  maps: { name: string; id: string }[];
  count: number;
  error: string;
  errorId: string;
}
