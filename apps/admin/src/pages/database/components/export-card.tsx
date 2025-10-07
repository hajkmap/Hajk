import { useState } from "react";
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
import { Download as DownloadIcon } from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import {
  useExportDatabase,
  useDatabaseStatus,
} from "../../../api/database/hooks";

interface ExportOptions {
  format: "sql" | "custom" | "tar" | "directory";
  includeData: boolean;
  schemaOnly: boolean;
  dataOnly: boolean;
  compress: boolean;
}

export default function DatabaseExportCard() {
  const { t } = useTranslation();
  const [options, setOptions] = useState<ExportOptions>({
    format: "custom",
    includeData: true,
    schemaOnly: false,
    dataOnly: false,
    compress: true,
  });

  const exportMutation = useExportDatabase();
  const { isLoading: statusLoading } = useDatabaseStatus();

  const handleExport = () => {
    exportMutation.mutate(options, {
      onSuccess: () => {
        toast.success(t("database.export.success"));
      },
      onError: (error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : undefined;
        toast.error(errorMessage ?? t("database.export.error"));
      },
    });
  };

  const handleOptionChange = (
    key: keyof ExportOptions,
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
          <DownloadIcon color="primary" />
          <Typography variant="h6">{t("database.export.title")}</Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" mb={3}>
          {t("database.export.description")}
        </Typography>

        <Box display="flex" flexDirection="column" gap={2}>
          <FormControl fullWidth>
            <InputLabel>{t("database.export.format")}</InputLabel>
            <Select
              value={options.format}
              onChange={(e) => handleOptionChange("format", e.target.value)}
              label={t("database.export.format")}
            >
              <MenuItem value="sql">
                {t("database.export.formats.sql")}
              </MenuItem>
              <MenuItem value="custom">
                {t("database.export.formats.custom")}
              </MenuItem>
              <MenuItem value="tar">
                {t("database.export.formats.tar")}
              </MenuItem>
              <MenuItem value="directory">
                {t("database.export.formats.directory")}
              </MenuItem>
            </Select>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 1, display: "block" }}
            >
              {t(`database.export.formats.${options.format}.desc`)}
            </Typography>
          </FormControl>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={options.includeData}
                  onChange={(e) => {
                    handleOptionChange("includeData", e.target.checked);
                    if (e.target.checked) {
                      handleOptionChange("schemaOnly", false);
                      handleOptionChange("dataOnly", false);
                    }
                  }}
                />
              }
              label={t("database.export.includeData")}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {t("database.export.includeData.desc")}
            </Typography>
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={options.schemaOnly}
                  onChange={(e) => {
                    handleOptionChange("schemaOnly", e.target.checked);
                    if (e.target.checked) {
                      handleOptionChange("includeData", false);
                      handleOptionChange("dataOnly", false);
                    }
                  }}
                />
              }
              label={t("database.export.schemaOnly")}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {t("database.export.schemaOnly.desc")}
            </Typography>
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={options.dataOnly}
                  onChange={(e) => {
                    handleOptionChange("dataOnly", e.target.checked);
                    if (e.target.checked) {
                      handleOptionChange("includeData", false);
                      handleOptionChange("schemaOnly", false);
                    }
                  }}
                />
              }
              label={t("database.export.dataOnly")}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {t("database.export.dataOnly.desc")}
            </Typography>
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={options.compress}
                  onChange={(e) =>
                    handleOptionChange("compress", e.target.checked)
                  }
                />
              }
              label={t("database.export.compress")}
            />
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              {t("database.export.compress.desc")}
            </Typography>
          </Box>
        </Box>

        {exportMutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            <Typography variant="body2">
              {exportMutation.error instanceof Error
                ? exportMutation.error.message
                : t("database.export.error")}
            </Typography>
          </Alert>
        )}
      </CardContent>

      <Divider />

      <CardActions>
        <Button
          variant="contained"
          startIcon={
            exportMutation.isPending ? (
              <CircularProgress size={20} />
            ) : (
              <DownloadIcon />
            )
          }
          onClick={handleExport}
          disabled={exportMutation.isPending}
          fullWidth
        >
          {exportMutation.isPending
            ? t("database.export.exporting")
            : t("database.export.startExport")}
        </Button>
      </CardActions>
    </Card>
  );
}
