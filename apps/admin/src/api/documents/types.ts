export interface DocumentFolder {
  id: number;
  name: string;
  title: string;
  toolId: number;
  createdBy?: string;
  createdDate?: string;
  lastSavedBy?: string;
  lastSavedDate?: string;
  _count?: { documents: number };
}

export interface DocumentSummary {
  id: number;
  name: string;
  title: string;
  createdDate?: string;
  lastSavedDate?: string;
}

export interface Document {
  id: number;
  name: string;
  title: string;
  content: Record<string, unknown>;
  toolId: number;
  folderId: number;
  createdBy?: string;
  createdDate?: string;
  lastSavedBy?: string;
  lastSavedDate?: string;
}

export interface DocumentWithFolder extends Document {
  folderName: string;
}

export interface FolderCreateInput {
  title: string;
}

export interface FolderRenameInput {
  title: string;
}

export interface DocumentCreateInput {
  title: string;
}

export interface DocumentSaveInput {
  title?: string;
  content: Record<string, unknown>;
}

export interface DocumentMoveInput {
  targetFolder: string;
}

export interface FoldersApiResponse {
  count: number;
  folders: DocumentFolder[];
}

export interface DocumentsApiResponse {
  count: number;
  documents: DocumentSummary[];
}
