import { memo, useEffect, useMemo, useRef } from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import {
  createDocument,
  type AnyExtension,
  type Node as TiptapNode,
} from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
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
  /**
   * The chapter's saved HTML. When given, `onChangedChange` reports whether the
   * content differs from it, so undoing an edit counts as unchanged again.
   */
  baselineHtml?: string;
  /** Called on mount and after every edit with whether the content differs from `baselineHtml`. */
  onChangedChange?: (changed: boolean) => void;
  /** Ref populated with a function that makes the current content the new baseline (after a save) */
  resetBaselineRef?: React.MutableRefObject<() => void>;
  /** Ref populated with a function that serializes the editor's current content to HTML on demand */
  getHtmlRef?: React.MutableRefObject<() => string>;
  /** Optional lists for media pickers */
  imageList?: string[];
  videoList?: string[];
  audioList?: string[];
  toolId?: number;
  readOnly?: boolean;
}

// Memoized so edits elsewhere in the dialog (such as typing a chapter title)
// don't re-render the editor and its toolbar on every keystroke.
export const RichTextEditor = memo(function RichTextEditor({
  html,
  baselineHtml,
  onChangedChange,
  resetBaselineRef,
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
        return (ext as TiptapNode).extend({
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
        return (ext as TiptapNode).extend({
          addNodeView() {
            return ReactNodeViewRenderer(IframeEmbedView);
          },
        }) as AnyExtension;
      }
      if (ext.name === "textSection") {
        return (ext as TiptapNode).extend({
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
  const initialContent = useMemo(
    () => toEditorContent(html),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // The saved version to compare against, as an editor document. ProseMirror's
  // Node.eq is a cheap structural compare, so no HTML is serialized per keystroke.
  const baselineDocRef = useRef<PMNode | null>(null);
  const onChangedChangeRef = useRef(onChangedChange);
  useEffect(() => {
    onChangedChangeRef.current = onChangedChange;
  });

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
    onUpdate({ editor }) {
      const baseline = baselineDocRef.current;
      onChangedChangeRef.current?.(!baseline || !editor.state.doc.eq(baseline));
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

  // Set the baseline once the editor exists. The component remounts per
  // chapter (keyed), so the props it was mounted with are the ones that count.
  useEffect(() => {
    if (!editor) return;
    if (baselineHtml === undefined) {
      baselineDocRef.current = null;
    } else if (baselineHtml === html) {
      baselineDocRef.current = editor.state.doc;
    } else {
      try {
        baselineDocRef.current = createDocument(
          toEditorContent(baselineHtml),
          editor.schema,
        );
      } catch {
        baselineDocRef.current = null;
      }
    }
    const baseline = baselineDocRef.current;
    onChangedChangeRef.current?.(!baseline || !editor.state.doc.eq(baseline));
    if (resetBaselineRef) {
      resetBaselineRef.current = () => {
        baselineDocRef.current = editor.state.doc;
        onChangedChangeRef.current?.(false);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

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
});

/** Legacy chapter HTML as editor content ("" when there is nothing to show). */
function toEditorContent(source: string): Record<string, unknown> | "" {
  const doc = parseLegacyHtml(source);
  const content = (doc as { content?: unknown[] }).content;
  return Array.isArray(content) && content.length > 0 ? doc : "";
}
