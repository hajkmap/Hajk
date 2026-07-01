import { Box, Alert, Typography, Divider } from "@mui/material";
import { useTranslation } from "react-i18next";
import { RichTextEditor } from "../rich-text-editor";
import type { Document } from "@/api/documents/types";
import type { Chapter } from "./chapter-tree-utils";

function extractChapters(content: Record<string, unknown>): Chapter[] {
  const raw = content.chapters;
  if (!Array.isArray(raw)) return [];
  return raw as Chapter[];
}

const HEADER_VARIANTS = [
  "h5",
  "h6",
  "subtitle1",
  "subtitle2",
] as const;

interface ChapterViewProps {
  chapter: Chapter;
  depth: number;
  toolId: number;
}

function ChapterView({ chapter, depth, toolId }: ChapterViewProps) {
  const variant = HEADER_VARIANTS[Math.min(depth, HEADER_VARIANTS.length - 1)];

  return (
    <Box sx={{ mb: 3, pl: depth > 0 ? 2 : 0 }}>
      {chapter.header ? (
        <Typography variant={variant} sx={{ mb: 1, fontWeight: "bold" }}>
          {chapter.header}
        </Typography>
      ) : null}

      {chapter.html ? (
        <RichTextEditor
          html={chapter.html}
          readOnly
          toolId={toolId}
        />
      ) : null}

      {Array.isArray(chapter.chapters) && chapter.chapters.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {chapter.chapters.map((child, i) => (
            <ChapterView
              key={child.headerIdentifier || i}
              chapter={child}
              depth={depth + 1}
              toolId={toolId}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

interface DocumentViewPanelProps {
  document: Document;
  toolId: number;
}

export function DocumentViewPanel({ document, toolId }: DocumentViewPanelProps) {
  const { t } = useTranslation();
  const chapters = extractChapters(document.content);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 2 }}>
      <Alert severity="info">
        {t("tools.documenthandler.documents.viewDisclaimer")}
      </Alert>

      <Divider />

      {chapters.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {t("tools.documenthandler.documents.viewNoContent")}
        </Typography>
      ) : (
        chapters.map((chapter, i) => (
          <ChapterView
            key={chapter.headerIdentifier || i}
            chapter={chapter}
            depth={0}
            toolId={toolId}
          />
        ))
      )}
    </Box>
  );
}
