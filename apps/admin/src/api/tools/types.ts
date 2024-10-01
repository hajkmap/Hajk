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
