import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Divider,
  Chip,
  Slide,
} from "@mui/material";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

/**
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onSaveAndSwitch: () => void
 * - onDiscardAndSwitch?: () => void   // optional, discard and switch tabs if set
 * - summary?: { adds?: number, edits?: number, deletes?: number }
 * - nextLabel?: string                 // next tab label
 */
export default function UnsavedChangesDialog({
  open,
  onClose,
  onSaveAndSwitch,
  onDiscardAndSwitch,
  summary = {},
  nextLabel,
}) {
  const { adds = 0, edits = 0, deletes = 0 } = summary;

  const showDiscard = typeof onDiscardAndSwitch === "function";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      TransitionComponent={Transition}
      aria-labelledby="unsaved-title"
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle id="unsaved-title">Osparade ändringar</DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant="body1">
            Du är på väg att byta redigeringstjänst
            {nextLabel ? (
              <>
                {" "}
                till <strong>{nextLabel}</strong>
              </>
            ) : null}
            . Det finns osparade ändringar. Vad vill du göra?
          </Typography>

          <Divider />

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip label={`Utkast: ${adds}`} />
            <Chip label={`Redigeringar: ${edits}`} />
            <Chip label={`Raderingar: ${deletes}`} />
          </Stack>

          <Typography variant="body2" color="text.secondary">
            • <strong>Spara & byt</strong> skickar dina buffrade ändringar och
            byter sedan tjänst. <br />
            {showDiscard ? "• " : ""}
            {showDiscard ? (
              <>
                <strong>Kassera & byt</strong> förkastar pågående ändringar och
                byter tjänst.
              </>
            ) : null}
          </Typography>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Avbryt</Button>
        {showDiscard && (
          <Button onClick={onDiscardAndSwitch} variant="outlined">
            Kassera &amp; byt
          </Button>
        )}
        <Button onClick={onSaveAndSwitch} variant="contained">
          Spara &amp; byt
        </Button>
      </DialogActions>
    </Dialog>
  );
}
