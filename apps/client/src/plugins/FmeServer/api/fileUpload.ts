/**
 * An entry in the data upload response.
 * This is the entry that contains the path to the uploaded file.
 */
interface DataUploadFileEntry {
  path?: string;
  name?: string;
}

/**
 * The response from the data upload endpoint.
 * This is the response from the FME server. Looks messy, but it is the only way to get the path to the uploaded file.
 */
interface DataUploadResponse {
  serviceResponse?: {
    statusInfo?: { status?: string };
    file?: DataUploadFileEntry;
    files?: {
      file?: DataUploadFileEntry | DataUploadFileEntry[];
      folder?: DataUploadFileEntry | DataUploadFileEntry[];
      path?: string;
    };
  };
}

/**
 * Returns the first entry from an array of entries.
 * We return the first entry because the FME server returns an array of entries, but we only need the first one.
 */
function firstEntry(
  entry: DataUploadFileEntry | DataUploadFileEntry[] | undefined
): DataUploadFileEntry | undefined {
  return Array.isArray(entry) ? entry[0] : entry;
}

/**
 * Parses the uploaded file path from the data upload response.
 * This is the path to the uploaded file.
 */
export function parseUploadedFilePath(data: DataUploadResponse): string | null {
  const response = data?.serviceResponse;
  if (!response || response.statusInfo?.status === "failure") {
    return null;
  }

  const directPath = response.file?.path;
  if (directPath) {
    return directPath;
  }

  const files = response.files;
  if (!files) {
    return null;
  }

  const fileEntry = firstEntry(files.file);
  if (fileEntry?.path) {
    return fileEntry.path;
  }

  const folderEntry = firstEntry(files.folder);
  if (folderEntry?.path) {
    return folderEntry.path;
  }

  return files.path || null;
}
