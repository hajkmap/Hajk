export interface Theme {
  id: number;
  mapName: string;
  title: string;
  owner?: string | null;
  description?: string | null;
  keywords: string[];
  data: Record<string, unknown>;
  createdBy?: string;
  createdDate?: string;
  lastSavedBy?: string;
  lastSavedDate?: string;
  deletedAt?: string | null;
}

export interface ThemesApiResponse {
  count: number;
  themes: Theme[];
}

export interface ThemeCreateInput {
  title: string;
  owner?: string;
  description?: string;
  keywords?: string[];
  data: Record<string, unknown>;
}

export interface ThemeUpdateInput {
  title?: string;
  owner?: string;
  description?: string;
  keywords?: string[];
  data?: Record<string, unknown>;
}

export interface ImportedThemeJson {
  layers?: unknown[];
  metadata?: Record<string, unknown>;
}
