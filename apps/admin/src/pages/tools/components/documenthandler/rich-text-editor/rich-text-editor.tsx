import { useEffect, useMemo } from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import type { AnyExtension } from "@tiptap/core";
import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { buildExtensions } from "./serialization/extensions";
import { parseLegacyHtml, serializeToLegacyHtml } from "./serialization/serialize";
import { MediaFigureView } from "./node-views/media-figure-view";
import { IframeEmbedView } from "./node-views/iframe-embed-view";
import { TextSectionView } from "./node-views/text-section-view";
import { RichTextToolbar } from "./toolbar";
import useAppStateStore from "@/store/use-app-state-store";

interface RichTextEditorProps {
  /** The raw legacy HTML for one chapter */
  html: string;
  /** Called once when the first edit is made — for dirty-state tracking only */
  onDirty?: () => void;
  /** Ref populated with a function that serializes the editor's current content to HTML on demand */
  getHtmlRef?: React.MutableRefObject<() => string>;
  /** Optional lists for media pickers */
  imageList?: string[];
  videoList?: string[];
  audioList?: string[];
  toolId?: number;
  readOnly?: boolean;
}

export function RichTextEditor({
  html,
  onDirty,
  getHtmlRef,
  imageList,
  videoList,
  audioList,
  toolId,
  readOnly = false,
}: RichTextEditorProps) {
  const { t, i18n } = useTranslation();
  const placeholder = t("dhRichTextEditor.placeholder.editor");
  const spellcheckEnabled = useAppStateStore((s) => s.editorSpellcheckEnabled);

  // Build extensions once on mount (including NodeView wiring for atom nodes).
  // Capture media lists at mount time via closure — they rarely change and
  // we don't want to rebuild the editor on every render.
  const extensions = useMemo((): AnyExtension[] => {
    return buildExtensions(placeholder).map((ext): AnyExtension => {
      if (ext.name === "mediaFigure") {
        return ext.extend({
          addNodeView() {
            return ReactNodeViewRenderer((props) => (
              <MediaFigureView
                {...props}
                imageList={imageList}
                videoList={videoList}
                audioList={audioList}
              />
            ));
          },
        }) as AnyExtension;
      }
      if (ext.name === "iframeEmbed") {
        return ext.extend({
          addNodeView() {
            return ReactNodeViewRenderer(IframeEmbedView);
          },
        }) as AnyExtension;
      }
      if (ext.name === "textSection") {
        return ext.extend({
          addNodeView() {
            return ReactNodeViewRenderer(TextSectionView);
          },
        }) as AnyExtension;
      }
      return ext as AnyExtension;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeholder]);

  // Parse the initial HTML only once at mount.  The component is mounted with
  // a `key` by ChapterEditorPanel, so switching chapters remounts it entirely
  // and this memo re-runs automatically.
  const initialContent = useMemo(() => {
    const doc = parseLegacyHtml(html);
    const content = (doc as { content?: unknown[] }).content;
    return Array.isArray(content) && content.length > 0 ? doc : "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editor = useEditor({
    extensions,
    content: initialContent,
    editable: !readOnly,
    editorProps: {
      attributes: {
        spellcheck: spellcheckEnabled ? "true" : "false",
        ...(spellcheckEnabled ? { lang: i18n.language } : {}),
      },
    },
    onUpdate() {
      onDirty?.();
    },
  });

  // Expose a getter so callers can pull the serialized HTML on demand
  // (e.g. on save or chapter switch) without receiving it on every keystroke.
  useEffect(() => {
    if (getHtmlRef && editor) {
      getHtmlRef.current = () =>
        serializeToLegacyHtml(editor.getJSON() as Record<string, unknown>);
    }
  }, [editor, getHtmlRef]);

  if (!editor) return null;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 1,
        overflow: "hidden",
        height: "100%",
        width: "100%",
      }}
    >
      {!readOnly && (
        <RichTextToolbar
          editor={editor}
          imageList={imageList}
          videoList={videoList}
          audioList={audioList}
          toolId={toolId}
        />
      )}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          width: "100%",
          "& > div": { width: "100%" },
          "& .tiptap": {
            outline: "none",
            p: 2,
            minHeight: 200,
            width: "100%",
            boxSizing: "border-box",
            "& p": { my: 0.5 },
            "& ul, & ol": { pl: 3 },
            // Global CSS reset uses `font: inherit` on *, which strips browser
            // defaults for <strong>/<em>. Restore formatting inside the editor.
            "& strong": { fontWeight: 700 },
            "& em": { fontStyle: "italic" },
            "& del": { textDecoration: "line-through" },
            "& u": { textDecoration: "underline" },
            // Editor-only link preview (does not affect saved HTML).
            // Global reset sets text-decoration:none and an undefined CSS var on <a>.
            "& a": {
              color: "info.main",
              textDecoration: "underline",
              cursor: "pointer",
            },
            "& a[data-hover]": {
              textDecoration: "underline dotted",
              cursor: "help",
            },
            "& figure": { my: 1, mx: 0 },
            "& p.is-editor-empty:first-of-type::before": {
              content: "attr(data-placeholder)",
              color: "text.disabled",
              pointerEvents: "none",
              float: "left",
              height: 0,
            },
          },
        }}
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
}
