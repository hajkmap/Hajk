import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  TextField,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import useAppStateStore from "../../../store/use-app-state-store";
import {
  DEFAULT_GROUP_DISPLAY_SETTINGS,
  type GroupFormValues,
} from "../types";

interface GroupFormDialogProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: GroupFormValues;
  onClose: () => void;
  onSubmit: (values: GroupFormValues) => void;
  isSubmitting?: boolean;
}

export default function GroupFormDialog({
  open,
  mode,
  initialValues,
  onClose,
  onSubmit,
  isSubmitting = false,
}: GroupFormDialogProps) {
  const { t } = useTranslation();
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");
  const [values, setValues] = useState<GroupFormValues>(
    initialValues ?? {
      name: "",
      ...DEFAULT_GROUP_DISPLAY_SETTINGS,
    },
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setValues(
      initialValues ?? {
        name: "",
        ...DEFAULT_GROUP_DISPLAY_SETTINGS,
      },
    );
  }, [initialValues, open]);

  const updateMetadata = (
    field: keyof GroupFormValues["metadata"],
    value: string,
  ) => {
    setValues((current) => ({
      ...current,
      metadata: {
        ...current.metadata,
        [field]: value,
      },
    }));
  };

  const handleSubmit = () => {
    const trimmedName = values.name.trim();
    if (!trimmedName) {
      return;
    }

    onSubmit({
      ...values,
      name: trimmedName,
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotprops={{
        paper:{
          sx: {
            backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
          },
        }
      }}
    >
      <DialogTitle>
        {mode === "create"
          ? t("groups.dialog.title")
          : t("groupsDevelopment.editGroup")}
      </DialogTitle>
      <DialogContent>
        <TextField
          label={t("common.name")}
          value={values.name}
          onChange={(event) =>
            setValues((current) => ({
              ...current,
              name: event.target.value,
            }))
          }
          fullWidth
          required
          size="small"
          sx={{ mt: 1, mb: 2 }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={values.toggled}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  toggled: event.target.checked,
                }))
              }
            />
          }
          label={t("map.groupToggleAll")}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={values.expanded}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  expanded: event.target.checked,
                }))
              }
            />
          }
          label={t("map.groupExpandedAtStart")}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={values.exclusiveGroup}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  exclusiveGroup: event.target.checked,
                }))
              }
            />
          }
          label={t("groupsDevelopment.exclusiveGroup")}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={values.infoDocument}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  infoDocument: event.target.checked,
                }))
              }
            />
          }
          label={t("groupsDevelopment.infoDocument")}
        />

        {values.infoDocument ? (
          <Box
            sx={{
              mt: 1.5,
              pl: 2,
              borderLeft: "2px solid",
              borderColor: "divider",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <TextField
              label={t("layers.metadata.title")}
              value={values.metadata.title}
              onChange={(event) => updateMetadata("title", event.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label={t("layers.metadata.description")}
              value={values.metadata.description}
              onChange={(event) =>
                updateMetadata("description", event.target.value)
              }
              fullWidth
              size="small"
              multiline
              minRows={3}
            />
            <TextField
              label={t("layers.metadata.url")}
              value={values.metadata.url}
              onChange={(event) => updateMetadata("url", event.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label={t("layers.metadata.urlTitle")}
              value={values.metadata.urlTitle}
              onChange={(event) => updateMetadata("urlTitle", event.target.value)}
              fullWidth
              size="small"
            />
            <TextField
              label={t("groupsDevelopment.metadata.urlOpenData")}
              value={values.metadata.urlOpenData}
              onChange={(event) =>
                updateMetadata("urlOpenData", event.target.value)
              }
              fullWidth
              size="small"
            />
            <TextField
              label={t("layers.metadata.owner")}
              value={values.metadata.owner}
              onChange={(event) => updateMetadata("owner", event.target.value)}
              fullWidth
              size="small"
            />
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          {t("common.cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting || !values.name.trim()}
        >
          {mode === "create" ? t("common.add") : t("common.dialog.okBtn")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
