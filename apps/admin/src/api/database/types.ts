export interface DatabaseStatus {
  exports: {
    name: string;
    size: number;
    created: string;
    path: string;
  }[];
  tools: {
    pg_dump: { available: boolean; path: string; version: string };
    pg_restore: { available: boolean; path: string; version: string };
    psql: { available: boolean; path: string; version: string };
  };
  exportDir: string;
  importDir: string;
}

export interface DatabaseExportRequest {
  format?: "sql" | "custom" | "tar" | "directory";
  includeData?: boolean;
  schemaOnly?: boolean;
  dataOnly?: boolean;
  compress?: boolean;
}

export interface DatabaseImportRequest {
  file: string;
  fileName: string;
  format?: "sql" | "custom" | "tar" | "directory";
  clean?: boolean;
}

export interface DatabaseExportResponse {
  success: boolean;
  exportId: string;
  fileName: string;
  filePath: string;
  size: number;
  format: string;
  message: string;
}

export interface DatabaseImportResponse {
  [x: string]: unknown;
  success: boolean;
  importId: string;
  fileName: string;
  format: string;
  message: string;
}

export interface DatabaseToolsResponse {
  success: boolean;
  tools: {
    pg_dump: { available: boolean; path: string; version: string };
    pg_restore: { available: boolean; path: string; version: string };
    psql: { available: boolean; path: string; version: string };
  };
  message: string;
}
