import { useDeferredValue, useEffect, useState, startTransition } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { Edit as EditIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useDocument } from "@/api/documents";
import { ChapterView } from "./document-view-panel";
import type { Chapter } from "./chapter-tree-utils";

interface DocumentPreviewProps {
  toolId: number;
  folder: string | null;
  name: string | null;
  onEdit: (folder: string, name: string) => void;
}

function extractChapters(content: Record<string, unknown> | undefined) {
  const raw = content?.chapters;
  return Array.isArray(raw) ? (raw as Chapter[]) : [];
}

// Each chapter mounts its own read-only editor, which is costly. Mounting them
// one per task (instead of all in one render) keeps the page responsive while
// a large document fills in.
function useProgressiveCount(total: number, resetKey: unknown) {
  const [count, setCount] = useState(0);
  const [key, setKey] = useState(resetKey);

  // Reset during render (not in an effect) so a newly selected document never
  // renders with the previous document's count, which would mount many at once.
  if (key !== resetKey) {
    setKey(resetKey);
    setCount(0);
  }

  useEffect(() => {
    if (count >= total) return;
    const id = setTimeout(() => {
      startTransition(() => setCount((c) => Math.min(c + 1, total)));
    }, 0);
    return () => clearTimeout(id);
  }, [count, total]);

  return count;
}

export function DocumentPreview({
  toolId,
  folder,
  name,
  onEdit,
}: DocumentPreviewProps) {
  const { t } = useTranslation();

  // Deferred so that clicking around the tree is never blocked by the preview.
  const deferredFolder = useDeferredValue(folder);
  const deferredName = useDeferredValue(name);

  const { data, isLoading, isError } = useDocument(
    toolId,
    deferredFolder ?? undefined,
    deferredName ?? undefined,
  );

  const chapters = extractChapters(data?.content);
  const docKey = data ? `${deferredFolder}/${data.name}` : null;
  const shown = useProgressiveCount(chapters.length, docKey);
  const isFilling = shown < chapters.length;

  let body: React.ReactNode;
  if (!folder || !name) {
    body = (
      <Typography variant="body2" color="text.secondary">
        {t("tools.documenthandler.documents.previewEmpty")}
      </Typography>
    );
  } else if (isLoading) {
    body = (
      <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
        <CircularProgress size={24} />
      </Box>
    );
  } else if (isError || !data) {
    body = (
      <Alert severity="error">
        {t("tools.documenthandler.documents.previewError")}
      </Alert>
    );
  } else if (chapters.length === 0) {
    body = (
      <Typography variant="body2" color="text.secondary">
        {t("tools.documenthandler.documents.viewNoContent")}
      </Typography>
    );
  } else {
    body = (
      <>
        {chapters.slice(0, shown).map((chapter, i) => (
          <ChapterView
            key={`${docKey}:${chapter.headerIdentifier || i}`}
            chapter={chapter}
            depth={0}
            toolId={toolId}
          />
        ))}
        {isFilling && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 1 }}>
            <CircularProgress size={16} />
          </Box>
        )}
      </>
    );
  }

  const isStale = folder !== deferredFolder || name !== deferredName;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: 480,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        bgcolor: "background.paper",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          pl: 1.5,
          pr: 0.5,
          py: 0.25,
          minHeight: 40,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="subtitle2" noWrap sx={{ flex: 1, minWidth: 0 }}>
          {data?.title ?? t("tools.documenthandler.documents.previewTitle")}
        </Typography>
        {folder && name && (
          <Tooltip title={t("tools.documenthandler.documents.editDocument")}>
            <IconButton size="small" onClick={() => onEdit(folder, name)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          p: 1.5,
          opacity: isStale ? 0.5 : 1,
          transition: "opacity 120ms",
          // Shrink the content so the preview stays compact.
          fontSize: "0.85rem",
          "& .tiptap": { minHeight: 0 },
        }}
      >
        {body}
      </Box>
    </Box>
  );
}
