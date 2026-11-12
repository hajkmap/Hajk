import {
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AddCircleOutlined,
  BlockOutlined,
  CancelOutlined,
} from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import { DataGrid, GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ListFilterField,
  ListFilterRow,
} from "../../../components/form-components/list-filter-row";
import { cellTooltipSlotProps } from "../../../components/cell-tooltip";
import SlowServiceNotice from "../../../components/slow-service-notice";

export interface CapabilityRow {
  id: number;
  layer: string;
  infoClick: string;
  publications: string;
}

interface CreateLayerGrid {
  capabilitiesSearchTerm: string;
  onCapabilitiesSearchTermChange: (value: string) => void;

  workspaces: string[];
  selectedWorkspace: string;
  onSelectedWorkspaceChange: (value: string) => void;

  selectedCapabilityLayers: string[];
  onToggleCapabilityLayer: (layerName: string) => void;

  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  /** The service has been slow to answer, and its answer is still awaited. */
  isSlow: boolean;
  onRetry: () => void;

  rows: CapabilityRow[];

  onClose: () => void;
}

export function CreateLayerGrid({
  capabilitiesSearchTerm,
  onCapabilitiesSearchTermChange,
  workspaces,
  selectedWorkspace,
  onSelectedWorkspaceChange,
  selectedCapabilityLayers,
  onToggleCapabilityLayer,
  isLoading,
  isFetching,
  isError,
  isSlow,
  onRetry,
  rows,
  onClose,
}: CreateLayerGrid) {
  const { t } = useTranslation();

  const [paginationModel, setPaginationModel] = useState(() => {
    const stored = localStorage.getItem("capabilities-dialog-page-size");
    const parsed = Number(stored);
    const pageSize = [10, 25, 50, 100].includes(parsed) ? parsed : 10;
    return { page: 0, pageSize };
  });

  const columns = useMemo<GridColDef[]>(
    () => [
      {
        field: "layer",
        headerName: t("common.layerName"),
        flex: 1,
        renderCell: (params: GridRenderCellParams<CapabilityRow>) => (
          <Tooltip
            title={params.value as string}
            enterDelay={500}
            enterNextDelay={500}
            slotProps={cellTooltipSlotProps}
          >
            <Box
              sx={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                width: "100%",
              }}
            >
              {params.value}
            </Box>
          </Tooltip>
        ),
      },
      { field: "infoClick", headerName: t("common.infoclick"), flex: 0.3 },
      {
        field: "publications",
        headerName: t("common.publications"),
        flex: 0.5,
      },
      {
        field: "actions",
        headerName: "",
        width: 56,
        sortable: false,
        renderCell: (params: GridRenderCellParams<CapabilityRow>) => {
          const layerName = params.row.layer;
          const isSelected = selectedCapabilityLayers.includes(layerName);
          const hasSelection = selectedCapabilityLayers.length >= 1;
          const isBlocked = hasSelection && !isSelected;
          const actionTooltip = isBlocked
            ? ""
            : isSelected
              ? t("common.cancel")
              : t("services.publishLayerAction");

          return (
            <Tooltip
              title={actionTooltip}
              slotProps={cellTooltipSlotProps}
              disableHoverListener={isBlocked}
            >
              <span>
                <IconButton
                  color="primary"
                  disabled={isBlocked}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCapabilityLayer(layerName);
                  }}
                  aria-label={
                    isSelected
                      ? t("common.cancel")
                      : t("services.publishLayerAction")
                  }
                  sx={{ cursor: isBlocked ? "default" : "pointer" }}
                >
                  {isBlocked ? (
                    <BlockOutlined sx={{ opacity: 0.35 }} />
                  ) : isSelected ? (
                    <CancelOutlined sx={{ color: "error.main" }} />
                  ) : (
                    <AddCircleOutlined />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          );
        },
      },
    ],
    [onToggleCapabilityLayer, selectedCapabilityLayers, t],
  );

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          mb: 1,
        }}
      >
        <ListFilterRow sx={{ flex: 1, mt: 1, mb: 0 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <TextField
              fullWidth
              label={t("common.search")}
              variant="outlined"
              value={capabilitiesSearchTerm}
              onChange={(e) => onCapabilitiesSearchTermChange(e.target.value)}
              slotProps={{ input: { endAdornment: <SearchIcon /> } }}
            />
          </Box>
          {workspaces.length > 0 && (
            <ListFilterField>
              <FormControl fullWidth>
                <InputLabel>{t("services.workspace")}</InputLabel>
                <Select
                  label={t("services.workspace")}
                  value={selectedWorkspace}
                  onChange={(e) =>
                    onSelectedWorkspaceChange(String(e.target.value))
                  }
                >
                  <MenuItem value="">{t("common.all")}</MenuItem>
                  {workspaces.map((ws) => (
                    <MenuItem key={ws} value={ws}>
                      {ws}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </ListFilterField>
          )}
        </ListFilterRow>
        <IconButton onClick={onClose} aria-label="close" sx={{ mt: 1 }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {selectedCapabilityLayers.length > 0 && (
        <Stack
          spacing={1}
          useFlexGap
          sx={{ mb: 1.5, direction: "row", flexWrap: "wrap" }}
        >
          {selectedCapabilityLayers.map((layer) => (
            <Chip
              key={layer}
              label={layer}
              color="primary"
              variant="outlined"
              onDelete={() => onToggleCapabilityLayer(layer)}
              deleteIcon={<CancelOutlined />}
              sx={{
                "& .MuiChip-deleteIcon": {
                  color: "error.main",
                  "&:hover": { color: "error.dark" },
                },
              }}
            />
          ))}
        </Stack>
      )}

      {isSlow ? (
        <SlowServiceNotice />
      ) : isError ? (
        <Box sx={{ textAlign: "center", py: 2 }}>
          {!isFetching && (
            <Typography color="error" sx={{ mb: 2 }}>
              {t("layers.errorLoadingCapabilities")}
            </Typography>
          )}
          <Button
            variant="outlined"
            onClick={onRetry}
            disabled={isFetching}
            startIcon={
              isFetching ? <CircularProgress color="inherit" size={18} /> : null
            }
          >
            {t("common.retry")}
          </Button>
        </Box>
      ) : !isLoading && rows.length === 0 ? (
        <Typography align="center" color="text.secondary">
          {t("services.error.layers")}
        </Typography>
      ) : (
        <DataGrid
          sx={{
            maxWidth: "100%",
            mb: 2,
            mt: 1,
            height: 520,
            "& .MuiDataGrid-cell:focus": { outline: "none" },
            "& .MuiDataGrid-cell:focus-within": { outline: "none" },
          }}
          rows={rows}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={(model) => {
            setPaginationModel(model);
            localStorage.setItem(
              "capabilities-dialog-page-size",
              String(model.pageSize),
            );
          }}
          slotProps={{
            loadingOverlay: {
              variant: "skeleton",
              noRowsVariant: "skeleton",
            },
          }}
          hideFooter={isLoading || rows.length <= paginationModel.pageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          pagination
          loading={isLoading}
          disableRowSelectionOnClick
        />
      )}
    </Box>
  );
}
