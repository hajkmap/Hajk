import { useMemo } from "react";
import {
  useQuery,
  useQueries,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from "@tanstack/react-query";
import {
  getFolders,
  createFolder,
  renameFolder,
  deleteFolder,
  getDocuments,
  getDocument,
  getDocumentById,
  createDocument,
  saveDocument,
  moveDocument,
  deleteDocument,
} from "./requests";
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
} from "./types";

// ─── Folder hooks ────────────────────────────────────────────────────────────

export const useFolders = (
  toolId: number | undefined
): UseQueryResult<DocumentFolder[]> => {
  return useQuery({
    queryKey: ["documentFolders", toolId],
    queryFn: () => getFolders(toolId!),
    enabled: toolId !== undefined,
  });
};

export const useCreateFolder = (toolId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FolderCreateInput) => createFolder(toolId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["documentFolders", toolId],
      });
    },
  });
};

export const useRenameFolder = (toolId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      folderName,
      data,
    }: {
      folderName: string;
      data: FolderRenameInput;
    }) => renameFolder(toolId, folderName, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["documentFolders", toolId],
      });
    },
  });
};

export const useDeleteFolder = (toolId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (folderName: string) => deleteFolder(toolId, folderName),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["documentFolders", toolId],
      });
    },
  });
};

// ─── Document hooks ──────────────────────────────────────────────────────────

/** Prefer the seeded "general" folder; otherwise use the first available folder. */
export function getDefaultDocumentFolder(
  folders: DocumentFolder[]
): string | undefined {
  if (folders.length === 0) return undefined;
  return folders.find((folder) => folder.name === "general")?.name ?? folders[0].name;
}

/**
 * Resolves which folder contains a document. Legacy menu items often store
 * `folder: ""` even though documents now live in named folders (e.g. "general").
 * When no folder is stored, falls back to the tool's default folder.
 */
export function useResolveDocumentFolder(
  toolId: number | undefined,
  documentName: string | undefined,
  storedFolder: string | undefined,
  folders: DocumentFolder[]
): { effectiveFolder: string | undefined; isResolving: boolean } {
  const trimmedDoc = documentName?.trim() ?? "";
  const storedFolderName = storedFolder?.trim() ?? "";
  const storedFolderValid =
    storedFolderName !== "" &&
    folders.some((folder) => folder.name === storedFolderName);

  const defaultFolder = useMemo(
    () => getDefaultDocumentFolder(folders),
    [folders]
  );

  const { data: storedFolderDocs = [], isLoading: storedFolderDocsLoading } =
    useDocuments(
      toolId,
      storedFolderValid ? storedFolderName : undefined
    );

  const storedFolderMatches =
    storedFolderValid &&
    trimmedDoc !== "" &&
    storedFolderDocs.some((doc) => doc.name === trimmedDoc);

  const shouldSearch =
    trimmedDoc !== "" && toolId !== undefined && folders.length > 0 && !storedFolderMatches;

  const folderQueries = useQueries({
    queries: folders.map((folder) => ({
      queryKey: ["documents", toolId, folder.name],
      queryFn: () => getDocuments(toolId!, folder.name),
      enabled: shouldSearch,
      staleTime: 60_000,
    })),
  });

  const resolvedFromSearch = useMemo(() => {
    if (!shouldSearch) return undefined;
    for (let i = 0; i < folders.length; i++) {
      const docs = folderQueries[i]?.data;
      if (docs?.some((doc) => doc.name === trimmedDoc)) {
        return folders[i].name;
      }
    }
    return undefined;
  }, [shouldSearch, folderQueries, folders, trimmedDoc]);

  const effectiveFolder =
    storedFolderMatches
      ? storedFolderName
      : resolvedFromSearch ??
        (storedFolderValid ? storedFolderName : undefined) ??
        defaultFolder;

  const isResolving =
    (storedFolderValid && storedFolderDocsLoading && trimmedDoc !== "") ||
    (shouldSearch && folderQueries.some((query) => query.isLoading));

  return { effectiveFolder, isResolving };
}

export const useDocuments = (
  toolId: number | undefined,
  folder: string | undefined
): UseQueryResult<DocumentSummary[]> => {
  return useQuery({
    queryKey: ["documents", toolId, folder],
    queryFn: () => getDocuments(toolId!, folder!),
    enabled: toolId !== undefined && !!folder,
  });
};

export const useDocument = (
  toolId: number | undefined,
  folder: string | undefined,
  name: string | undefined
): UseQueryResult<Document> => {
  return useQuery({
    queryKey: ["document", toolId, folder, name],
    queryFn: () => getDocument(toolId!, folder!, name!),
    enabled: toolId !== undefined && !!folder && !!name,
  });
};

export const useDocumentById = (
  id: number | undefined,
): UseQueryResult<DocumentWithFolder> => {
  return useQuery<DocumentWithFolder>({
    queryKey: ["document-by-id", id],
    queryFn: (): Promise<DocumentWithFolder> => {
      if (id === undefined || Number.isNaN(id)) {
        throw new Error("Document id is required");
      }
      return getDocumentById(id);
    },
    enabled: id !== undefined && !Number.isNaN(id),
  });
};

export const useCreateDocument = (toolId: number, folder: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DocumentCreateInput) =>
      createDocument(toolId, folder, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["documents", toolId, folder],
      });
    },
  });
};

export const useSaveDocument = (
  toolId: number,
  folder: string,
  name: string
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DocumentSaveInput) =>
      saveDocument(toolId, folder, name, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["document", toolId, folder, name],
      });
      void queryClient.invalidateQueries({
        queryKey: ["documents", toolId, folder],
      });
    },
  });
};

export const useMoveDocument = (toolId: number, folder: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, data }: { name: string; data: DocumentMoveInput }) =>
      moveDocument(toolId, folder, name, data),
    onSuccess: (_result, { data }) => {
      void queryClient.invalidateQueries({
        queryKey: ["documents", toolId, folder],
      });
      void queryClient.invalidateQueries({
        queryKey: ["documents", toolId, data.targetFolder],
      });
      void queryClient.invalidateQueries({
        queryKey: ["documentFolders", toolId],
      });
    },
  });
};

export const useMoveDocumentAcrossFolders = (toolId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sourceFolder,
      name,
      targetFolder,
    }: {
      sourceFolder: string;
      name: string;
      targetFolder: string;
    }) => moveDocument(toolId, sourceFolder, name, { targetFolder }),
    onSuccess: (_result, { sourceFolder, targetFolder }) => {
      void queryClient.invalidateQueries({
        queryKey: ["documents", toolId, sourceFolder],
      });
      void queryClient.invalidateQueries({
        queryKey: ["documents", toolId, targetFolder],
      });
      void queryClient.invalidateQueries({
        queryKey: ["documentFolders", toolId],
      });
    },
  });
};

export const useDeleteDocument = (toolId: number, folder: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => deleteDocument(toolId, folder, name),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ["documents", toolId, folder],
      });
    },
  });
};
