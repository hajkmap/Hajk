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
  useDeletedLayers,
  useRestoreLayer,
  type DeletedLayer,
} from "../../../api/layers";
import StyledDataGrid from "../../../components/data-grid";
import DialogWrapper from "../../../components/flexible-dialog";

export default function DeletedLayersList() {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { data: layers = [], isLoading, isError } = useDeletedLayers();
  const { mutateAsync: restoreLayer, isPending } = useRestoreLayer();
  const [restoreTarget, setRestoreTarget] = useState<DeletedLayer | null>(null);

  const handleConfirmRestore = async () => {
    if (!restoreTarget || restoreTarget.serviceDeleted) return;

    try {
      await restoreLayer(restoreTarget.id);
      toast.success(
        t("deleted.layers.restoreSuccess", {
          name: restoreTarget.name,
        }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        },
      );
      setRestoreTarget(null);
    } catch (error) {
      console.error("Failed to restore layer:", error);
      toast.error(
        t("deleted.layers.restoreFailed", {
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
        {t("deleted.layers.loadFailed")}
      </Typography>
    );
  }

  if (layers.length === 0) {
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
      <StyledDataGrid<DeletedLayer>
        storageKey="deleted-layers"
        rows={layers}
        getRowId={(row) => row.id}
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
            field: "layerKind",
            flex: 0.6,
            headerName: t("layers.layerKind"),
            valueFormatter: (value: DeletedLayer["layerKind"]) =>
              t(`common.${value}-layers`),
          },
          {
            field: "serviceName",
            flex: 0.8,
            headerName: t("common.service"),
            renderCell: (params) => (
              <Typography
                variant="body2"
                color={
                  params.row.serviceDeleted ? "text.secondary" : "text.primary"
                }
                sx={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={
                  params.row.serviceDeleted
                    ? t("deleted.layers.serviceDeletedHint", {
                        name: params.row.serviceName,
                      })
                    : params.row.serviceName
                }
              >
                {params.row.serviceDeleted
                  ? t("deleted.layers.serviceDeletedLabel", {
                      name: params.row.serviceName,
                    })
                  : params.row.serviceName}
              </Typography>
            ),
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
        title={t("deleted.layers.restoreTitle", {
          name: restoreTarget?.name ?? "",
        })}
        onClose={() => {
          if (!isPending) setRestoreTarget(null);
        }}
        actions={
          restoreTarget?.serviceDeleted ? (
            <Button
              variant="text"
              onClick={() => setRestoreTarget(null)}
              disabled={isPending}
            >
              {t("common.dialog.closeBtn")}
            </Button>
          ) : (
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
          )
        }
      >
        {restoreTarget?.serviceDeleted ? (
          <Alert severity="warning">
            {t("deleted.layers.restoreBlockedByService", {
              serviceName: restoreTarget.serviceName,
            })}
          </Alert>
        ) : (
          <Alert severity="warning">
            {t("deleted.layers.restoreWarning")}
          </Alert>
        )}
      </DialogWrapper>
    </>
  );
}
