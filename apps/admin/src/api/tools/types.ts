/**
 * A tool instance: a configured instance of a ToolType. Several instances of
 * the same type can exist, and one instance can be used on many maps.
 * Backed by the ToolInstance model in the backend.
 */
export interface Tool {
  id: string;
  type: string;
  title?: string | null;
  options: Record<string, unknown>;
  createdBy?: string;
  createdDate?: string;
  lastSavedBy?: string;
  lastSavedDate?: string;
  mapsCount: number;
  mapNames: string[];
}

/** A plugin the client can render. Each Tool is an instance of one. */
export interface ToolType {
  type: string;
  title: string;
  description?: string | null;
}

/** Response of `GET /tools/types`. */
export interface ToolTypesApiResponse {
  toolTypes: ToolType[];
  count: number;
  error: string;
  errorId: string;
}

/** Body for creating a new tool instance of the given ToolType. */
export interface ToolCreateInput {
  type: string;
  title?: string;
  options?: Record<string, unknown>;
}

/** Body for updating a tool instance. Changes apply to every map using it. */
export interface ToolUpdateInput {
  type?: string;
  title?: string;
  options?: Record<string, unknown>;
  locked?: boolean;
}

/** Response of `GET /tools`: all tool instances. */
export interface ToolsApiResponse {
  tools: Tool[];
  count: number;
  error: string;
  errorId: string;
}

/** Response of `GET /tools/:toolName/maps`. */
export interface GlobalMapsApiResponse {
  maps: { name: string; id: string; locked: boolean }[];
  count: number;
  error: string;
  errorId: string;
}
