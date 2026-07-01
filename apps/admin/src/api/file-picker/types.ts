export interface FileEntry {
  name: string;
  path: string;
  type: "file" | "directory";
  /** Root-relative (or absolute) web URL for files; undefined for directories. */
  url?: string;
  size?: number;
  mtime?: string;
}

export interface ReadableDir {
  id: string;
  label: string;
  /** Public URL base the files in this directory are served under. */
  urlBase: string;
}

export interface FileListResponse {
  items: FileEntry[];
  path: string;
  dir: string;
  dirs: ReadableDir[];
}
