import { useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlined";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import type { Theme, ImportedThemeJson } from "../../../api/themes/types";
import {
  useCreateTheme,
  useDeleteTheme,
  useThemes,
  useUpdateTheme,
} from "../../../api/themes";
import DialogWrapper from "../../../components/flexible-dialog";
import { SquareSpinnerComponent } from "../../../components/progress/square-progress";

function validateImportedThemeJson(json: unknown): json is ImportedThemeJson {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    return false;
  }

  const payload = json as ImportedThemeJson;
  if (
    !payload.metadata ||
    typeof payload.metadata !== "object" ||
    Array.isArray(payload.metadata)
  ) {
    return false;
  }

  const requiredMetadataProps = [
    "savedAt",
    "numberOfLayers",
    "title",
    "description",
  ];
  if (
    !requiredMetadataProps.every((prop) =>
      Object.prototype.hasOwnProperty.call(payload.metadata, prop),
    )
  ) {
    return false;
  }

  if (!Array.isArray(payload.layers)) {
    return false;
  }

  const requiredLayerProps = [
    "id",
    "visible",
    "subLayers",
    "opacity",
    "drawOrder",
  ];
  return payload.layers.every(
    (layer) =>
      layer &&
      typeof layer === "object" &&
      !Array.isArray(layer) &&
      requiredLayerProps.every((prop) =>
        Object.prototype.hasOwnProperty.call(layer, prop),
      ),
  );
}

interface MapThemesTabProps {
  mapName: string;
}

export default function MapThemesTab({ mapName }: MapThemesTabProps) {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: themes = [], isLoading } = useThemes(mapName);
  const { mutateAsync: createTheme, isPending: isCreating } =
    useCreateTheme(mapName);
  const { mutateAsync: updateTheme, isPending: isUpdating } =
    useUpdateTheme(mapName);
  const { mutateAsync: removeTheme, isPending: isDeleting } =
    useDeleteTheme(mapName);

  const [filter, setFilter] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [owner, setOwner] = useState("");
  const [description, setDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [importedData, setImportedData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [importStatus, setImportStatus] = useState<boolean | null>(null);
  const [importMessage, setImportMessage] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Theme | null>(null);

  const isEditing = selectedId != null;
  const isSaving = isCreating || isUpdating;

  const filteredThemes = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return themes;
    return themes.filter((theme) => theme.title.toLowerCase().includes(query));
  }, [filter, themes]);

  const resetForm = () => {
    setSelectedId(null);
    setTitle("");
    setOwner("");
    setDescription("");
    setKeywords([]);
    setKeywordInput("");
    setImportedData(null);
    setImportStatus(null);
    setImportMessage("");
    setSelectedFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const loadThemeIntoForm = (theme: Theme) => {
    setSelectedId(theme.id);
    setTitle(theme.title);
    setOwner(theme.owner ?? "");
    setDescription(theme.description ?? "");
    setKeywords(theme.keywords ?? []);
    setKeywordInput("");
    setImportedData(theme.data ?? {});
    setImportStatus(true);
    setImportMessage(t("maps.themes.importValid"));
    setSelectedFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImportJson = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);

    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = (loadEvent) => {
      try {
        const result = JSON.parse(String(loadEvent.target?.result ?? ""));
        if (!validateImportedThemeJson(result)) {
          setImportedData(null);
          setImportStatus(false);
          setImportMessage(t("maps.themes.importInvalid"));
          return;
        }

        setImportedData({
          layers: result.layers,
          metadata: result.metadata,
        });
        setImportStatus(true);
        setImportMessage(t("maps.themes.importValid"));

        if (result.metadata?.title && !title.trim()) {
          setTitle(String(result.metadata.title));
        }
        if (result.metadata?.description && !description.trim()) {
          setDescription(String(result.metadata.description));
        }
      } catch {
        setImportedData(null);
        setImportStatus(false);
        setImportMessage(t("maps.themes.importInvalid"));
      }
    };
  };

  const handleAddKeyword = () => {
    const next = keywordInput.trim();
    if (!next || keywords.includes(next)) return;
    setKeywords((prev) => [...prev, next]);
    setKeywordInput("");
  };

  const handleRemoveKeyword = (index: number) => {
    setKeywords((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!title.trim() || !importedData || importStatus !== true) {
      toast.warning(t("maps.themes.saveValidation"), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
      return;
    }

    const payload = {
      title: title.trim(),
      owner: owner.trim() || undefined,
      description: description.trim() || undefined,
      keywords,
      data: importedData,
    };

    try {
      if (isEditing && selectedId != null) {
        await updateTheme({ id: selectedId, data: payload });
        toast.success(
          t("maps.themes.updateSuccess", { title: payload.title }),
          {
            position: "bottom-left",
            theme: palette.mode,
            hideProgressBar: true,
          },
        );
      } else {
        await createTheme(payload);
        toast.success(
          t("maps.themes.createSuccess", { title: payload.title }),
          {
            position: "bottom-left",
            theme: palette.mode,
            hideProgressBar: true,
          },
        );
        resetForm();
      }
    } catch (error) {
      console.error("Failed to save theme:", error);
      toast.error(t("maps.themes.saveFailed"), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await removeTheme(deleteTarget.id);
      toast.success(
        t("maps.themes.deleteSuccess", { title: deleteTarget.title }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        },
      );
      if (selectedId === deleteTarget.id) {
        resetForm();
      }
      setDeleteTarget(null);
    } catch (error) {
      console.error("Failed to delete theme:", error);
      toast.error(
        t("maps.themes.deleteFailed", { title: deleteTarget.title }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        },
      );
    }
  };

  if (isLoading) {
    return <SquareSpinnerComponent />;
  }

  return (
    <>
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {t("maps.themes.listTitle")}
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder={t("maps.themes.filterPlaceholder")}
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            sx={{ mb: 1 }}
          />
          <List
            dense
            sx={{
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              maxHeight: 420,
              overflow: "auto",
            }}
          >
            {filteredThemes.length === 0 ? (
              <ListItemText
                primary={t("maps.themes.emptyList")}
                sx={{ px: 2, py: 1 }}
              />
            ) : (
              filteredThemes.map((theme) => (
                <ListItemButton
                  key={theme.id}
                  selected={selectedId === theme.id}
                  onClick={() => loadThemeIntoForm(theme)}
                >
                  <ListItemText
                    primary={theme.title}
                    secondary={theme.owner ?? undefined}
                  />
                  <IconButton
                    edge="end"
                    aria-label={t("common.delete")}
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      setDeleteTarget(theme);
                    }}
                  >
                    <DeleteOutlineIcon fontSize="small" />
                  </IconButton>
                </ListItemButton>
              ))
            )}
          </List>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {isEditing ? t("maps.themes.editTitle") : t("maps.themes.addTitle")}
          </Typography>

          <Stack spacing={2}>
            <Box>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Button variant="outlined" component="label">
                  {t("maps.themes.chooseJsonFile")}
                  <input
                    ref={fileInputRef}
                    hidden
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportJson}
                  />
                </Button>
                {selectedFileName && (
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {selectedFileName}
                  </Typography>
                )}
              </Stack>
              {importMessage && (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{ mt: 1, alignItems: "center" }}
                >
                  {importStatus ? (
                    <CheckCircleOutlineIcon color="success" fontSize="small" />
                  ) : (
                    <ErrorOutlineIcon color="error" fontSize="small" />
                  )}
                  <Typography
                    variant="body2"
                    color={importStatus ? "success.main" : "error.main"}
                  >
                    {importMessage}
                  </Typography>
                </Stack>
              )}
            </Box>

            <TextField
              label={t("maps.themes.title")}
              required
              fullWidth
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <TextField
              label={t("maps.themes.owner")}
              fullWidth
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
            />
            <TextField
              label={t("maps.themes.description")}
              fullWidth
              multiline
              minRows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />

            <Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <TextField
                  label={t("maps.themes.keywords")}
                  fullWidth
                  value={keywordInput}
                  onChange={(event) => setKeywordInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                />
                <Button variant="outlined" onClick={handleAddKeyword}>
                  {t("maps.themes.addKeyword")}
                </Button>
              </Stack>
              <Stack
                direction="row"
                spacing={1}
                sx={{ flexWrap: "wrap", mt: 1 }}
              >
                {keywords.map((keyword, index) => (
                  <Chip
                    key={`${keyword}-${index}`}
                    label={keyword}
                    onDelete={() => handleRemoveKeyword(index)}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                disabled={isSaving}
                onClick={() => void handleSave()}
                startIcon={
                  isSaving ? (
                    <CircularProgress color="inherit" size={18} />
                  ) : null
                }
              >
                {isEditing ? t("common.dialog.saveBtn") : t("maps.themes.add")}
              </Button>
              <Button variant="text" onClick={resetForm} disabled={isSaving}>
                {t("common.cancel")}
              </Button>
            </Stack>
          </Stack>
        </Grid>
      </Grid>

      <DialogWrapper
        fullWidth
        open={deleteTarget !== null}
        title={t("maps.themes.deleteTitle")}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        actions={
          <>
            <Button
              variant="text"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={isDeleting}
              onClick={() => void handleConfirmDelete()}
              startIcon={
                isDeleting ? (
                  <CircularProgress color="inherit" size={18} />
                ) : (
                  <DeleteOutlineIcon />
                )
              }
            >
              {t("common.delete")}
            </Button>
          </>
        }
      >
        <Alert severity="warning">
          {t("maps.themes.deleteConfirm", { title: deleteTarget?.title ?? "" })}
        </Alert>
      </DialogWrapper>
    </>
  );
}
