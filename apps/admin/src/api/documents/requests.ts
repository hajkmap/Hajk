import { getApiClient, InternalApiError } from "../../lib/internal-api-client";
import type {
  DocumentFolder,
  DocumentSummary,
  Document,
  DocumentWithFolder,
  FolderCreateInput,
  FolderRenameInput,
  DocumentCreateInput,
  DocumentSaveInput,
  DocumentMoveInput,
  FoldersApiResponse,
  DocumentsApiResponse,
} from "./types";

const base = (toolId: number) =>
  `/tools/${toolId}/documenthandler`;

const folderBase = (toolId: number, folder: string) =>
  `${base(toolId)}/folders/${encodeURIComponent(folder)}`;

const docBase = (toolId: number, folder: string, name: string) =>
  `${folderBase(toolId, folder)}/documents/${encodeURIComponent(name)}`;

// ─── By id ──────────────────────────────────────────────────────────────────

export const getDocumentById: (
  id: number,
) => Promise<DocumentWithFolder> = async (id) => {
  const client = getApiClient();
  try {
    const response = await client.get<DocumentWithFolder>(`/documents/${id}`);
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    throw new Error(
      axiosError.response
        ? `Failed to fetch document. ErrorId: ${axiosError.response.data.errorId}.`
        : "Failed to fetch document."
    );
  }
};

// ─── Folders ────────────────────────────────────────────────────────────────

export const getFolders = async (
  toolId: number
): Promise<DocumentFolder[]> => {
  const client = getApiClient();
  try {
    const response = await client.get<FoldersApiResponse>(
      `${base(toolId)}/folders`
    );
    return response.data.folders;
  } catch (error) {
    const axiosError = error as InternalApiError;
    throw new Error(
      axiosError.response
        ? `Failed to fetch folders. ErrorId: ${axiosError.response.data.errorId}.`
        : "Failed to fetch folders."
    );
  }
};

export const createFolder = async (
  toolId: number,
  data: FolderCreateInput
): Promise<DocumentFolder> => {
  const client = getApiClient();
  try {
    const response = await client.post<DocumentFolder>(
      `${base(toolId)}/folders`,
      data
    );
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    throw new Error(
      axiosError.response
        ? `Failed to create folder. ErrorId: ${axiosError.response.data.errorId}.`
        : "Failed to create folder."
    );
  }
};

export const renameFolder = async (
  toolId: number,
  folderName: string,
  data: FolderRenameInput
): Promise<DocumentFolder> => {
  const client = getApiClient();
  try {
    const response = await client.put<DocumentFolder>(
      folderBase(toolId, folderName),
      data
    );
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    throw new Error(
      axiosError.response
        ? `Failed to rename folder. ErrorId: ${axiosError.response.data.errorId}.`
        : "Failed to rename folder."
    );
  }
};

export const deleteFolder = async (
  toolId: number,
  folderName: string
): Promise<void> => {
  const client = getApiClient();
  try {
    await client.delete(folderBase(toolId, folderName));
  } catch (error) {
    const axiosError = error as InternalApiError;
    throw new Error(
      axiosError.response
        ? `Failed to delete folder. ErrorId: ${axiosError.response.data.errorId}.`
        : "Failed to delete folder."
    );
  }
};

// ─── Documents ───────────────────────────────────────────────────────────────

export const getDocuments = async (
  toolId: number,
  folder: string
): Promise<DocumentSummary[]> => {
  const client = getApiClient();
  try {
    const response = await client.get<DocumentsApiResponse>(
      `${folderBase(toolId, folder)}/documents`
    );
    return response.data.documents;
  } catch (error) {
    const axiosError = error as InternalApiError;
    throw new Error(
      axiosError.response
        ? `Failed to fetch documents. ErrorId: ${axiosError.response.data.errorId}.`
        : "Failed to fetch documents."
    );
  }
};

export const getDocument = async (
  toolId: number,
  folder: string,
  name: string
): Promise<Document> => {
  const client = getApiClient();
  try {
    const response = await client.get<Document>(docBase(toolId, folder, name));
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    throw new Error(
      axiosError.response
        ? `Failed to fetch document. ErrorId: ${axiosError.response.data.errorId}.`
        : "Failed to fetch document."
    );
  }
};

export const createDocument = async (
  toolId: number,
  folder: string,
  data: DocumentCreateInput
): Promise<Document> => {
  const client = getApiClient();
  try {
    const response = await client.post<Document>(
      `${folderBase(toolId, folder)}/documents`,
      data
    );
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    throw new Error(
      axiosError.response
        ? `Failed to create document. ErrorId: ${axiosError.response.data.errorId}.`
        : "Failed to create document."
    );
  }
};

export const saveDocument = async (
  toolId: number,
  folder: string,
  name: string,
  data: DocumentSaveInput
): Promise<Document> => {
  const client = getApiClient();
  try {
    const response = await client.put<Document>(
      docBase(toolId, folder, name),
      data
    );
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    throw new Error(
      axiosError.response
        ? `Failed to save document. ErrorId: ${axiosError.response.data.errorId}.`
        : "Failed to save document."
    );
  }
};

export const moveDocument = async (
  toolId: number,
  folder: string,
  name: string,
  data: DocumentMoveInput
): Promise<Document> => {
  const client = getApiClient();
  try {
    const response = await client.patch<Document>(
      `${docBase(toolId, folder, name)}/move`,
      data
    );
    return response.data;
  } catch (error) {
    const axiosError = error as InternalApiError;
    throw new Error(
      axiosError.response
        ? `Failed to move document. ErrorId: ${axiosError.response.data.errorId}.`
        : "Failed to move document."
    );
  }
};

export const deleteDocument = async (
  toolId: number,
  folder: string,
  name: string
): Promise<void> => {
  const client = getApiClient();
  try {
    await client.delete(docBase(toolId, folder, name));
  } catch (error) {
    const axiosError = error as InternalApiError;
    throw new Error(
      axiosError.response
        ? `Failed to delete document. ErrorId: ${axiosError.response.data.errorId}.`
        : "Failed to delete document."
    );
  }
};
