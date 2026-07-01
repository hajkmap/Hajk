import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import type { MediaFigureAttrs, MediaType } from "../extensions/media-figure";
import FilePickerDialog from "@/components/file-picker-dialog";

interface MediaDialogProps {
  open: boolean;
  mediaType: MediaType;
  initial?: Partial<MediaFigureAttrs>;
  srcList?: string[];
  onConfirm: (attrs: MediaFigureAttrs) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const POSITIONS = ["left", "center", "right", "floatLeft", "floatRight"] as const;

const INSERT_TITLE_KEYS: Record<MediaType, string> = {
  image: "dhRichTextEditor.media.insertImageTitle",
  video: "dhRichTextEditor.media.insertVideoTitle",
  audio: "dhRichTextEditor.media.insertAudioTitle",
};

const EDIT_TITLE_KEYS: Record<MediaType, string> = {
  image: "dhRichTextEditor.media.editImageTitle",
  video: "dhRichTextEditor.media.editVideoTitle",
  audio: "dhRichTextEditor.media.editAudioTitle",
};

function PositionField({
  position,
  onChange,
}: {
  position: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <FormControl>
      <FormLabel>
        <Typography variant="body2">
          {t("dhRichTextEditor.media.position")}
        </Typography>
      </FormLabel>
      <RadioGroup
        row
        value={position}
        onChange={(e) => onChange(e.target.value)}
      >
        {POSITIONS.map((val) => (
          <FormControlLabel
            key={val}
            value={val}
            control={<Radio size="small" />}
            label={t(`dhRichTextEditor.media.positions.${val}`)}
          />
        ))}
      </RadioGroup>
    </FormControl>
  );
}

function MediaDialog({
  open,
  mediaType,
  initial,
  srcList = [],
  onConfirm,
  onCancel,
  onDelete,
}: MediaDialogProps) {
  const { t } = useTranslation();
  const [src, setSrc] = useState(initial?.src ?? "");
  const [alt, setAlt] = useState(initial?.alt ?? "");
  const [width, setWidth] = useState<string>(
    initial?.width != null ? String(initial.width) : ""
  );
  const [height, setHeight] = useState<string>(
    initial?.height != null ? String(initial.height) : ""
  );
  const [caption, setCaption] = useState(initial?.caption ?? "");
  const [source, setSource] = useState(initial?.source ?? "");
  const [popup, setPopup] = useState(initial?.popup ?? false);
  const [position, setPosition] = useState(initial?.position ?? "left");
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const aspectRatio =
    initial?.width && initial?.height ? initial.width / initial.height : null;

  const filePickerFilter =
    mediaType === "image"
      ? ".png,.jpg,.jpeg,.gif,.webp,.svg,.bmp,.ico,.tif,.tiff,.avif"
      : mediaType === "video"
        ? ".mp4,.m4v,.webm,.ogv,.mov,.avi,.mkv"
        : ".mp3,.wav,.oga,.ogg,.m4a,.aac,.flac";

  const filePickerTitleKey =
    mediaType === "image" ? "dhRichTextEditor.media.selectImageTitle"
    : mediaType === "video" ? "dhRichTextEditor.media.selectVideoTitle"
    : "dhRichTextEditor.media.selectAudioTitle";

  function handleWidthChange(v: string) {
    setWidth(v);
    if (aspectRatio && v) {
      const w = parseInt(v, 10);
      if (!isNaN(w)) setHeight(String(Math.round(w / aspectRatio)));
    }
  }

  function handleHeightChange(v: string) {
    setHeight(v);
    if (aspectRatio && v) {
      const h = parseInt(v, 10);
      if (!isNaN(h)) setWidth(String(Math.round(h * aspectRatio)));
    }
  }

  function handleConfirm() {
    onConfirm({
      src,
      alt,
      mediaType,
      width:
        mediaType !== "audio" && width ? parseInt(width, 10) || null : null,
      height:
        mediaType !== "audio" && height ? parseInt(height, 10) || null : null,
      caption,
      source,
      popup: mediaType === "image" ? popup : false,
      position,
    });
  }

  const typeLabel = t(`dhRichTextEditor.media.types.${mediaType}`);
  const isEditing = Boolean(initial?.src);
  const titleKey = isEditing
    ? EDIT_TITLE_KEYS[mediaType]
    : INSERT_TITLE_KEYS[mediaType];

  function handleFilePickerSelect(fileUrl: string) {
    setSrc(fileUrl);
    setFilePickerOpen(false);
  }

  return (
    <>
    <Dialog open={open} onClose={onCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{t(titleKey)}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <TextField
            autoFocus
            label={
              mediaType === "audio"
                ? t("dhRichTextEditor.media.audioUrl")
                : t("dhRichTextEditor.media.srcUrl", { type: typeLabel })
            }
            value={src}
            onChange={(e) => setSrc(e.target.value)}
            placeholder={t("dhRichTextEditor.media.uploadPathPlaceholder")}
            size="small"
            fullWidth
            select={srcList.length > 0}
            slotProps={
              srcList.length === 0
                ? {
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setFilePickerOpen(true)}
                            sx={{ minWidth: 0, whiteSpace: "nowrap" }}
                          >
                            {t("dhRichTextEditor.media.browse")}
                          </Button>
                        </InputAdornment>
                      ),
                    },
                  }
                : undefined
            }
          >
            {srcList.length > 0 &&
              srcList.map((s) => (
                <MenuItem key={s} value={s}>
                  {s}
                </MenuItem>
              ))}
          </TextField>

          <TextField
            label={t("dhRichTextEditor.media.altText")}
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            size="small"
            fullWidth
          />

          {mediaType !== "audio" && (
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                label={t("dhRichTextEditor.media.width")}
                value={width}
                onChange={(e) => handleWidthChange(e.target.value)}
                type="number"
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField
                label={t("dhRichTextEditor.media.height")}
                value={height}
                onChange={(e) => handleHeightChange(e.target.value)}
                type="number"
                size="small"
                sx={{ flex: 1 }}
              />
            </Box>
          )}

          <TextField
            label={t("dhRichTextEditor.media.caption")}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            size="small"
            fullWidth
          />

          <TextField
            label={t("dhRichTextEditor.media.source")}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            size="small"
            fullWidth
          />

          {mediaType === "image" && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={popup}
                  onChange={(e) => setPopup(e.target.checked)}
                />
              }
              label={t("dhRichTextEditor.media.openInPopup")}
            />
          )}

          <PositionField position={position} onChange={setPosition} />
        </Box>
      </DialogContent>
      <DialogActions>
        {onDelete && (
          <Button color="error" onClick={onDelete} sx={{ mr: "auto" }}>
            {t("common.delete")}
          </Button>
        )}
        <Button onClick={onCancel}>{t("common.cancel")}</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!src.trim()}
        >
          {t("common.dialog.okBtn")}
        </Button>
      </DialogActions>
    </Dialog>

    <FilePickerDialog
      open={filePickerOpen}
      onClose={() => setFilePickerOpen(false)}
      onSelect={handleFilePickerSelect}
      filter={filePickerFilter}
      title={t(filePickerTitleKey)}
    />
    </>
  );
}

type TypedMediaDialogProps = Omit<MediaDialogProps, "mediaType">;

export function ImageDialog(props: TypedMediaDialogProps) {
  return <MediaDialog {...props} mediaType="image" />;
}

export function VideoDialog(props: TypedMediaDialogProps) {
  return <MediaDialog {...props} mediaType="video" />;
}

export function AudioDialog(props: TypedMediaDialogProps) {
  return <MediaDialog {...props} mediaType="audio" />;
}
