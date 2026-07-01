import { useEffect, useRef, useState } from "react";
import useAppStateStore from "@/store/use-app-state-store";
import { useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import {
  Box,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  Launch,
  Description,
  Map,
  Image as ImageIcon,
  Videocam,
  MusicNote,
  WebAsset,
  FormatQuote,
  Spellcheck,
  ModeCommentOutlined,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { applyEditorSpellcheck } from "./spellcheck-preference";
import { LinkDialog } from "./dialogs/link-dialog";
import {
  AudioDialog,
  ImageDialog,
  VideoDialog,
} from "./dialogs/media-dialog";
import { TextSectionDialog } from "./dialogs/text-section-dialog";
import { IframeDialog } from "./dialogs/iframe-dialog";
import type { HajkLinkAttrs, HajkLinkType } from "./extensions/hajk-link";
import type { MediaFigureAttrs, MediaType } from "./extensions/media-figure";
import type { TextSectionAttrs } from "./extensions/text-section";
import type { IframeEmbedAttrs } from "./extensions/iframe-embed";
import {
  getInlineContentFromRange,
  hasMeaningfulInlineContent,
} from "./text-section-selection";

interface ToolbarProps {
  editor: Editor;
  imageList?: string[];
  videoList?: string[];
  audioList?: string[];
  toolId?: number;
}

interface ToolbarBtnProps {
  title: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

function Btn({ title, onClick, active, disabled, children }: ToolbarBtnProps) {
  return (
    <Tooltip title={title}>
      <span>
        <IconButton
          size="small"
          onClick={onClick}
          disabled={disabled}
          sx={{
            borderRadius: 0.5,
            bgcolor: active ? "action.selected" : undefined,
            "&:hover": { bgcolor: active ? "action.focus" : "action.hover" },
            color: active ? "primary.main" : "text.primary",
          }}
        >
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

export function RichTextToolbar({
  editor,
  imageList,
  videoList,
  audioList,
  toolId,
}: ToolbarProps) {
  const { t, i18n } = useTranslation();
  const spellcheckEnabled = useAppStateStore((s) => s.editorSpellcheckEnabled);
  const setEditorSpellcheckEnabled = useAppStateStore(
    (s) => s.setEditorSpellcheckEnabled
  );

  useEffect(() => {
    applyEditorSpellcheck(editor, spellcheckEnabled, i18n.language);
  }, [editor, spellcheckEnabled, i18n.language]);

  function toggleSpellcheck() {
    const next = !spellcheckEnabled;
    setEditorSpellcheckEnabled(next);
    applyEditorSpellcheck(editor, next, i18n.language);
  }

  // Subscribe to editor transactions so active-state checks re-run on every
  // selection/content change (editor.isActive() is not reactive by itself).
  const activeState = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      hajkLink: e.isActive("hajkLink"),
      textSection: e.isActive("textSection"),
      selectionEmpty: e.state.selection.empty,
    }),
  });

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkDialogKey, setLinkDialogKey] = useState(0);
  const [linkDialogIsEdit, setLinkDialogIsEdit] = useState(false);
  const [pendingLinkType, setPendingLinkType] = useState<HajkLinkType>("web");
  const savedLinkSelectionRef = useRef<{ from: number; to: number } | null>(
    null
  );
  const [textSectionDialogOpen, setTextSectionDialogOpen] = useState(false);
  const [textSectionDialogKey, setTextSectionDialogKey] = useState(0);
  const [textSectionDialogIsEdit, setTextSectionDialogIsEdit] = useState(false);
  const savedTextSectionSelectionRef = useRef<{
    from: number;
    to: number;
  } | null>(null);
  const [mediaDialogOpen, setMediaDialogOpen] = useState(false);
  const [mediaDialogKey, setMediaDialogKey] = useState(0);
  const [pendingMediaType, setPendingMediaType] = useState<MediaType>("image");

  // ── Link handling ─────────────────────────────────────────────────────────

  function openLinkDialog(type: HajkLinkType) {
    const isEdit =
      editor.isActive("hajkLink") &&
      editor.getAttributes("hajkLink").linkType === type;

    if (isEdit) {
      editor.chain().extendMarkRange("hajkLink").run();
      const { from, to } = editor.state.selection;
      savedLinkSelectionRef.current = { from, to };
    } else {
      const { from, to, empty } = editor.state.selection;
      savedLinkSelectionRef.current = empty ? null : { from, to };
    }

    setLinkDialogIsEdit(isEdit);
    setPendingLinkType(type);
    setLinkDialogKey((k) => k + 1);
    setLinkDialogOpen(true);
  }

  function getCurrentLinkAttrs(): Partial<HajkLinkAttrs> | undefined {
    if (!activeState?.hajkLink) return undefined;
    const mark = editor.getAttributes("hajkLink");
    if (!mark.linkType) return undefined;
    return mark as Partial<HajkLinkAttrs>;
  }

  function handleLinkConfirm(attrs: HajkLinkAttrs) {
    const saved = savedLinkSelectionRef.current;
    const chain = editor.chain().focus();
    if (saved) {
      chain.setTextSelection(saved);
    }
    if (linkDialogIsEdit) {
      chain.extendMarkRange("hajkLink");
    }
    chain.setMark("hajkLink", attrs).run();
    savedLinkSelectionRef.current = null;
    setLinkDialogOpen(false);
  }

  function handleLinkRemove() {
    const saved = savedLinkSelectionRef.current;
    const chain = editor.chain().focus();
    if (saved) {
      chain.setTextSelection(saved);
    }
    chain.extendMarkRange("hajkLink").unsetMark("hajkLink").run();
    savedLinkSelectionRef.current = null;
    setLinkDialogOpen(false);
  }

  // ── Media insertion ───────────────────────────────────────────────────────

  function openMediaDialog(type: MediaType) {
    setPendingMediaType(type);
    setMediaDialogKey((k) => k + 1);
    setMediaDialogOpen(true);
  }

  function handleMediaConfirm(attrs: MediaFigureAttrs) {
    editor
      .chain()
      .focus()
      .insertContent({
        type: "mediaFigure",
        attrs,
      })
      .run();
    setMediaDialogOpen(false);
  }

  const mediaDialogProps = {
    open: mediaDialogOpen,
    onConfirm: handleMediaConfirm,
    onCancel: () => setMediaDialogOpen(false),
  };

  // ── Iframe insertion ──────────────────────────────────────────────────────

  const [iframeDialogOpen, setIframeDialogOpen] = useState(false);
  const [iframeDialogKey, setIframeDialogKey] = useState(0);

  function handleIframeInsert() {
    setIframeDialogKey((k) => k + 1);
    setIframeDialogOpen(true);
  }

  function handleIframeConfirm(attrs: IframeEmbedAttrs) {
    editor
      .chain()
      .focus()
      .insertContent({ type: "iframeEmbed", attrs })
      .run();
    setIframeDialogOpen(false);
  }

  // ── Text section ──────────────────────────────────────────────────────────

  function openTextSectionDialog() {
    const { from, to } = editor.state.selection;
    savedTextSectionSelectionRef.current = { from, to };
    setTextSectionDialogIsEdit(editor.isActive("textSection"));
    setTextSectionDialogKey((k) => k + 1);
    setTextSectionDialogOpen(true);
  }

  function handleTextSectionConfirm(attrs: TextSectionAttrs) {
    if (textSectionDialogIsEdit) {
      const saved = savedTextSectionSelectionRef.current;
      const chain = editor.chain().focus();
      if (saved) {
        chain.setTextSelection(saved);
      }
      chain.updateAttributes("textSection", attrs).run();
    } else {
      const saved = savedTextSectionSelectionRef.current;
      const selectedContent =
        saved && saved.from !== saved.to
          ? getInlineContentFromRange(editor, saved.from, saved.to)
          : [];

      const content = hasMeaningfulInlineContent(selectedContent)
        ? selectedContent
        : [
            {
              type: "text" as const,
              text: t("dhRichTextEditor.placeholder.textSection"),
            },
          ];

      const chain = editor.chain().focus();
      if (saved && saved.from !== saved.to) {
        chain.setTextSelection(saved);
      }
      chain
        .insertContent({
          type: "textSection",
          attrs,
          content,
        })
        .run();
    }
    savedTextSectionSelectionRef.current = null;
    setTextSectionDialogOpen(false);
  }

  function handleTextSectionRemove() {
    const saved = savedTextSectionSelectionRef.current;
    const chain = editor.chain().focus();
    if (saved) {
      chain.setTextSelection(saved);
    }
    chain.unwrapTextSection().run();
    savedTextSectionSelectionRef.current = null;
    setTextSectionDialogOpen(false);
  }

  const isLinkActive = activeState?.hajkLink ?? false;
  const currentLink = getCurrentLinkAttrs();
  const currentLinkType = currentLink?.linkType;

  function canUseLinkType(type: HajkLinkType): boolean {
    if (isLinkActive) return currentLinkType === type;
    return !(activeState?.selectionEmpty ?? true);
  }

  const LINK_TOOLBAR_TITLE_KEYS: Record<
    HajkLinkType,
    { insert: string; edit: string }
  > = {
    web: {
      insert: "dhRichTextEditor.toolbar.insertWebLink",
      edit: "dhRichTextEditor.toolbar.editWebLink",
    },
    document: {
      insert: "dhRichTextEditor.toolbar.insertDocumentLink",
      edit: "dhRichTextEditor.toolbar.editDocumentLink",
    },
    map: {
      insert: "dhRichTextEditor.toolbar.insertMapLink",
      edit: "dhRichTextEditor.toolbar.editMapLink",
    },
    hover: {
      insert: "dhRichTextEditor.toolbar.insertTooltip",
      edit: "dhRichTextEditor.toolbar.editTooltip",
    },
  };

  function linkButtonTitle(type: HajkLinkType): string {
    const isActive = isLinkActive && currentLinkType === type;
    const keys = LINK_TOOLBAR_TITLE_KEYS[type];
    return t(isActive ? keys.edit : keys.insert);
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 0.25,
          px: 0.5,
          py: 0.25,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        {/* ── Text formatting ── */}
        <Btn
          title={t("dhRichTextEditor.toolbar.bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={activeState?.bold}
        >
          <FormatBold fontSize="small" />
        </Btn>
        <Btn
          title={t("dhRichTextEditor.toolbar.italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={activeState?.italic}
        >
          <FormatItalic fontSize="small" />
        </Btn>
        <Btn
          title={t("dhRichTextEditor.toolbar.underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={activeState?.underline}
        >
          <FormatUnderlined fontSize="small" />
        </Btn>
        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* ── Lists ── */}
        <Btn
          title={t("dhRichTextEditor.toolbar.bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={activeState?.bulletList}
        >
          <FormatListBulleted fontSize="small" />
        </Btn>
        <Btn
          title={t("dhRichTextEditor.toolbar.orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={activeState?.orderedList}
        >
          <FormatListNumbered fontSize="small" />
        </Btn>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* ── Links ── */}
        <Btn
          title={linkButtonTitle("web")}
          onClick={() => openLinkDialog("web")}
          active={isLinkActive && currentLinkType === "web"}
          disabled={!canUseLinkType("web")}
        >
          <Launch fontSize="small" />
        </Btn>
        <Btn
          title={linkButtonTitle("document")}
          onClick={() => openLinkDialog("document")}
          active={isLinkActive && currentLinkType === "document"}
          disabled={!canUseLinkType("document")}
        >
          <Description fontSize="small" />
        </Btn>
        <Btn
          title={linkButtonTitle("map")}
          onClick={() => openLinkDialog("map")}
          active={isLinkActive && currentLinkType === "map"}
          disabled={!canUseLinkType("map")}
        >
          <Map fontSize="small" />
        </Btn>
        <Btn
          title={linkButtonTitle("hover")}
          onClick={() => openLinkDialog("hover")}
          active={isLinkActive && currentLinkType === "hover"}
          disabled={!canUseLinkType("hover")}
        >
          <ModeCommentOutlined fontSize="small" />
        </Btn>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* ── Media ── */}
        <Btn
          title={t("dhRichTextEditor.toolbar.insertImage")}
          onClick={() => openMediaDialog("image")}
        >
          <ImageIcon fontSize="small" />
        </Btn>
        <Btn
          title={t("dhRichTextEditor.toolbar.insertVideo")}
          onClick={() => openMediaDialog("video")}
        >
          <Videocam fontSize="small" />
        </Btn>
        <Btn
          title={t("dhRichTextEditor.toolbar.insertAudio")}
          onClick={() => openMediaDialog("audio")}
        >
          <MusicNote fontSize="small" />
        </Btn>
        <Btn
          title={t("dhRichTextEditor.toolbar.insertIframe")}
          onClick={handleIframeInsert}
        >
          <WebAsset fontSize="small" />
        </Btn>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* ── Text section (faktaruta) ── */}
        <Btn
          title={t("dhRichTextEditor.toolbar.textSection")}
          onClick={openTextSectionDialog}
          active={activeState?.textSection}
        >
          <FormatQuote fontSize="small" />
        </Btn>

        <Box sx={{ ml: "auto" }}>
          <Btn
            title={
              spellcheckEnabled
                ? t("dhRichTextEditor.toolbar.spellcheckOff")
                : t("dhRichTextEditor.toolbar.spellcheckOn")
            }
            onClick={toggleSpellcheck}
            active={spellcheckEnabled}
          >
            <Spellcheck fontSize="small" />
          </Btn>
        </Box>
      </Box>

      {/* ── Dialogs ── */}
      <LinkDialog
        key={`link-${pendingLinkType}-${linkDialogKey}`}
        open={linkDialogOpen}
        linkType={pendingLinkType}
        initial={currentLink}
        toolId={toolId}
        onConfirm={handleLinkConfirm}
        onCancel={() => setLinkDialogOpen(false)}
        onRemove={linkDialogIsEdit ? handleLinkRemove : undefined}
      />

      <TextSectionDialog
        key={`textsection-${textSectionDialogKey}`}
        open={textSectionDialogOpen}
        initial={
          activeState?.textSection
            ? (editor.getAttributes("textSection") as Partial<TextSectionAttrs>)
            : undefined
        }
        onConfirm={handleTextSectionConfirm}
        onCancel={() => setTextSectionDialogOpen(false)}
        onRemove={
          textSectionDialogIsEdit ? handleTextSectionRemove : undefined
        }
      />

      {pendingMediaType === "image" && (
        <ImageDialog key={`image-${mediaDialogKey}`} {...mediaDialogProps} srcList={imageList} />
      )}
      {pendingMediaType === "video" && (
        <VideoDialog key={`video-${mediaDialogKey}`} {...mediaDialogProps} srcList={videoList} />
      )}
      {pendingMediaType === "audio" && (
        <AudioDialog key={`audio-${mediaDialogKey}`} {...mediaDialogProps} srcList={audioList} />
      )}

      <IframeDialog
        key={`iframe-${iframeDialogKey}`}
        open={iframeDialogOpen}
        onConfirm={handleIframeConfirm}
        onCancel={() => setIframeDialogOpen(false)}
      />
    </>
  );
}
