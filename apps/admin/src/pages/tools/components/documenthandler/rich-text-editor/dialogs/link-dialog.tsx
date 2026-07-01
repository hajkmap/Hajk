import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import {
  useFolders,
  useDocuments,
  useDocument,
  useResolveDocumentFolder,
} from "@/api/documents";
import type { HajkLinkAttrs, HajkLinkType } from "../extensions/hajk-link";

interface LinkDialogProps {
  open: boolean;
  linkType: HajkLinkType;
  initial?: Partial<HajkLinkAttrs>;
  toolId?: number;
  onConfirm: (attrs: HajkLinkAttrs) => void;
  onCancel: () => void;
  onRemove?: () => void;
}

const INSERT_TITLE_KEYS: Record<HajkLinkType, string> = {
  web: "dhRichTextEditor.link.insertWebTitle",
  document: "dhRichTextEditor.link.insertDocumentTitle",
  map: "dhRichTextEditor.link.insertMapTitle",
  hover: "dhRichTextEditor.link.insertTooltipTitle",
};

const EDIT_TITLE_KEYS: Record<HajkLinkType, string> = {
  web: "dhRichTextEditor.link.editWebTitle",
  document: "dhRichTextEditor.link.editDocumentTitle",
  map: "dhRichTextEditor.link.editMapTitle",
  hover: "dhRichTextEditor.link.editTooltipTitle",
};

interface TopLevelChapter {
  header: string;
  headerIdentifier: string;
}

function getTopLevelChapters(
  content: Record<string, unknown> | undefined
): TopLevelChapter[] {
  if (!content) return [];
  const raw = content.chapters;
  if (!Array.isArray(raw)) return [];
  return raw as TopLevelChapter[];
}

export function LinkDialog({
  open,
  linkType,
  initial,
  toolId,
  onConfirm,
  onCancel,
  onRemove,
}: LinkDialogProps) {
  const { t } = useTranslation();
  const [href, setHref] = useState(initial?.href ?? "");
  const [folderName, setFolderName] = useState("");
  const [documentName, setDocumentName] = useState(
    initial?.documentName ?? ""
  );
  const [headerIdentifier, setHeaderIdentifier] = useState(
    initial?.headerIdentifier ?? ""
  );
  const [maplink, setMaplink] = useState(initial?.maplink ?? "");
  const [hoverText, setHoverText] = useState(initial?.hoverText ?? "");

  const { data: folders = [] } = useFolders(toolId);
  const { effectiveFolder, isResolving } = useResolveDocumentFolder(
    toolId,
    documentName,
    folderName,
    folders
  );
  const activeFolderName = useMemo(() => {
    if (folderName) return folderName;
    if (folders.length === 1) return folders[0].name;
    if (initial?.documentName?.trim() && effectiveFolder) {
      return effectiveFolder;
    }
    return "";
  }, [folderName, folders, initial?.documentName, effectiveFolder]);

  const { data: documents = [], isLoading: docsLoading } = useDocuments(
    toolId,
    activeFolderName || undefined
  );
  const { data: selectedDoc, isLoading: docLoading } = useDocument(
    toolId,
    activeFolderName || undefined,
    documentName || undefined
  );

  const chapters = useMemo(
    () => getTopLevelChapters(selectedDoc?.content),
    [selectedDoc?.content]
  );

  const documentInList = documents.some((doc) => doc.name === documentName);
  const chapterInList = chapters.some(
    (ch) => ch.headerIdentifier === headerIdentifier
  );

  function handleConfirm() {
    onConfirm({
      linkType,
      href,
      documentName,
      headerIdentifier,
      maplink,
      hoverText,
    });
  }

  function isValid(): boolean {
    switch (linkType) {
      case "web":
        return href.trim().length > 0;
      case "document":
        return (
          activeFolderName.trim().length > 0 &&
          documentName.trim().length > 0
        );
      case "map":
        return maplink.trim().length > 0;
      case "hover":
        return hoverText.trim().length > 0;
    }
  }

  const isEditing = Boolean(initial?.linkType);
  const titleKey = isEditing
    ? EDIT_TITLE_KEYS[linkType]
    : INSERT_TITLE_KEYS[linkType];

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{t(titleKey)}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          {linkType === "web" && (
            <TextField
              autoFocus
              label={t("dhRichTextEditor.link.url")}
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder={t("dhRichTextEditor.link.urlPlaceholder")}
              size="small"
              fullWidth
            />
          )}

          {linkType === "document" && (
            <>
              {toolId === undefined ? (
                <Typography variant="body2" color="text.secondary">
                  {t("dhRichTextEditor.link.noMapContext")}
                </Typography>
              ) : (
                <>
                  {folders.length > 0 ? (
                    <FormControl
                      size="small"
                      fullWidth
                      disabled={isResolving}
                    >
                      <InputLabel>
                        {t("dhRichTextEditor.link.folder")}
                      </InputLabel>
                      <Select
                        autoFocus
                        label={t("dhRichTextEditor.link.folder")}
                        value={activeFolderName}
                        onChange={(e) => {
                          setFolderName(e.target.value);
                          setDocumentName("");
                          setHeaderIdentifier("");
                        }}
                      >
                        <MenuItem value="">
                          <em>{t("dhRichTextEditor.link.noFolder")}</em>
                        </MenuItem>
                        {folders.map((folder) => (
                          <MenuItem key={folder.name} value={folder.name}>
                            {folder.title || folder.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      {t("tools.documenthandler.documents.noFolders")}
                    </Typography>
                  )}

                  <FormControl
                    size="small"
                    fullWidth
                    disabled={!activeFolderName || isResolving || docsLoading}
                  >
                    <InputLabel>
                      {t("dhRichTextEditor.link.document")}
                    </InputLabel>
                    <Select
                      label={t("dhRichTextEditor.link.document")}
                      value={documentName}
                      onChange={(e) => {
                        setDocumentName(e.target.value);
                        setHeaderIdentifier("");
                      }}
                    >
                      <MenuItem value="">
                        <em>{t("dhRichTextEditor.link.noDocument")}</em>
                      </MenuItem>
                      {documents.map((doc) => (
                        <MenuItem key={doc.name} value={doc.name}>
                          {doc.title ? `${doc.title} (${doc.name})` : doc.name}
                        </MenuItem>
                      ))}
                      {documentName && !documentInList && (
                        <MenuItem value={documentName}>
                          {documentName}
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>

                  <FormControl
                    size="small"
                    fullWidth
                    disabled={!documentName || docLoading}
                  >
                    <InputLabel>
                      {t("dhRichTextEditor.link.chapterId")}
                    </InputLabel>
                    <Select
                      label={t("dhRichTextEditor.link.chapterId")}
                      value={headerIdentifier}
                      onChange={(e) => setHeaderIdentifier(e.target.value)}
                    >
                      <MenuItem value="">
                        <em>{t("dhRichTextEditor.link.noChapter")}</em>
                      </MenuItem>
                      {chapters.map((ch) => (
                        <MenuItem
                          key={ch.headerIdentifier}
                          value={ch.headerIdentifier}
                        >
                          {ch.header || ch.headerIdentifier}
                        </MenuItem>
                      ))}
                      {headerIdentifier && !chapterInList && (
                        <MenuItem value={headerIdentifier}>
                          {headerIdentifier}
                        </MenuItem>
                      )}
                    </Select>
                    <FormHelperText>
                      {t("dhRichTextEditor.link.chapterIdHelper")}
                    </FormHelperText>
                  </FormControl>
                </>
              )}
            </>
          )}

          {linkType === "map" && (
            <TextField
              autoFocus
              label={t("dhRichTextEditor.link.mapLink")}
              value={maplink}
              onChange={(e) => setMaplink(e.target.value)}
              placeholder={t("dhRichTextEditor.link.urlPlaceholder")}
              size="small"
              fullWidth
              helperText={t("dhRichTextEditor.link.mapLinkHelper")}
            />
          )}

          {linkType === "hover" && (
            <TextField
              autoFocus
              label={t("dhRichTextEditor.link.tooltipText")}
              value={hoverText}
              onChange={(e) => setHoverText(e.target.value)}
              placeholder={t("dhRichTextEditor.link.tooltipPlaceholder")}
              size="small"
              fullWidth
              helperText={t("dhRichTextEditor.link.tooltipHelper")}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {onRemove && (
          <Button color="error" onClick={onRemove} sx={{ mr: "auto" }}>
            {t("dhRichTextEditor.link.remove")}
          </Button>
        )}
        <Button onClick={onCancel}>{t("common.cancel")}</Button>
        <Button variant="contained" onClick={handleConfirm} disabled={!isValid()}>
          {t("common.dialog.okBtn")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
