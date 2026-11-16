import {
  memo,
  startTransition,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from "react";
import { useDebouncedCallback } from "use-debounce";
import {
  Box,
  Divider,
  IconButton,
  TextField,
  Tooltip,
} from "@mui/material";
import TitleIcon from "@mui/icons-material/Title";
import FormatBoldIcon from "@mui/icons-material/FormatBold";
import FormatItalicIcon from "@mui/icons-material/FormatItalic";
import FormatListBulletedIcon from "@mui/icons-material/FormatListBulleted";
import LinkIcon from "@mui/icons-material/Link";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import PreviewIcon from "@mui/icons-material/Preview";
import { useTranslation } from "react-i18next";
import FeatureInfoSyntaxHelp from "./feature-info-syntax-help";

export interface FeatureInfoEditorHandle {
  insert: (text: string) => void;
  wrap: (before: string, after: string, placeholder: string) => void;
  goToLine: (line: number) => void;
}

interface FeatureInfoEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onPreviewChange: (value: string) => void;
  expanded: boolean;
  onToggleExpanded: () => void;
  onOpenWindowPreview: () => void;
  ref?: Ref<FeatureInfoEditorHandle>;
}

type ToolKey =
  | "heading"
  | "bold"
  | "italic"
  | "list"
  | "link"
  | "divider"
  | "table"
  | "condition";

const TOOLS: { key: ToolKey; icon: ReactNode }[] = [
  { key: "heading", icon: <TitleIcon /> },
  { key: "bold", icon: <FormatBoldIcon /> },
  { key: "italic", icon: <FormatItalicIcon /> },
  { key: "list", icon: <FormatListBulletedIcon /> },
  { key: "link", icon: <LinkIcon /> },
  { key: "divider", icon: <HorizontalRuleIcon /> },
  { key: "table", icon: <TableChartOutlinedIcon /> },
  { key: "condition", icon: <CallSplitIcon /> },
];

const TABLE_SNIPPET =
  "\n| Egenskap | Värde |\n| --- | --- |\n| Namn | {namn} |\n";

const EditorToolbar = memo(function EditorToolbar({
  expanded,
  onToggleExpanded,
  onOpenWindowPreview,
  onTool,
  onInsertSnippet,
}: {
  expanded: boolean;
  onToggleExpanded: () => void;
  onOpenWindowPreview: () => void;
  onTool: (key: ToolKey) => void;
  onInsertSnippet: (snippet: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <Box
      role="toolbar"
      aria-label={t("layers.featureInfo.toolbar")}
      sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", px: 0.5 }}
    >
      {TOOLS.map((tool, index) => (
        <Box key={tool.key} sx={{ display: "flex", alignItems: "center" }}>
          {(index === 4 || index === 7) && (
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          )}
          <Tooltip title={t(`layers.featureInfo.tool.${tool.key}` as never)}>
            <IconButton
              size="small"
              aria-label={t(`layers.featureInfo.tool.${tool.key}` as never)}
              onClick={() => onTool(tool.key)}
            >
              {tool.icon}
            </IconButton>
          </Tooltip>
        </Box>
      ))}
      <FeatureInfoSyntaxHelp onInsertFilter={onInsertSnippet} />
      <Tooltip title={t("layers.featureInfo.resizeWindow")}>
        <IconButton
          size="small"
          aria-label={t("layers.featureInfo.resizeWindow")}
          onClick={onOpenWindowPreview}
        >
          <PreviewIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip
        title={t(expanded ? "layers.featureInfo.collapse" : "layers.featureInfo.expand")}
      >
        <IconButton
          size="small"
          aria-label={t(
            expanded ? "layers.featureInfo.collapse" : "layers.featureInfo.expand",
          )}
          onClick={onToggleExpanded}
        >
          {expanded ? (
            <CloseFullscreenIcon fontSize="small" />
          ) : (
            <OpenInFullIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>
    </Box>
  );
});

function FeatureInfoEditor({
  id,
  value,
  onChange,
  onPreviewChange,
  expanded,
  onToggleExpanded,
  onOpenWindowPreview,
  ref,
}: FeatureInfoEditorProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [draft, setDraft] = useState(value);
  const draftRef = useRef(value);
  const committedRef = useRef(value);
  const deliveredRef = useRef(value);
  const commitId = useRef(0);
  const onChangeRef = useRef(onChange);
  const onPreviewRef = useRef(onPreviewChange);
  onChangeRef.current = onChange;
  onPreviewRef.current = onPreviewChange;

  const publishPreview = useDebouncedCallback((next: string) => {
    onPreviewRef.current(next);
  }, 200);

  const publishForm = useDebouncedCallback((next: string) => {
    commitForm(next, true);
  }, 400, { maxWait: 800 });

  function commitForm(next: string, deferred: boolean) {
    if (next === deliveredRef.current) {
      committedRef.current = next;
      return;
    }
    const id = ++commitId.current;
    committedRef.current = next;
    const send = () => {
      if (id !== commitId.current || deliveredRef.current === next) return;
      deliveredRef.current = next;
      onChangeRef.current(next);
    };
    if (deferred) startTransition(send);
    else send();
  }

  const updateDraft = useCallback((next: string) => {
    draftRef.current = next;
    setDraft(next);
    publishPreview(next);
    publishForm(next);
  }, [publishPreview, publishForm]);

  useEffect(() => {
    if (value === deliveredRef.current || value === draftRef.current) return;
    commitId.current += 1;
    publishPreview.cancel();
    publishForm.cancel();
    deliveredRef.current = value;
    committedRef.current = value;
    draftRef.current = value;
    setDraft(value);
    onPreviewRef.current(value);
  }, [value, publishPreview, publishForm]);

  useEffect(() => () => {
    publishForm.cancel();
    commitId.current += 1;
    const latest = draftRef.current;
    if (deliveredRef.current === latest) return;
    deliveredRef.current = latest;
    onChangeRef.current(latest);
  }, [publishForm]);

  const replaceSelection = useCallback((
    build: (selected: string) => string,
    caretOffset: (inserted: string) => [number, number],
  ) => {
    const el = inputRef.current;
    const current = draftRef.current;
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;
    const inserted = build(current.slice(start, end));
    updateDraft(current.slice(0, start) + inserted + current.slice(end));
    requestAnimationFrame(() => {
      if (!el) return;
      const [from, to] = caretOffset(inserted);
      el.focus();
      el.setSelectionRange(start + from, start + to);
    });
  }, [updateDraft]);

  useImperativeHandle(ref, () => ({
    insert: (text) =>
      replaceSelection(
        () => text,
        (inserted) => [inserted.length, inserted.length],
      ),
    wrap: (before, after, placeholder) =>
      replaceSelection(
        (selected) => `${before}${selected || placeholder}${after}`,
        (inserted) => [before.length, inserted.length - after.length],
      ),
    goToLine: (line) => {
      const el = inputRef.current;
      if (!el) return;
      const lines = draftRef.current.split("\n");
      const start = lines.slice(0, line - 1).join("\n").length + (line > 1 ? 1 : 0);
      const end = start + (lines[line - 1]?.length ?? 0);
      el.focus();
      el.setSelectionRange(start, end);
      const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || 20;
      el.scrollTop = Math.max(0, (line - 1) * lineHeight - el.clientHeight / 2);
    },
  }), [replaceSelection]);

  const runTool = useCallback((key: ToolKey) => {
    const current = draftRef.current;
    const selectionStart = inputRef.current?.selectionStart;
    const atLineStart =
      (selectionStart ?? 0) === 0 || current[(selectionStart ?? 1) - 1] === "\n";
    const linePrefix = (prefix: string) =>
      replaceSelection(
        (selected) => `${atLineStart ? "" : "\n"}${prefix}${selected}`,
        (inserted) => [inserted.length, inserted.length],
      );

    switch (key) {
      case "heading":
        linePrefix("## ");
        return;
      case "bold":
        replaceSelection((s) => `**${s || "text"}**`, (i) => [2, i.length - 2]);
        return;
      case "italic":
        replaceSelection((s) => `*${s || "text"}*`, (i) => [1, i.length - 1]);
        return;
      case "list":
        linePrefix("- ");
        return;
      case "link":
        replaceSelection(
          (s) => `[${s || "Länktext"}](https://)`,
          (i) => [i.length - 9, i.length - 1],
        );
        return;
      case "divider":
        linePrefix("\n---\n");
        return;
      case "table":
        replaceSelection(() => TABLE_SNIPPET, (i) => [i.length, i.length]);
        return;
      case "condition":
        replaceSelection(
          (s) => `{{if {attribut}}}\n${s || "Visas när attributet har ett värde"}\n{{/if}}\n`,
          () => [6, 14],
        );
        return;
    }
  }, [replaceSelection]);

  const insertSnippet = useCallback((snippet: string) => {
    replaceSelection(
      () => snippet,
      (inserted) => [inserted.length, inserted.length],
    );
  }, [replaceSelection]);

  const commitNow = useCallback(() => {
    publishPreview.flush();
    publishForm.cancel();
    commitForm(draftRef.current, false);
  }, [publishPreview, publishForm]);

  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        height: "100%",
      }}
    >
      <EditorToolbar
        expanded={expanded}
        onToggleExpanded={onToggleExpanded}
        onOpenWindowPreview={onOpenWindowPreview}
        onTool={runTool}
        onInsertSnippet={insertSnippet}
      />
      <Divider />
      <TextField
        id={id}
        value={draft}
        onChange={(e) => updateDraft(e.target.value)}
        onBlur={commitNow}
        inputRef={inputRef}
        fullWidth
        placeholder={t("layers.featureInfo.editorPlaceholder")}
        slotProps={{
          input: { inputComponent: "textarea" },
          htmlInput: {
            spellCheck: false,
            "aria-label": t("layers.infobox"),
          },
        }}
        sx={{
          flex: 1,
          minHeight: 0,
          "& .MuiOutlinedInput-notchedOutline": { border: 0 },
          "& .MuiInputBase-root": {
            height: "100%",
            alignItems: "stretch",
            p: 0,
            overflow: "hidden",
          },
          "& textarea": {
            boxSizing: "border-box",
            height: "100%",
            resize: "none",
            overflow: "auto",
            px: 1.5,
            py: 1,
            fontFamily: "monospace",
            fontSize: "0.85rem",
            lineHeight: 1.5,
          },
        }}
      />
    </Box>
  );
}

export default memo(FeatureInfoEditor);
