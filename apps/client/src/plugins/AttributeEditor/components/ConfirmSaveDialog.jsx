import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Button,
  Stack,
  Typography,
  Divider,
  Chip,
  Slide,
  LinearProgress,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Trans } from "react-i18next";
import i18n from "src/i18n";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ConfirmSaveDialog({
  open,
  onClose,
  onConfirm,
  onDiscard,
  summary = {},
  saving = false,
  error = null,
  title = i18n.t("attributeEditor.dialog.saveTitle"),
  body = i18n.t("attributeEditor.dialog.saveBody"),
  primaryLabel = i18n.t("common.save"),
}) {
  const { adds = 0, edits = 0, deletes = 0 } = summary;
  const [discardConfirmOpen, setDiscardConfirmOpen] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleClose = (_e, reason) => {
    if (saving && (reason === "backdropClick" || reason === "escapeKeyDown"))
      return;
    onClose?.();
  };

  const handleConfirmDiscard = () => {
    setDiscardConfirmOpen(false);
    onDiscard?.();
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      fullScreen={isMobile}
      keepMounted
      slots={{ transition: Transition }}
      slotProps={{
        paper: {
          sx: (theme) => ({
            borderRadius: isMobile ? 0 : 2.5,
            overflow: "hidden",
            border: isMobile ? "none" : `1px solid ${theme.palette.divider}`,
            boxShadow: 12,
            ...(isMobile && { margin: 0, maxHeight: "100%" }),
          }),
        },
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          gap: 1,
          fontWeight: 700,
          bgcolor: theme.palette.mode === "dark" ? "grey.900" : "grey.800",
          color: "common.white",
          py: 1.25,
        })}
      >
        <WarningAmberRoundedIcon fontSize="small" />
        {title}
        <span style={{ flex: 1 }} />
        <IconButton
          aria-label={i18n.t("common.close")}
          onClick={() => handleClose()}
          size="small"
          disabled={saving}
          sx={{ color: "common.white" }}
        >
          <CloseRoundedIcon />
        </IconButton>
      </DialogTitle>

      {saving && <LinearProgress />}

      <DialogContent dividers sx={{ py: 2.5 }}>
        <Stack spacing={2}>
          <Typography variant="body1">{body}</Typography>

          <Stack
            direction={isMobile ? "column" : "row"}
            spacing={1}
            useFlexGap
            sx={{ flexWrap: "wrap" }}
          >
            <Chip
              icon={<AddCircleOutlineRoundedIcon />}
              label={i18n.t("attributeEditor.dialog.added", { number: adds })}
              color={adds ? "success" : "default"}
              variant="outlined"
              size="medium"
              sx={{
                flex: 1,
                justifyContent: "flex-start",
                ...(adds && { bgcolor: "success.50", borderWidth: 2 }),
              }}
            />
            <Chip
              icon={<EditNoteRoundedIcon />}
              label={i18n.t("attributeEditor.dialog.edited", { number: edits })}
              color={edits ? "warning" : "default"}
              variant="outlined"
              size="medium"
              sx={{
                flex: 1,
                justifyContent: "flex-start",
                ...(edits && { bgcolor: "warning.50", borderWidth: 2 }),
              }}
            />
            <Chip
              icon={<DeleteOutlineRoundedIcon />}
              label={i18n.t("attributeEditor.dialog.deleted", {
                number: deletes,
              })}
              color={deletes ? "error" : "default"}
              variant="outlined"
              size="medium"
              sx={{
                flex: 1,
                justifyContent: "flex-start",
                ...(deletes && { bgcolor: "error.50", borderWidth: 2 }),
              }}
            />
          </Stack>

          <Divider />

          {error ? (
            <Typography variant="body2" color="error">
              {error}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2,
          py: 1.5,
          flexDirection: isMobile ? "column-reverse" : "row",
          gap: isMobile ? 1 : 0,
        }}
      >
        {onDiscard && (
          <Button
            onClick={() => setDiscardConfirmOpen(true)}
            variant="outlined"
            color="error"
            disabled={saving}
            fullWidth={isMobile}
          >
            {i18n.t("attributeEditor.dialog.discardAll")}
          </Button>
        )}

        {!isMobile && <span style={{ flex: 1 }} />}

        <Button
          onClick={handleClose}
          disabled={saving}
          fullWidth={isMobile}
          variant={isMobile ? "outlined" : "text"}
        >
          {i18n.t("common.cancel")}
        </Button>

        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} /> : null}
          fullWidth={isMobile}
          sx={{ minWidth: isMobile ? "auto" : 140 }}
        >
          {saving ? i18n.t("attributeEditor.saving") : primaryLabel}
        </Button>
      </DialogActions>

      <Dialog
        open={discardConfirmOpen}
        onClose={() => setDiscardConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            fontWeight: 700,
            bgcolor: "error.main",
            color: "common.white",
            py: 1.25,
          }}
        >
          <WarningAmberRoundedIcon fontSize="small" />
          {i18n.t("attributeEditor.dialog.discardAll")}
        </DialogTitle>
        <DialogContent sx={{ pt: 4, pb: 3, textAlign: "center" }}>
          <Typography variant="body1">
            <Trans
              i18nKey="attributeEditor.dialog.discardConfirm"
              components={{ br: <br /> }}
            />
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button
            onClick={() => setDiscardConfirmOpen(false)}
            variant="outlined"
          >
            {i18n.t("common.no").toUpperCase()}
          </Button>
          <Button
            onClick={handleConfirmDiscard}
            variant="contained"
            color="error"
            sx={{ color: "common.white" }}
          >
            {i18n.t("common.yes").toUpperCase()}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
}
