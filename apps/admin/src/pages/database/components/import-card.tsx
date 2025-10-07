import { useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Box,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  Upload as UploadIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import {
  useImportDatabase,
  useDatabaseStatus,
} from "../../../api/database/hooks";

interface ImportOptions {
  format: "sql" | "custom" | "tar" | "directory";
  clean: boolean;
}

export default function DatabaseImportCard() {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [options, setOptions] = useState<ImportOptions>({
    format: "custom",
    clean: false,
  });

  const importMutation = useImportDatabase();
  const { isLoading: statusLoading } = useDatabaseStatus();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Auto-detect format based on file extension
      const extension = file.name.split(".").pop()?.toLowerCase();
      if (extension === "sql") {
        setOptions((prev) => ({ ...prev, format: "sql" }));
      } else if (extension === "tar") {
        setOptions((prev) => ({ ...prev, format: "tar" }));
      }
    }
  };

  const handleImport = () => {
    if (!selectedFile) {
      toast.error(t("database.import.noFileSelected"));
      return;
    }

    readFileAsBase64(selectedFile)
      .then((fileContent) => {
        importMutation.mutate(
          {
            file: fileContent,
            fileName: selectedFile.name,
            format: options.format,
            clean: options.clean,
          },
          {
            onSuccess: () => {
              toast.success(t("database.import.success"));
              setSelectedFile(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            },
            onError: () => {
              // Error will be displayed inline below using importMutation.error
            },
          }
        );
      })
      .catch(() => {
        toast.error(t("database.import.fileReadError"));
      });
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just the base64 content
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleOptionChange = (
    key: keyof ImportOptions,
    value: boolean | string
  ) => {
    setOptions((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  if (statusLoading) {
    return (
      <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <CardContent
          sx={{
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={24} />
            <Typography>{t("common.loading")}</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <UploadIcon color="primary" />
          <Typography variant="h6">{t("database.import.title")}</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" mb={3}>
          {t("database.import.description")}
        </Typography>

        <Box display="flex" flexDirection="column" gap={2}>
          <Box>
            <input
              ref={fileInputRef}
              type="file"
              accept=".sql,.dump,.tar,.gz"
              onChange={handleFileSelect}
              style={{ display: "none" }}
            />
            <Button
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              onClick={() => fileInputRef.current?.click()}
              fullWidth
              sx={{ mb: 1 }}
            >
              {selectedFile
                ? selectedFile.name
                : t("database.import.selectFile")}
            </Button>
            {selectedFile && (
              <Typography variant="caption" color="text.secondary">
                {t("database.import.fileSize")}:{" "}
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
            )}
          </Box>

          <FormControl fullWidth>
            <InputLabel>{t("database.import.format")}</InputLabel>
            <Select
              value={options.format}
              onChange={(e) => handleOptionChange("format", e.target.value)}
              label={t("database.import.format")}
            >
              <MenuItem value="sql">
                {t("database.import.formats.sql")}
              </MenuItem>
              <MenuItem value="custom">
                {t("database.import.formats.custom")}
              </MenuItem>
              <MenuItem value="tar">
                {t("database.import.formats.tar")}
              </MenuItem>
              <MenuItem value="directory">
                {t("database.import.formats.directory")}
              </MenuItem>
            </Select>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              {t(`database.import.formats.${options.format}.desc`)}
            </Typography>
          </FormControl>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={options.clean}
                  onChange={(e) =>
                    handleOptionChange("clean", e.target.checked)
                  }
                />
              }
              label={t("database.import.clean")}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {t("database.import.cleanDescription")}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {t("database.import.clean.desc")}
            </Typography>
          </Box>
        </Box>

        {importMutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2">
              {(importMutation.error instanceof Error
                ? importMutation.error.message
                : "GENERIC") === "CONFLICT"
                ? t("database.import.error.conflict")
                : t("database.import.error.generic")}
            </Typography>
          </Alert>
        )}

        {importMutation.isSuccess && (
          <Alert severity="success" sx={{ mt: 2 }}>
            <Typography variant="body2">
              {t("database.import.success")}
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              {t("database.import.logoutMessage")}
            </Typography>
          </Alert>
        )}
      </CardContent>

      <Divider />

      <CardActions>
        <Button
          variant="contained"
          startIcon={
            importMutation.isPending ? (
              <CircularProgress size={20} />
            ) : (
              <UploadIcon />
            )
          }
          onClick={handleImport}
          disabled={importMutation.isPending || !selectedFile}
          fullWidth
        >
          {importMutation.isPending
            ? t("database.import.importing")
            : t("database.import.startImport")}
        </Button>
      </CardActions>
    </Card>
  );
}
