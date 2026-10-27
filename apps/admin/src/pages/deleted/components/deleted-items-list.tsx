import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Typography,
  useTheme,
} from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import FolderIcon from "@mui/icons-material/Folder";
import DnsIcon from "@mui/icons-material/Dns";
import LayersIcon from "@mui/icons-material/Layers";
import PaletteIcon from "@mui/icons-material/Palette";
import RestoreFromTrashIcon from "@mui/icons-material/RestoreFromTrash";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import { useRestoreMap, type Map as MapRecord } from "../../../api/maps";
import {
  GroupType,
  useRestoreGroup,
  type Group,
} from "../../../api/groups";
import { useRestoreService, type Service } from "../../../api/services";
import { useRestoreLayer, type DeletedLayer } from "../../../api/layers";
import { useRestoreTheme, type Theme } from "../../../api/themes";
import StyledDataGrid from "../../../components/data-grid";
import DialogWrapper from "../../../components/flexible-dialog";
import {
  type DeletedItem,
  type DeletedItemKind,
  useDeletedItems,
} from "../use-deleted-items";

export type DeletedItemsFilter = "all" | DeletedItemKind;

type RestoreTarget =
  | { kind: "map"; data: MapRecord }
  | { kind: "group"; data: Group }
  | { kind: "service"; data: Service }
  | { kind: "layer"; data: DeletedLayer };

const TYPE_ICONS: Record<DeletedItemKind, typeof MapIcon> = {
  map: MapIcon,
  group: FolderIcon,
  service: DnsIcon,
  layer: LayersIcon,
  theme: PaletteIcon,
};

function groupTypeLabel(
  type: GroupType,
  t: (key: string) => string,
): string {
  const key = Object.keys(GroupType).find(
    (enumKey) => GroupType[enumKey as keyof typeof GroupType] === type,
  );
  return key ? t(`groupType.${key}`) : type;
}

function itemDetail(item: DeletedItem, t: (key: string, options?: object) => string): string {
  switch (item.kind) {
    case "map":
      return t("deleted.detail.themeCount", {
        count: item.data.themeCount ?? 0,
      });
    case "group":
      return groupTypeLabel(item.data.type, t);
    case "service": {
      const layerCount = item.data.layerCount ?? 0;
      return `${item.data.type} · ${t("deleted.detail.layerCount", {
        count: layerCount,
      })}`;
    }
    case "layer": {
      const service = item.data.serviceDeleted
        ? t("deleted.layers.serviceDeletedLabel", {
            name: item.data.serviceName,
          })
        : item.data.serviceName;
      return `${service} · ${t(`common.${item.data.layerKind}-layers`)}`;
    }
    case "theme":
      return t("deleted.detail.mapName", { name: item.data.mapName });
  }
}

type DeletedItemsListProps = {
  filter: DeletedItemsFilter;
};

export default function DeletedItemsList({ filter }: DeletedItemsListProps) {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { items, isLoading, isError } = useDeletedItems();

  const { mutateAsync: restoreMap, isPending: mapPending } = useRestoreMap();
  const { mutateAsync: restoreGroup, isPending: groupPending } =
    useRestoreGroup();
  const { mutateAsync: restoreService, isPending: servicePending } =
    useRestoreService();
  const { mutateAsync: restoreLayer, isPending: layerPending } =
    useRestoreLayer();
  const { mutateAsync: restoreTheme, isPending: themePending } =
    useRestoreTheme();

  const [restoreTarget, setRestoreTarget] = useState<RestoreTarget | null>(
    null,
  );
  const [restoringThemeId, setRestoringThemeId] = useState<number | null>(null);

  const isPending =
    mapPending ||
    groupPending ||
    servicePending ||
    layerPending ||
    themePending;

  const rows = useMemo(
    () =>
      filter === "all" ? items : items.filter((item) => item.kind === filter),
    [filter, items],
  );

  const toastOptions = {
    position: "bottom-left" as const,
    theme: palette.mode,
    hideProgressBar: true,
  };

  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;
    if (restoreTarget.kind === "layer" && restoreTarget.data.serviceDeleted) {
      return;
    }

    try {
      switch (restoreTarget.kind) {
        case "map": {
          const restored = await restoreMap(restoreTarget.data.name);
          toast.success(
            t("deleted.maps.restoreSuccess", {
              name: restoreTarget.data.name,
              count: restored.themeCount ?? 0,
            }),
            toastOptions,
          );
          break;
        }
        case "group": {
          await restoreGroup(restoreTarget.data.id);
          toast.success(
            t("deleted.groups.restoreSuccess", {
              name: restoreTarget.data.name,
            }),
            toastOptions,
          );
          break;
        }
        case "service": {
          const restored = await restoreService(restoreTarget.data.id);
          toast.success(
            t("deleted.services.restoreSuccess", {
              name: restoreTarget.data.name,
              count: restored.layerCount ?? 0,
            }),
            toastOptions,
          );
          break;
        }
        case "layer": {
          await restoreLayer(restoreTarget.data.id);
          toast.success(
            t("deleted.layers.restoreSuccess", {
              name: restoreTarget.data.name,
            }),
            toastOptions,
          );
          break;
        }
      }
      setRestoreTarget(null);
    } catch (error) {
      console.error("Failed to restore deleted item:", error);
      switch (restoreTarget.kind) {
        case "map":
          toast.error(
            t("deleted.maps.restoreFailed", {
              name: restoreTarget.data.name,
            }),
            toastOptions,
          );
          break;
        case "group":
          toast.error(
            t("deleted.groups.restoreFailed", {
              name: restoreTarget.data.name,
            }),
            toastOptions,
          );
          break;
        case "service":
          toast.error(
            t("deleted.services.restoreFailed", {
              name: restoreTarget.data.name,
            }),
            toastOptions,
          );
          break;
        case "layer":
          toast.error(
            t("deleted.layers.restoreFailed", {
              name: restoreTarget.data.name,
            }),
            toastOptions,
          );
          break;
      }
    }
  };

  const handleThemeRestore = async (theme: Theme) => {
    setRestoringThemeId(theme.id);
    try {
      await restoreTheme(theme.id);
      toast.success(
        t("deleted.themes.restoreSuccess", { name: theme.title }),
        toastOptions,
      );
    } catch (error) {
      console.error("Failed to restore theme:", error);
      toast.error(
        t("deleted.themes.restoreFailed", { name: theme.title }),
        toastOptions,
      );
    } finally {
      setRestoringThemeId(null);
    }
  };

  const openRestore = (item: DeletedItem) => {
    switch (item.kind) {
      case "map":
        setRestoreTarget({ kind: "map", data: item.data });
        break;
      case "group":
        setRestoreTarget({ kind: "group", data: item.data });
        break;
      case "service":
        setRestoreTarget({ kind: "service", data: item.data });
        break;
      case "layer":
        setRestoreTarget({ kind: "layer", data: item.data });
        break;
      case "theme":
        void handleThemeRestore(item.data);
        break;
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
        {t("deleted.loadFailed")}
      </Typography>
    );
  }

  if (rows.length === 0) {
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

  const dialogTitle =
    restoreTarget == null
      ? ""
      : restoreTarget.kind === "map"
        ? t("deleted.maps.restoreTitle", { name: restoreTarget.data.name })
        : restoreTarget.kind === "group"
          ? t("deleted.groups.restoreTitle", { name: restoreTarget.data.name })
          : restoreTarget.kind === "service"
            ? t("deleted.services.restoreTitle", {
                name: restoreTarget.data.name,
              })
            : t("deleted.layers.restoreTitle", {
                name: restoreTarget.data.name,
              });

  const layerBlocked =
    restoreTarget?.kind === "layer" && restoreTarget.data.serviceDeleted;

  return (
    <>
      <StyledDataGrid<DeletedItem>
        storageKey="deleted-items"
        rows={rows}
        getRowId={(row) => row.id}
        getRowHeight={() => "auto"}
        customSx={{
          height: "calc(100vh - 280px)",
          minHeight: 320,
          "& .MuiDataGrid-cell": {
            py: 1,
            alignItems: "center",
            display: "flex",
          },
        }}
        columns={[
          {
            field: "kind",
            headerName: t("deleted.type"),
            width: 140,
            sortable: true,
            renderCell: (params) => {
              const Icon = TYPE_ICONS[params.row.kind];
              return (
                <Chip
                  size="small"
                  color="default"
                  variant="outlined"
                  icon={<Icon />}
                  label={t(`deleted.types.${params.row.kind}`)}
                />
              );
            },
          },
          {
            field: "name",
            flex: 1,
            minWidth: 200,
            headerName: t("common.name"),
            renderCell: (params) => (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  overflow: "hidden",
                  py: 0.5,
                }}
              >
                <Typography
                  variant="body2"
                  noWrap
                  title={params.row.name}
                  sx={{ fontWeight: 500 }}
                >
                  {params.row.name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  noWrap
                  title={itemDetail(params.row, t)}
                >
                  {itemDetail(params.row, t)}
                </Typography>
              </Box>
            ),
          },
          {
            field: "deletedAt",
            headerName: t("deleted.deletedAt"),
            flex: 0.7,
            minWidth: 160,
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
              const isThemeRestoring =
                params.row.kind === "theme" &&
                restoringThemeId === params.row.data.id;
              return (
                <Button
                  size="small"
                  startIcon={
                    isThemeRestoring ? (
                      <CircularProgress size={14} color="inherit" />
                    ) : (
                      <RestoreFromTrashIcon fontSize="small" />
                    )
                  }
                  disabled={isPending}
                  onClick={(event) => {
                    event.stopPropagation();
                    openRestore(params.row);
                  }}
                >
                  {t("deleted.restore")}
                </Button>
              );
            },
          },
        ]}
      />

      <DialogWrapper
        fullWidth
        open={restoreTarget !== null}
        title={dialogTitle}
        onClose={() => {
          if (!isPending) setRestoreTarget(null);
        }}
        actions={
          layerBlocked ? (
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
        {restoreTarget?.kind === "map" ? (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              {t("deleted.maps.restoreConfirm", {
                count: restoreTarget.data.themeCount ?? 0,
              })}
            </Alert>
            <Alert severity="warning">
              {t("deleted.maps.restoreWarning")}
            </Alert>
          </>
        ) : null}
        {restoreTarget?.kind === "group" ? (
          <Alert severity="warning">{t("deleted.groups.restoreWarning")}</Alert>
        ) : null}
        {restoreTarget?.kind === "service" ? (
          <>
            <Alert severity="info" sx={{ mb: 2 }}>
              {t("deleted.services.restoreConfirm", {
                count: restoreTarget.data.layerCount ?? 0,
              })}
            </Alert>
            <Alert severity="warning">
              {t("deleted.services.restoreWarning")}
            </Alert>
          </>
        ) : null}
        {restoreTarget?.kind === "layer" ? (
          layerBlocked ? (
            <Alert severity="warning">
              {t("deleted.layers.restoreBlockedByService", {
                serviceName: restoreTarget.data.serviceName,
              })}
            </Alert>
          ) : (
            <Alert severity="warning">
              {t("deleted.layers.restoreWarning")}
            </Alert>
          )
        ) : null}
      </DialogWrapper>
    </>
  );
}
