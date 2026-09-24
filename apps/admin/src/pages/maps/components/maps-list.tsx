import { useMemo, useState, type ReactElement } from "react";
import { useNavigate } from "react-router";
import Grid from "@mui/material/Grid";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  ListItemText,
  Menu,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LayersIcon from "@mui/icons-material/Layers";
import CollectionsIcon from "@mui/icons-material/Collections";
import BuildIcon from "@mui/icons-material/Build";
import PublicIcon from "@mui/icons-material/Public";
import type { GridRenderCellParams } from "@mui/x-data-grid";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import Page from "../../../layouts/root/components/page";
import type { Map as MapRecord } from "../../../api/maps/types";
import { useDeleteMap, useMaps } from "../../../api/maps";
import CreateButton from "../../../components/create-button";
import DialogWrapper from "../../../components/flexible-dialog";
import { SquareSpinnerComponent } from "../../../components/progress/square-progress";
import StyledDataGrid from "../../../components/data-grid";
import {
  ListFilterField,
  ListFilterRow,
  ListFilterSearch,
} from "../../../components/form-components/list-filter-row";
import CreateMapDialog from "./create-map-dialog";
import DuplicateMapDialog from "./duplicate-map-dialog";

interface MapsListProps {
  filterMaps: (maps: MapRecord[]) => MapRecord[];
  showCreateButton?: boolean;
  pageTitleKey: string;
  baseRoute: string;
}

type LockedFilter = "" | "locked" | "unlocked";

const ICON_COUNT_COLUMN_WIDTH = 92;

const ICON_COUNT_COLUMN_HEADER_SX = {
  "& .MuiDataGrid-columnHeader[data-field='layerCount'], & .MuiDataGrid-columnHeader[data-field='groupCount'], & .MuiDataGrid-columnHeader[data-field='toolCount'], & .MuiDataGrid-columnHeader[data-field='projectionCount']":
    {
      "& .MuiDataGrid-columnHeaderDraggableContainer": {
        position: "relative",
        justifyContent: "center",
      },
      "& .MuiDataGrid-columnHeaderTitleContainer": {
        position: "absolute",
        inset: 0,
        justifyContent: "center",
        margin: 0,
      },
      "& .MuiDataGrid-iconButtonContainer": {
        position: "absolute",
        right: 2,
        top: "50%",
        transform: "translateY(-50%)",
        width: 28,
        margin: 0,
        zIndex: 1,
      },
    },
};

function IconColumnHeader({
  label,
  icon,
}: {
  label: string;
  icon: ReactElement;
}) {
  return (
    <Tooltip title={label}>
      <Box
        component="span"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        aria-label={label}
      >
        {icon}
      </Box>
    </Tooltip>
  );
}

function mapSearchText(map: MapRecord): string {
  const parts = [
    map.name,
    map.projection?.code ?? "",
    map.options?.title ?? "",
    map.options?.description ?? "",
  ];
  return parts.join(" ").toLowerCase();
}

export default function MapsList({
  filterMaps,
  showCreateButton = true,
  pageTitleKey,
  baseRoute,
}: MapsListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { palette } = useTheme();
  const { data: maps, isLoading, isError, refetch } = useMaps();
  const { mutateAsync: deleteMap, isPending: isDeletingMap } = useDeleteMap();

  const [searchTerm, setSearchTerm] = useState("");
  const [lockedFilter, setLockedFilter] = useState<LockedFilter>("");
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMapId, setSelectedMapId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);

  const actionsMenuOpen = Boolean(anchorEl);
  const selectedMap = useMemo(
    () => maps?.find((map) => map.id === selectedMapId),
    [maps, selectedMapId],
  );
  const isDeleteConfirmNameMatching =
    Boolean(selectedMap?.name) && deleteConfirmName === selectedMap?.name;

  const filteredMaps = useMemo(() => {
    if (!maps) return [];

    const query = searchTerm.trim().toLowerCase();

    return filterMaps(maps).filter((map) => {
      if (query && !mapSearchText(map).includes(query)) {
        return false;
      }
      if (lockedFilter === "locked" && !map.locked) return false;
      if (lockedFilter === "unlocked" && map.locked) return false;
      return true;
    });
  }, [maps, searchTerm, lockedFilter, filterMaps]);

  const hasActiveFilters = searchTerm.trim() !== "" || lockedFilter !== "";
  const showEmptyState =
    !isLoading && !isError && maps !== undefined && filteredMaps.length === 0;

  const handleOpenActionsMenu = (
    event: React.MouseEvent<HTMLElement>,
    mapId: number,
  ) => {
    if (isDeletingMap) return;
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedMapId(mapId);
  };

  const handleCloseActionsMenu = () => {
    setAnchorEl(null);
  };

  const handleOpenDuplicateDialog = () => {
    handleCloseActionsMenu();
    setDuplicateDialogOpen(true);
  };

  const handleCloseDuplicateDialog = () => {
    setDuplicateDialogOpen(false);
    setSelectedMapId(null);
  };

  const handleOpenDeleteDialog = () => {
    handleCloseActionsMenu();
    if (selectedMap?.locked) {
      toast.warning(t("maps.deleteLockedWarning"), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
      setSelectedMapId(null);
      return;
    }
    setDeleteConfirmName("");
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (isDeletingMap) return;
    setIsDeleteDialogOpen(false);
    setSelectedMapId(null);
    setDeleteConfirmName("");
  };

  const handleConfirmDelete = async () => {
    if (
      !selectedMap?.name ||
      !isDeleteConfirmNameMatching ||
      selectedMap.locked
    ) {
      return;
    }

    try {
      await deleteMap(selectedMap.name);
      toast.success(t("maps.deleteMapSuccess", { name: selectedMap.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
      handleCloseDeleteDialog();
    } catch (error) {
      console.error("Failed to delete map:", error);
      toast.error(t("maps.deleteMapFailed", { name: selectedMap.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

  return (
    <Page
      title={t(pageTitleKey)}
      actionButtons={
        showCreateButton ? (
          <CreateButton
            onClick={() => setOpen(true)}
            label={t("map.createMap")}
          />
        ) : undefined
      }
    >
      <CreateMapDialog
        open={open}
        onClose={() => setOpen(false)}
        baseRoute={baseRoute}
        existingMaps={maps ?? []}
      />
      <DuplicateMapDialog
        open={duplicateDialogOpen}
        sourceMap={selectedMap ?? null}
        existingMaps={maps ?? []}
        onClose={handleCloseDuplicateDialog}
        onDuplicated={(map) => {
          if (map.id != null) {
            void navigate(`${baseRoute}/${map.id}`);
          }
        }}
      />

      {isLoading ? (
        <SquareSpinnerComponent />
      ) : isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              {t("common.retry")}
            </Button>
          }
        >
          {t("maps.loadMapsFailed")}
        </Alert>
      ) : (
        <>
          <ListFilterRow>
            <ListFilterSearch>
              <TextField
                fullWidth
                label={t("map.searchTitle")}
                variant="outlined"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </ListFilterSearch>
            <ListFilterField>
              <FormControl fullWidth variant="outlined">
                <InputLabel id="maps-locked-filter-label">
                  {t("maps.filterByLocked")}
                </InputLabel>
                <Select
                  labelId="maps-locked-filter-label"
                  label={t("maps.filterByLocked")}
                  value={lockedFilter}
                  onChange={(event) => setLockedFilter(event.target.value)}
                >
                  <MenuItem value="">{t("common.all")}</MenuItem>
                  <MenuItem value="locked">{t("map.locked")}</MenuItem>
                  <MenuItem value="unlocked">{t("maps.unlocked")}</MenuItem>
                </Select>
              </FormControl>
            </ListFilterField>
          </ListFilterRow>

          {showEmptyState && (
            <Alert severity="info" sx={{ mb: 2 }}>
              {hasActiveFilters
                ? t("maps.noSearchResults")
                : t("maps.noMapsFound")}
            </Alert>
          )}

          <Grid size={12}>
            <StyledDataGrid<MapRecord>
              storageKey="maps"
              customSx={{
                height: "calc(100vh - 320px)", minHeight: 420,
                ...ICON_COUNT_COLUMN_HEADER_SX,
              }}
              onRowClick={({ row }) => {
                if (row.id != null) {
                  void navigate(`${baseRoute}/${row.id}`);
                }
              }}
              rows={filteredMaps}
              loading={isLoading}
              columns={[
                {
                  field: "name",
                  flex: 0.45,
                  headerName: t("common.name"),
                  renderCell: (params: GridRenderCellParams<MapRecord>) => {
                    const title = params.row.options?.title;
                    const description = params.row.options?.description;
                    const secondary =
                      title && description && title !== description
                        ? `${title} · ${description}`
                        : title ?? description ?? undefined;

                    return (
                      <ListItemText
                        primary={params.row.name}
                        secondary={secondary}
                        slotProps={{
                          primary: { noWrap: true },
                          secondary: { noWrap: true },
                        }}
                      />
                    );
                  },
                },
                {
                  field: "projection",
                  flex: 0.15,
                  headerName: t("map.projection"),
                  valueGetter: (_value, row) => row.projection?.code ?? "–",
                },
                {
                  field: "layerCount",
                  width: ICON_COUNT_COLUMN_WIDTH,
                  minWidth: ICON_COUNT_COLUMN_WIDTH,
                  headerName: t("common.layers"),
                  align: "center",
                  headerAlign: "center",
                  valueGetter: (_value, row) => row.layerCount ?? 0,
                  renderHeader: () => (
                    <IconColumnHeader
                      label={t("common.layers")}
                      icon={<LayersIcon fontSize="small" />}
                    />
                  ),
                },
                {
                  field: "groupCount",
                  width: ICON_COUNT_COLUMN_WIDTH,
                  minWidth: ICON_COUNT_COLUMN_WIDTH,
                  headerName: t("common.layerGroups"),
                  align: "center",
                  headerAlign: "center",
                  valueGetter: (_value, row) => row.groupCount ?? 0,
                  renderHeader: () => (
                    <IconColumnHeader
                      label={t("common.layerGroups")}
                      icon={<CollectionsIcon fontSize="small" />}
                    />
                  ),
                },
                {
                  field: "toolCount",
                  width: ICON_COUNT_COLUMN_WIDTH,
                  minWidth: ICON_COUNT_COLUMN_WIDTH,
                  headerName: t("common.tools"),
                  align: "center",
                  headerAlign: "center",
                  valueGetter: (_value, row) => row.toolCount ?? 0,
                  renderHeader: () => (
                    <IconColumnHeader
                      label={t("common.tools")}
                      icon={<BuildIcon fontSize="small" />}
                    />
                  ),
                },
                {
                  field: "projectionCount",
                  width: ICON_COUNT_COLUMN_WIDTH,
                  minWidth: ICON_COUNT_COLUMN_WIDTH,
                  headerName: t("map.projections"),
                  align: "center",
                  headerAlign: "center",
                  valueGetter: (_value, row) => row.projectionCount ?? 0,
                  renderHeader: () => (
                    <IconColumnHeader
                      label={t("map.projections")}
                      icon={<PublicIcon fontSize="small" />}
                    />
                  ),
                },
                {
                  field: "locked",
                  flex: 0.1,
                  headerName: t("map.locked"),
                  align: "center",
                  headerAlign: "center",
                  renderCell: (params: GridRenderCellParams<MapRecord>) =>
                    params.row.locked ? (
                      <Chip
                        icon={<LockOutlinedIcon />}
                        label={t("map.locked")}
                        size="small"
                        color="default"
                        variant="outlined"
                        sx={{ height: 26 }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.disabled">
                        –
                      </Typography>
                    ),
                },
                {
                  field: "lastSavedDate",
                  flex: 0.15,
                  headerName: t("common.lastSaved"),
                  valueFormatter: (value: string) =>
                    value ? new Date(value).toLocaleDateString("sv-SE") : "–",
                },
                {
                  field: "actions",
                  headerName: "",
                  width: 60,
                  align: "center",
                  sortable: false,
                  filterable: false,
                  disableColumnMenu: true,
                  renderCell: (params: GridRenderCellParams<MapRecord>) => (
                    <IconButton
                      aria-label={t("common.actions")}
                      size="small"
                      disabled={isDeletingMap}
                      onClick={(event) =>
                        handleOpenActionsMenu(event, params.row.id)
                      }
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  ),
                },
              ]}
            />
          </Grid>

          <Menu
            anchorEl={anchorEl}
            open={actionsMenuOpen}
            onClose={handleCloseActionsMenu}
            onClick={(event) => event.stopPropagation()}
          >
            <MenuItem onClick={handleOpenDuplicateDialog}>
              {t("common.duplicate")}
            </MenuItem>
            <Tooltip
              title={selectedMap?.locked ? t("maps.deleteLockedWarning") : ""}
            >
              <span>
                <MenuItem
                  onClick={handleOpenDeleteDialog}
                  disabled={isDeletingMap || selectedMap?.locked}
                >
                  {t("maps.delete")}
                </MenuItem>
              </span>
            </Tooltip>
          </Menu>

          <DialogWrapper
            fullWidth
            open={isDeleteDialogOpen}
            title={t("maps.deleteTitle")}
            onClose={handleCloseDeleteDialog}
            actions={
              <>
                <Button
                  variant="text"
                  onClick={handleCloseDeleteDialog}
                  color="primary"
                  disabled={isDeletingMap}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  disabled={isDeletingMap || !isDeleteConfirmNameMatching}
                  onClick={() => {
                    void handleConfirmDelete();
                  }}
                  startIcon={
                    isDeletingMap ? (
                      <CircularProgress color="inherit" size={18} />
                    ) : (
                      <DeleteOutlineIcon />
                    )
                  }
                >
                  {t("maps.delete")}
                </Button>
              </>
            }
          >
            <Typography>
              <Trans
                i18nKey="maps.deleteMapConfirmMessage"
                values={{ name: selectedMap?.name ?? "" }}
                components={{ strong: <strong /> }}
              />
            </Typography>
            <Alert severity="warning" sx={{ mt: 2 }}>
              {t("maps.deleteMapWarning")}
            </Alert>
            <TextField
              fullWidth
              autoComplete="off"
              margin="normal"
              label={t("maps.deleteMapTypeNameLabel")}
              helperText={
                <Trans
                  i18nKey="maps.deleteMapTypeNameHelper"
                  values={{ name: selectedMap?.name ?? "" }}
                  components={{ strong: <strong /> }}
                />
              }
              value={deleteConfirmName}
              onChange={(event) => setDeleteConfirmName(event.target.value)}
              disabled={isDeletingMap}
            />
          </DialogWrapper>
        </>
      )}
    </Page>
  );
}
