import { FormEventHandler } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit?: FormEventHandler<HTMLFormElement>;
  children: React.ReactNode;
  actions?: React.ReactNode;
  fullWidth?: boolean;
}

const DialogWrapper = ({
  open,
  title,
  onClose,
  onSubmit,
  children,
  actions,
  fullWidth,
}: DialogProps) => (
  <Dialog fullWidth={fullWidth} open={open} onClose={onClose}>
    <DialogTitle>{title}</DialogTitle>

    {onSubmit ? (
      <form onSubmit={onSubmit}>
        <DialogContent>{children}</DialogContent>
        <DialogActions>{actions}</DialogActions>
      </form>
    ) : (
      <>
        <DialogContent>{children}</DialogContent>
        <DialogActions>{actions}</DialogActions>
      </>
    )}
  </Dialog>
);

export default DialogWrapper;
