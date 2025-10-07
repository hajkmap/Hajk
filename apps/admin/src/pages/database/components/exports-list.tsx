import {
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Tooltip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Storage as StorageIcon,
} from "@mui/icons-material";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { useDatabaseStatus } from "../../../api/database/hooks";

export default function DatabaseExportsList() {
  const { t } = useTranslation();

  const { data, isLoading, error } = useDatabaseStatus();

  const deleteMutation = useMutation({
    mutationFn: () => {
      // For now, we'll just show a message that this feature is not implemented
      throw new Error("Delete functionality not implemented yet");
    },
    onSuccess: () => {
      toast.success(t("database.exports.deleteSuccess"));
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : undefined;
      toast.error(errorMessage ?? t("database.exports.deleteError"));
    },
  });

  const downloadMutation = useMutation({
    mutationFn: () => {
      // For now, we'll just show a message that this feature is not implemented
      throw new Error("Download functionality not implemented yet");
    },
    onSuccess: () => {
      toast.success(t("database.exports.downloadSuccess"));
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : undefined;
      toast.error(errorMessage ?? t("database.exports.downloadError"));
    },
  });

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const getFileType = (fileName: string): string => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "sql":
        return "SQL";
      case "dump":
        return "Custom";
      case "tar":
        return "TAR";
      case "gz":
        return "Compressed";
      default:
        return "Unknown";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={24} />
            <Typography>{t("database.exports.loading")}</Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            <Typography variant="h6" gutterBottom>
              {t("database.exports.error")}
            </Typography>
            <Typography variant="body2">
              {error instanceof Error ? error.message : "Unknown error"}
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const exports = data?.exports ?? [];

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <StorageIcon color="primary" />
          <Typography variant="h6">{t("database.exports.title")}</Typography>
        </Box>

        {exports.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {t("database.exports.noExports")}
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t("database.exports.table.name")}</TableCell>
                  <TableCell>{t("database.exports.table.type")}</TableCell>
                  <TableCell>{t("database.exports.table.size")}</TableCell>
                  <TableCell>{t("database.exports.table.created")}</TableCell>
                  <TableCell align="right">
                    {t("database.exports.table.actions")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {exports.map((exportFile) => (
                  <TableRow key={exportFile.name}>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {exportFile.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getFileType(exportFile.name)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatFileSize(exportFile.size)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(exportFile.created)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title={t("database.exports.download")}>
                        <IconButton
                          size="small"
                          onClick={() => downloadMutation.mutate()}
                          disabled={downloadMutation.isPending}
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t("database.exports.delete")}>
                        <IconButton
                          size="small"
                          onClick={() => deleteMutation.mutate()}
                          disabled={deleteMutation.isPending}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
