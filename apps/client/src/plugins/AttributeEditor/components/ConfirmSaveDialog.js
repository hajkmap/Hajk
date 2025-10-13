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
  Tooltip,
  CircularProgress,
} from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

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
  title = "Spara ändringar",
  body = "Det finns osparade ändringar. Vill du spara nu?",
  primaryLabel = "Spara",
  discardLabel = "Kassera",
}) {
  const { adds = 0, edits = 0, deletes = 0 } = summary;

  const handleClose = (_e, reason) => {
    if (saving && (reason === "backdropClick" || reason === "escapeKeyDown"))
      return;
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      TransitionComponent={Transition}
      fullWidth
      maxWidth="sm"
      keepMounted
      disableEscapeKeyDown={saving}
      PaperProps={{
        sx: (theme) => ({
          borderRadius: 2.5,
          overflow: "hidden",
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: 12,
        }),
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
          aria-label="Stäng"
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

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip
              icon={<AddCircleOutlineRoundedIcon />}
              label={`Utkast: ${adds}`}
              color={adds ? "success" : "default"}
              variant="outlined"
              size="medium"
              sx={{
                flex: 1,
                minWidth: 0,
                ...(adds && {
                  bgcolor: "success.50",
                  borderWidth: 2,
                }),
              }}
            />
            <Chip
              icon={<EditNoteRoundedIcon />}
              label={`Ändringar: ${edits}`}
              color={edits ? "warning" : "default"}
              variant="outlined"
              size="medium"
              sx={{
                flex: 1,
                minWidth: 0,
                ...(edits && {
                  bgcolor: "warning.50",
                  borderWidth: 2,
                }),
              }}
            />
            <Chip
              icon={<DeleteOutlineRoundedIcon />}
              label={`Raderingar: ${deletes}`}
              color={deletes ? "error" : "default"}
              variant="outlined"
              size="medium"
              sx={{
                flex: 1,
                minWidth: 0,
                ...(deletes && {
                  bgcolor: "error.50",
                  borderWidth: 2,
                }),
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

      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={handleClose} disabled={saving}>
          Avbryt
        </Button>

        {onDiscard && (
          <Tooltip title="Ignorera osparade ändringar">
            <span>
              <Button
                onClick={onDiscard}
                variant="outlined"
                color="error"
                disabled={saving}
              >
                {discardLabel}
              </Button>
            </span>
          </Tooltip>
        )}

        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} /> : null}
          sx={{ minWidth: 140 }}
        >
          {saving ? "Sparar…" : primaryLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
