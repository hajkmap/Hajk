import { Button, TextField } from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import DialogWrapper from "../flexible-dialog";

interface LayerTreeNewGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}

/** Names a group made in the tree; it is created when the page is saved. */
export default function LayerTreeNewGroupDialog({
  open,
  onClose,
  onAdd,
}: LayerTreeNewGroupDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const trimmed = name.trim();

  const close = () => {
    setName("");
    onClose();
  };
  const add = () => {
    if (!trimmed) return;
    setName("");
    onAdd(trimmed);
  };

  return (
    <DialogWrapper
      open={open}
      title={t("layerTree.newGroup")}
      onClose={close}
      fullWidth
      maxWidth="xs"
      actions={
        <>
          <Button onClick={close}>{t("common.cancel")}</Button>
          <Button variant="contained" disabled={!trimmed} onClick={add}>
            {t("common.add")}
          </Button>
        </>
      }
    >
      <TextField
        autoFocus
        fullWidth
        margin="dense"
        label={t("common.name")}
        value={name}
        helperText={t("layerTree.newGroupHint")}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          event.stopPropagation();
          add();
        }}
      />
    </DialogWrapper>
  );
}
