import { useState } from "react";
import {
  Alert,
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
  useDeletedMaps,
  useRestoreMap,
  type Map as MapRecord,
} from "../../../api/maps";
import StyledDataGrid from "../../../components/data-grid";
import DialogWrapper from "../../../components/flexible-dialog";

export default function DeletedMapsList() {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { data: maps = [], isLoading, isError } = useDeletedMaps();
  const { mutateAsync: restoreMap, isPending } = useRestoreMap();
  const [restoreTarget, setRestoreTarget] = useState<MapRecord | null>(null);

  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;

    try {
      const restored = await restoreMap(restoreTarget.name);
      const themeCount = restored.themeCount ?? 0;
      toast.success(
        t("deleted.maps.restoreSuccess", {
          name: restoreTarget.name,
          count: themeCount,
        }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        },
      );
      setRestoreTarget(null);
    } catch (error) {
      console.error("Failed to restore map:", error);
      toast.error(
        t("deleted.maps.restoreFailed", {
          name: restoreTarget.name,
        }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        },
      );
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
        {t("deleted.maps.loadFailed")}
      </Typography>
    );
  }

  if (maps.length === 0) {
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
    <>
      <StyledDataGrid<MapRecord>
        storageKey="deleted-maps"
        rows={maps}
        getRowId={(row) => String(row.id)}
        customSx={{
          height: "calc(100vh - 280px)",
          minHeight: 320,
        }}
        columns={[
          {
            field: "name",
            flex: 1,
            headerName: t("common.name"),
          },
          {
            field: "themeCount",
            flex: 0.4,
            headerName: t("deleted.maps.themes"),
            valueFormatter: (value: number | null | undefined) =>
              value == null ? "0" : String(value),
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
            renderCell: (params) => (
              <Button
                size="small"
                startIcon={<RestoreFromTrashIcon fontSize="small" />}
                disabled={isPending}
                onClick={(event) => {
                  event.stopPropagation();
                  setRestoreTarget(params.row);
                }}
              >
                {t("deleted.restore")}
              </Button>
            ),
          },
        ]}
      />

      <DialogWrapper
        fullWidth
        open={restoreTarget !== null}
        title={t("deleted.maps.restoreTitle", {
          name: restoreTarget?.name ?? "",
        })}
        onClose={() => {
          if (!isPending) setRestoreTarget(null);
        }}
        actions={
          <>
            <Button
              variant="text"
              onClick={() => setRestoreTarget(null)}
              disabled={isPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="contained"
              disabled={isPending}
              onClick={() => void handleConfirmRestore()}
              startIcon={
                isPending ? (
                  <CircularProgress color="inherit" size={18} />
                ) : (
                  <RestoreFromTrashIcon />
                )
              }
            >
              {t("deleted.restore")}
            </Button>
          </>
        }
      >
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("deleted.maps.restoreConfirm", {
            count: restoreTarget?.themeCount ?? 0,
          })}
        </Alert>
        <Alert severity="warning">
          {t("deleted.maps.restoreWarning")}
        </Alert>
      </DialogWrapper>
    </>
  );
}
