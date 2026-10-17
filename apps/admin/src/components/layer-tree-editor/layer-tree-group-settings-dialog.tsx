import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  TextField,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import type { MapInfoGroup } from "../../api/layer-tree";
import DialogWrapper from "../flexible-dialog";
import type { GroupSettingsValues } from "./layer-tree-settings";

interface LayerTreeGroupSettingsDialogProps {
  /** The group's own name, shown when the map has none of its own. */
  groupName: string;
  values: GroupSettingsValues;
  onClose: () => void;
  onSave: (values: GroupSettingsValues) => void;
}

const INFO_FIELDS: {
  field: Exclude<keyof MapInfoGroup, "visible">;
  label: string;
  multiline?: boolean;
}[] = [
  { field: "title", label: "layers.metadata.title" },
  { field: "text", label: "layers.metadata.description", multiline: true },
  { field: "url", label: "layers.metadata.url" },
  { field: "urlText", label: "layers.metadata.urlTitle" },
  { field: "openDataLink", label: "layerTree.settings.openDataLink" },
  { field: "owner", label: "layers.metadata.owner" },
];

/**
 * A group's settings on this map, as Lagerordning's group form: its name
 * here, how it shows in the layerswitcher, and its info document. Open it
 * with a `key` per group, so it starts from that group's values.
 */
export default function LayerTreeGroupSettingsDialog({
  groupName,
  values: initial,
  onClose,
  onSave,
}: LayerTreeGroupSettingsDialogProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<GroupSettingsValues>(initial);
  const [name, setName] = useState(initial.name ?? "");

  const set = (changes: Partial<GroupSettingsValues>) =>
    setValues((current) => ({ ...current, ...changes }));
  const setInfo = (changes: Partial<MapInfoGroup>) =>
    setValues((current) => ({
      ...current,
      infoGroup: { ...current.infoGroup, ...changes },
    }));
  const save = () => {
    const trimmed = name.trim();
    onSave({
      ...values,
      // The group's own name, or none, means: show the group's name.
      name: trimmed && trimmed !== groupName ? trimmed : null,
      // An exclusive group has no button for all its layers.
      toggled: values.exclusive ? false : values.toggled,
    });
  };

  return (
    <DialogWrapper
      open
      title={t("layerTree.settings.groupTitle", { name: groupName })}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      actions={
        <>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
          <Button variant="contained" onClick={save}>
            {t("common.dialog.okBtn")}
          </Button>
        </>
      }
    >
      <TextField
        autoFocus
        fullWidth
        margin="dense"
        label={t("layerTree.settings.name")}
        placeholder={groupName}
        value={name}
        helperText={t("layerTree.settings.nameHelp", { name: groupName })}
        onChange={(event) => setName(event.target.value)}
        sx={{ mb: 1 }}
      />
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={values.exclusive ? false : values.toggled}
              disabled={values.exclusive}
              onChange={(event) => set({ toggled: event.target.checked })}
            />
          }
          label={t("layerTree.settings.toggled")}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={values.expanded}
              onChange={(event) => set({ expanded: event.target.checked })}
            />
          }
          label={t("layerTree.settings.expanded")}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={values.exclusive}
              onChange={(event) => set({ exclusive: event.target.checked })}
            />
          }
          label={t("layerTree.settings.exclusive")}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={values.infoGroup.visible}
              onChange={(event) => setInfo({ visible: event.target.checked })}
            />
          }
          label={t("layerTree.settings.infoGroup")}
        />
      </Box>
      {values.infoGroup.visible ? (
        <Box
          sx={{
            mt: 1.5,
            pl: 2,
            borderLeft: 2,
            borderColor: "divider",
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          {INFO_FIELDS.map(({ field, label, multiline }) => (
            <TextField
              key={field}
              fullWidth
              size="small"
              label={t(label)}
              value={values.infoGroup[field]}
              multiline={multiline}
              minRows={multiline ? 3 : undefined}
              onChange={(event) => setInfo({ [field]: event.target.value })}
            />
          ))}
        </Box>
      ) : null}
    </DialogWrapper>
  );
}
