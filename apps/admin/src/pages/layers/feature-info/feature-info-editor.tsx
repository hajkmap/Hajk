import { useImperativeHandle, useRef, type Ref } from "react";
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
import { useTranslation } from "react-i18next";
import FeatureInfoSyntaxHelp from "./feature-info-syntax-help";

export interface FeatureInfoEditorHandle {
  /** Replaces the selection with `text` and puts the caret after it. */
  insert: (text: string) => void;
  /** Wraps the selection, or `placeholder` when nothing is selected. */
  wrap: (before: string, after: string, placeholder: string) => void;
  goToLine: (line: number) => void;
}

interface FeatureInfoEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  ref?: Ref<FeatureInfoEditorHandle>;
}

const TABLE_SNIPPET =
  "\n| Egenskap | Värde |\n| --- | --- |\n| Namn | {namn} |\n";

export default function FeatureInfoEditor({
  id,
  value,
  onChange,
  ref,
}: FeatureInfoEditorProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const replaceSelection = (
    build: (selected: string) => string,
    caretOffset: (inserted: string) => [number, number],
  ) => {
    const el = inputRef.current;
    const start = el?.selectionStart ?? value.length;
    const end = el?.selectionEnd ?? value.length;
    const inserted = build(value.slice(start, end));
    onChange(value.slice(0, start) + inserted + value.slice(end));
    requestAnimationFrame(() => {
      if (!el) return;
      const [from, to] = caretOffset(inserted);
      el.focus();
      el.setSelectionRange(start + from, start + to);
    });
  };

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
      const lines = value.split("\n");
      const start = lines.slice(0, line - 1).join("\n").length + (line > 1 ? 1 : 0);
      const end = start + (lines[line - 1]?.length ?? 0);
      el.focus();
      el.setSelectionRange(start, end);
    },
  }));

  const tools = [
    { key: "heading", icon: <TitleIcon /> },
    { key: "bold", icon: <FormatBoldIcon /> },
    { key: "italic", icon: <FormatItalicIcon /> },
    { key: "list", icon: <FormatListBulletedIcon /> },
    { key: "link", icon: <LinkIcon /> },
    { key: "divider", icon: <HorizontalRuleIcon /> },
    { key: "table", icon: <TableChartOutlinedIcon /> },
    { key: "condition", icon: <CallSplitIcon /> },
  ] as const;

  const runTool = (key: (typeof tools)[number]["key"]) => {
    const selectionStart = inputRef.current?.selectionStart;
    const atLineStart =
      (selectionStart ?? 0) === 0 || value[(selectionStart ?? 1) - 1] === "\n";
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
  };

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
      <Box
        role="toolbar"
        aria-label={t("layers.featureInfo.toolbar")}
        sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", px: 0.5 }}
      >
        {tools.map((tool, index) => (
          <Box key={tool.key} sx={{ display: "flex", alignItems: "center" }}>
            {(index === 4 || index === 7) && (
              <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            )}
            <Tooltip title={t(`layers.featureInfo.tool.${tool.key}` as never)}>
              <IconButton
                size="small"
                aria-label={t(`layers.featureInfo.tool.${tool.key}` as never)}
                onClick={() => runTool(tool.key)}
              >
                {tool.icon}
              </IconButton>
            </Tooltip>
          </Box>
        ))}
        <FeatureInfoSyntaxHelp onInsertFilter={(snippet) => replaceSelection(
          () => snippet,
          (inserted) => [inserted.length, inserted.length],
        )} />
      </Box>
      <Divider />
      <TextField
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputRef={inputRef}
        multiline
        fullWidth
        minRows={18}
        placeholder={t("layers.featureInfo.editorPlaceholder")}
        slotProps={{
          htmlInput: {
            spellCheck: false,
            "aria-label": t("layers.infobox"),
          },
        }}
        sx={{
          flex: 1,
          "& .MuiOutlinedInput-notchedOutline": { border: 0 },
          "& textarea": {
            fontFamily: "monospace",
            fontSize: "0.85rem",
            lineHeight: 1.5,
          },
        }}
      />
    </Box>
  );
}
