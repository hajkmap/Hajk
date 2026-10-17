import { useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  useTheme,
} from "@mui/material";
import RestoreFromTrashIcon from "@mui/icons-material/RestoreFromTrash";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import {
  useDeletedThemes,
  useRestoreTheme,
  type Theme,
} from "../../../api/themes";
import StyledDataGrid from "../../../components/data-grid";

export default function DeletedThemesList() {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { data: themes = [], isLoading, isError } = useDeletedThemes();
  const { mutateAsync: restoreTheme, isPending } = useRestoreTheme();
  const [restoringId, setRestoringId] = useState<number | null>(null);

  const handleRestore = async (theme: Theme) => {
    setRestoringId(theme.id);
    try {
      await restoreTheme(theme.id);
      toast.success(
        t("deleted.themes.restoreSuccess", {
          name: theme.title,
        }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        }
      );
    } catch (error) {
      console.error("Failed to restore theme:", error);
      toast.error(
        t("deleted.themes.restoreFailed", {
          name: theme.title,
        }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        }
      );
    } finally {
      setRestoringId(null);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Typography color="error" sx={{ py: 2 }}>
        {t("deleted.themes.loadFailed")}
      </Typography>
    );
  }

  if (themes.length === 0) {
    return (
      <Box
        sx={{
          py: 6,
          px: 2,
          textAlign: "center",
          color: "text.secondary",
        }}
      >
        <Typography variant="body1">{t("deleted.empty")}</Typography>
      </Box>
    );
  }

  return (
    <StyledDataGrid<Theme>
      storageKey="deleted-themes"
      rows={themes}
      getRowId={(row) => String(row.id)}
      customSx={{
        height: "calc(100vh - 280px)",
        minHeight: 320,
      }}
      columns={[
        {
          field: "title",
          flex: 1,
          headerName: t("common.name"),
        },
        {
          field: "mapName",
          flex: 0.6,
          headerName: t("common.map"),
        },
        {
          field: "deletedAt",
          headerName: t("deleted.deletedAt"),
          flex: 0.7,
          valueFormatter: (value: string | null | undefined) =>
            value ? new Date(value).toLocaleString("sv-SE") : "",
        },
        {
          field: "actions",
          headerName: "",
          sortable: false,
          filterable: false,
          width: 140,
          align: "right",
          headerAlign: "right",
          renderCell: (params) => {
            const isRestoring = restoringId === params.row.id;
            return (
              <Button
                size="small"
                startIcon={
                  isRestoring ? (
                    <CircularProgress size={14} color="inherit" />
                  ) : (
                    <RestoreFromTrashIcon fontSize="small" />
                  )
                }
                disabled={isPending}
                onClick={(event) => {
                  event.stopPropagation();
                  void handleRestore(params.row);
                }}
              >
                {t("deleted.restore")}
              </Button>
            );
          },
        },
      ]}
    />
  );
}
