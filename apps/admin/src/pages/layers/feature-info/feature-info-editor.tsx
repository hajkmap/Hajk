import {
  memo,
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useImperativeHandle,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
  type SyntheticEvent,
} from "react";
import { useDebouncedCallback } from "use-debounce";
import { Box, Divider, IconButton, TextField, Tooltip } from "@mui/material";
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
import FormatIndentIncreaseIcon from "@mui/icons-material/FormatIndentIncrease";
import UndoIcon from "@mui/icons-material/Undo";
import RedoIcon from "@mui/icons-material/Redo";
import { useTranslation } from "react-i18next";
import FeatureInfoSyntaxHelp from "./feature-info-syntax-help";
import { formatInfoboxTemplate } from "./format-template";
import { type EditorHistory } from "./editor-history";

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
  history: EditorHistory;
  emptyShowsAttributes?: boolean;
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
  { key: "heading", icon: <TitleIcon fontSize="small" /> },
  { key: "bold", icon: <FormatBoldIcon fontSize="small" /> },
  { key: "italic", icon: <FormatItalicIcon fontSize="small" /> },
  { key: "list", icon: <FormatListBulletedIcon fontSize="small" /> },
  { key: "link", icon: <LinkIcon fontSize="small" /> },
  { key: "divider", icon: <HorizontalRuleIcon fontSize="small" /> },
  { key: "table", icon: <TableChartOutlinedIcon fontSize="small" /> },
  { key: "condition", icon: <CallSplitIcon fontSize="small" /> },
];

const toolbarButtonSx = { p: 0.5 } as const;

const TABLE_SNIPPET =
  "\n| Egenskap | Värde |\n| --- | --- |\n| Namn | {namn} |\n";

const EDITOR_TEXT = {
  fontFamily: "monospace",
  fontSize: "0.85rem",
  lineHeight: 1.5,
} as const;

const EditorToolbar = memo(function EditorToolbar({
  expanded,
  onToggleExpanded,
  onOpenWindowPreview,
  onTool,
  onInsertSnippet,
  onFormat,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  expanded: boolean;
  onToggleExpanded: () => void;
  onOpenWindowPreview: () => void;
  onTool: (key: ToolKey) => void;
  onInsertSnippet: (snippet: string) => void;
  onFormat: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Box
      role="toolbar"
      aria-label={t("layers.featureInfo.toolbar")}
      sx={{
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexWrap: "nowrap",
          alignItems: "center",
          px: 0.5,
          minWidth: 0,
        }}
      >
        {TOOLS.map((tool, index) => (
          <Box
            key={tool.key}
            sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}
          >
            {(index === 4 || index === 7) && (
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            )}
            <Tooltip title={t(`layers.featureInfo.tool.${tool.key}` as never)}>
              <IconButton
                size="small"
                sx={toolbarButtonSx}
                aria-label={t(`layers.featureInfo.tool.${tool.key}` as never)}
                onClick={() => onTool(tool.key)}
              >
                {tool.icon}
              </IconButton>
            </Tooltip>
          </Box>
        ))}
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
        <Tooltip title={t("layers.featureInfo.tool.format")}>
          <IconButton
            size="small"
            sx={toolbarButtonSx}
            aria-label={t("layers.featureInfo.tool.format")}
            onClick={onFormat}
          >
            <FormatIndentIncreaseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
            ml: "auto",
          }}
        >
          <FeatureInfoSyntaxHelp onInsertFilter={onInsertSnippet} />
          <Tooltip title={t("layers.featureInfo.resizeWindow")}>
            <IconButton
              size="small"
              sx={toolbarButtonSx}
              aria-label={t("layers.featureInfo.resizeWindow")}
              onClick={onOpenWindowPreview}
            >
              <PreviewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip
            title={t(
              expanded
                ? "layers.featureInfo.collapse"
                : "layers.featureInfo.expand",
            )}
          >
            <IconButton
              size="small"
              sx={toolbarButtonSx}
              aria-label={t(
                expanded
                  ? "layers.featureInfo.collapse"
                  : "layers.featureInfo.expand",
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
      </Box>
      <Box sx={{ display: "flex", alignItems: "center", px: 0.5 }}>
        <Tooltip title={t("layers.featureInfo.tool.undo")}>
          <span>
            <IconButton
              size="small"
              sx={toolbarButtonSx}
              aria-label={t("layers.featureInfo.tool.undo")}
              disabled={!canUndo}
              onClick={onUndo}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title={t("layers.featureInfo.tool.redo")}>
          <span>
            <IconButton
              size="small"
              sx={toolbarButtonSx}
              aria-label={t("layers.featureInfo.tool.redo")}
              disabled={!canRedo}
              onClick={onRedo}
            >
              <RedoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
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
  history,
  emptyShowsAttributes = true,
  ref,
}: FeatureInfoEditorProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const gutterRef = useRef<HTMLDivElement | null>(null);
  const measureRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState(value);
  const [historyActions, setHistoryActions] = useState(() => ({
    undo: history.canUndo(),
    redo: history.canRedo(),
  }));
  const lines = draft.split("\n");
  const [lineHeights, setLineHeights] = useState<number[]>([]);

  const syncGutter = useCallback(() => {
    const gutter = gutterRef.current;
    const area = inputRef.current;
    if (!gutter || !area) return;
    gutter.scrollTop = area.scrollTop;
  }, []);

  useLayoutEffect(() => {
    const area = inputRef.current;
    const measure = measureRef.current;
    if (!area || !measure) return;

    const apply = () => {
      const style = getComputedStyle(area);
      const padX =
        Number.parseFloat(style.paddingLeft) +
        Number.parseFloat(style.paddingRight);
      measure.style.width = `${Math.max(0, area.clientWidth - padX)}px`;
      measure.style.font = style.font;
      measure.style.lineHeight = style.lineHeight;
      measure.style.letterSpacing = style.letterSpacing;
      const next = Array.from(
        measure.children,
        (child) => (child as HTMLElement).offsetHeight,
      );
      setLineHeights((current) =>
        current.length === next.length &&
        current.every((height, i) => height === next[i])
          ? current
          : next,
      );
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(area);
    return () => observer.disconnect();
  }, [draft]);
  const draftRef = useRef(value);
  const historyRef = useRef(history);
  historyRef.current = history;
  const applyingHistoryRef = useRef(false);
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

  const publishForm = useDebouncedCallback(
    (next: string) => {
      commitForm(next, true);
    },
    400,
    { maxWait: 800 },
  );

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

  const syncHistoryActions = useCallback(() => {
    const history = historyRef.current;
    const next = {
      undo: history?.canUndo() ?? false,
      redo: history?.canRedo() ?? false,
    };
    setHistoryActions((current) =>
      current.undo === next.undo && current.redo === next.redo ? current : next,
    );
  }, []);

  const updateDraft = useCallback(
    (
      next: string,
      history?: { coalesce: boolean; start: number; end: number },
    ) => {
      if (!applyingHistoryRef.current && history) {
        historyRef.current?.push(
          { value: next, start: history.start, end: history.end },
          history.coalesce,
        );
        syncHistoryActions();
      }
      draftRef.current = next;
      setDraft(next);
      publishPreview(next);
      publishForm(next);
    },
    [publishPreview, publishForm, syncHistoryActions],
  );

  const restoreSnapshot = useCallback(
    (snapshot: { value: string; start: number; end: number }) => {
      applyingHistoryRef.current = true;
      updateDraft(snapshot.value);
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (!el) {
          applyingHistoryRef.current = false;
          return;
        }
        const start = Math.min(snapshot.start, snapshot.value.length);
        const end = Math.min(snapshot.end, snapshot.value.length);
        el.focus();
        el.setSelectionRange(start, end);
        applyingHistoryRef.current = false;
      });
    },
    [updateDraft],
  );

  const undo = useCallback(() => {
    const snapshot = historyRef.current?.undo();
    if (!snapshot) return;
    restoreSnapshot(snapshot);
    syncHistoryActions();
  }, [restoreSnapshot, syncHistoryActions]);

  const redo = useCallback(() => {
    const snapshot = historyRef.current?.redo();
    if (!snapshot) return;
    restoreSnapshot(snapshot);
    syncHistoryActions();
  }, [restoreSnapshot, syncHistoryActions]);

  useEffect(() => {
    if (value === deliveredRef.current || value === draftRef.current) return;
    commitId.current += 1;
    publishPreview.cancel();
    publishForm.cancel();
    deliveredRef.current = value;
    committedRef.current = value;
    draftRef.current = value;
    if (value !== historyRef.current.currentValue()) {
      historyRef.current.push(
        { value, start: value.length, end: value.length },
        false,
      );
      syncHistoryActions();
    }
    setDraft(value);
    onPreviewRef.current(value);
  }, [value, publishPreview, publishForm, syncHistoryActions]);

  useEffect(
    () => () => {
      publishForm.cancel();
      commitId.current += 1;
      const latest = draftRef.current;
      if (deliveredRef.current === latest) return;
      deliveredRef.current = latest;
      onChangeRef.current(latest);
    },
    [publishForm],
  );

  const replaceSelection = useCallback(
    (
      build: (selected: string) => string,
      caretOffset: (inserted: string) => [number, number],
    ) => {
      const el = inputRef.current;
      const current = draftRef.current;
      const start = el?.selectionStart ?? current.length;
      const end = el?.selectionEnd ?? current.length;
      const inserted = build(current.slice(start, end));
      const next = current.slice(0, start) + inserted + current.slice(end);
      const [from, to] = caretOffset(inserted);
      updateDraft(next, {
        coalesce: false,
        start: start + from,
        end: start + to,
      });
      requestAnimationFrame(() => {
        if (!el) return;
        el.focus();
        el.setSelectionRange(start + from, start + to);
      });
    },
    [updateDraft],
  );

  useImperativeHandle(
    ref,
    () => ({
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
        const start =
          lines.slice(0, line - 1).join("\n").length + (line > 1 ? 1 : 0);
        const end = start + (lines[line - 1]?.length ?? 0);
        el.focus();
        el.setSelectionRange(start, end);
        const lineHeight =
          Number.parseFloat(getComputedStyle(el).lineHeight) || 20;
        el.scrollTop = Math.max(
          0,
          (line - 1) * lineHeight - el.clientHeight / 2,
        );
        gutterRef.current?.scrollTo(0, el.scrollTop);
      },
    }),
    [replaceSelection],
  );

  const runTool = useCallback(
    (key: ToolKey) => {
      const current = draftRef.current;
      const selectionStart = inputRef.current?.selectionStart;
      const atLineStart =
        (selectionStart ?? 0) === 0 ||
        current[(selectionStart ?? 1) - 1] === "\n";
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
          replaceSelection(
            (s) => `**${s || "text"}**`,
            (i) => [2, i.length - 2],
          );
          return;
        case "italic":
          replaceSelection(
            (s) => `*${s || "text"}*`,
            (i) => [1, i.length - 1],
          );
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
          replaceSelection(
            () => TABLE_SNIPPET,
            (i) => [i.length, i.length],
          );
          return;
        case "condition":
          replaceSelection(
            (s) =>
              `{{if {attribut}}}\n${s || "Visas när attributet har ett värde"}\n{{/if}}\n`,
            () => [6, 14],
          );
          return;
      }
    },
    [replaceSelection],
  );

  const insertSnippet = useCallback(
    (snippet: string) => {
      replaceSelection(
        () => snippet,
        (inserted) => [inserted.length, inserted.length],
      );
    },
    [replaceSelection],
  );

  const formatDocument = useCallback(() => {
    const next = formatInfoboxTemplate(draftRef.current);
    if (next === draftRef.current) return;
    updateDraft(next, {
      coalesce: false,
      start: next.length,
      end: next.length,
    });
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const end = next.length;
      el.setSelectionRange(end, end);
    });
  }, [updateDraft]);

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
        onFormat={formatDocument}
        canUndo={historyActions.undo}
        canRedo={historyActions.redo}
        onUndo={undo}
        onRedo={redo}
      />
      <Divider />
      <Box
        sx={{ position: "relative", flex: 1, minHeight: 0, display: "flex" }}
      >
        <Box
          ref={gutterRef}
          aria-hidden
          sx={{
            py: 1,
            px: 1,
            minHeight: 0,
            alignSelf: "stretch",
            overflow: "hidden",
            textAlign: "right",
            userSelect: "none",
            color: "text.secondary",
            bgcolor: "action.hover",
            borderRight: 1,
            borderColor: "divider",
            fontVariantNumeric: "tabular-nums",
            ...EDITOR_TEXT,
          }}
        >
          {lines.map((_, index) => (
            <Box
              key={index}
              component="div"
              sx={{ height: lineHeights[index] || "1lh" }}
            >
              {index + 1}
            </Box>
          ))}
        </Box>
        <Box
          ref={measureRef}
          aria-hidden
          sx={{
            position: "absolute",
            visibility: "hidden",
            pointerEvents: "none",
            whiteSpace: "pre-wrap",
            overflowWrap: "anywhere",
            wordBreak: "break-word",
            ...EDITOR_TEXT,
          }}
        >
          {lines.map((line, index) => (
            <Box key={index} component="div">
              {line.length === 0 ? "\u00a0" : line}
            </Box>
          ))}
        </Box>
        <TextField
          id={id}
          value={draft}
          onChange={(e) =>
            updateDraft(e.target.value, {
              coalesce: true,
              start: e.target.selectionStart ?? e.target.value.length,
              end: e.target.selectionEnd ?? e.target.value.length,
            })
          }
          onBlur={commitNow}
          inputRef={inputRef}
          fullWidth
          placeholder={t(
            emptyShowsAttributes
              ? "layers.featureInfo.editorPlaceholder"
              : "layers.featureInfo.editorPlaceholderOverride",
          )}
          slotProps={{
            input: { inputComponent: "textarea" },
            htmlInput: {
              spellCheck: false,
              wrap: "soft",
              "aria-label": t("layers.infobox"),
              onScroll: syncGutter,
              onSelect: (event: SyntheticEvent<HTMLTextAreaElement>) => {
                const el = event.currentTarget;
                historyRef.current?.noteCaret(
                  el.selectionStart ?? 0,
                  el.selectionEnd ?? 0,
                );
              },
              onKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => {
                if (!(event.ctrlKey || event.metaKey) || event.altKey) return;
                const key = event.key.toLowerCase();
                if (key === "z" && !event.shiftKey) {
                  event.preventDefault();
                  undo();
                  return;
                }
                if (key === "y" || (key === "z" && event.shiftKey)) {
                  event.preventDefault();
                  redo();
                }
              },
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
              overflowX: "hidden",
              overflowY: "auto",
              px: 1.5,
              py: 1,
              whiteSpace: "pre-wrap",
              overflowWrap: "anywhere",
              wordBreak: "break-word",
              ...EDITOR_TEXT,
            },
          }}
        />
      </Box>
    </Box>
  );
}

export default memo(FeatureInfoEditor);
