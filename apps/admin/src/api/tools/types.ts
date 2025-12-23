export interface Tool {
  id: string;
  type: string;
  options: Record<string, unknown>;
  createdBy?: string;
  createdDate?: string;
  lastSavedBy?: string;
  lastSavedDate?: string;
}

export interface ToolUpdateInput {
  type?: string;
  options?: Record<string, unknown>;
  locked?: boolean;
}

export interface ToolsApiResponse {
  tools: Tool[];
  count: number;
  error: string;
  errorId: string;
}

export interface GlobalMapsApiResponse {
  maps: { name: string; id: string; locked: boolean }[];
  count: number;
  error: string;
  errorId: string;
}
