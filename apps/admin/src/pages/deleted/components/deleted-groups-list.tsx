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
  useDeletedGroups,
  useRestoreGroup,
  GroupType,
  type Group,
} from "../../../api/groups";
import StyledDataGrid from "../../../components/data-grid";
import DialogWrapper from "../../../components/flexible-dialog";

export default function DeletedGroupsList() {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { data: groups = [], isLoading, isError } = useDeletedGroups();
  const { mutateAsync: restoreGroup, isPending } = useRestoreGroup();
  const [restoreTarget, setRestoreTarget] = useState<Group | null>(null);

  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;

    try {
      await restoreGroup(restoreTarget.id);
      toast.success(
        t("deleted.groups.restoreSuccess", {
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
      console.error("Failed to restore group:", error);
      toast.error(
        t("deleted.groups.restoreFailed", {
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
        {t("deleted.groups.loadFailed")}
      </Typography>
    );
  }

  if (groups.length === 0) {
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
      <StyledDataGrid<Group>
        storageKey="deleted-groups"
        rows={groups}
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
            field: "type",
            flex: 0.4,
            headerName: t("groups.type"),
            valueFormatter: (value: GroupType) => {
              const key = Object.keys(GroupType).find(
                (enumKey) =>
                  GroupType[enumKey as keyof typeof GroupType] === value,
              );
              return key ? t(`groupType.${key}`) : value;
            },
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
        title={t("deleted.groups.restoreTitle", {
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
        <Alert severity="warning">
          {t("deleted.groups.restoreWarning")}
        </Alert>
      </DialogWrapper>
    </>
  );
}
