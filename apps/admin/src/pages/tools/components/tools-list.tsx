import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import MapOutlinedIcon from "@mui/icons-material/MapOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { useTranslation } from "react-i18next";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Page from "../../../layouts/root/components/page";
import {
  useTools,
  useToolTypes,
  useCreateTool,
  useDeleteTool,
  Tool,
  ToolCreateInput,
} from "../../../api/tools";
import StyledDataGrid from "../../../components/data-grid";
import DialogWrapper from "../../../components/flexible-dialog";
import CreateButton from "../../../components/create-button";

function ToolUsedInMapsCell({
  count,
  mapNames,
}: {
  count: number;
  mapNames: string[];
}) {
  const { t } = useTranslation();

  if (count === 0) {
    return (
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.75,
          height: "100%",
          color: "text.disabled",
        }}
      >
        <MapOutlinedIcon sx={{ fontSize: 18, opacity: 0.55 }} />
        <Typography variant="body2" color="text.disabled">
          0
        </Typography>
      </Box>
    );
  }

  return (
    <Tooltip
      enterDelay={400}
      slotProps={{ tooltip: { sx: { maxWidth: 280 } } }}
      title={
        <Box sx={{ py: 0.25 }}>
          <Typography
            variant="caption"
            sx={{ display: "block", fontWeight: 600, mb: 0.75 }}
          >
            {t("common.usedInMaps")}
          </Typography>
          {mapNames.map((mapName) => (
            <Typography
              key={mapName}
              variant="caption"
              sx={{ display: "block" }}
            >
              {mapName}
            </Typography>
          ))}
        </Box>
      }
    >
      <Box
        component="span"
        sx={{ display: "inline-flex", alignItems: "center", height: "100%" }}
      >
        <Chip
          icon={<MapOutlinedIcon />}
          label={count}
          size="small"
          color="primary"
          variant="outlined"
          sx={{
            height: 26,
            fontWeight: 600,
            "& .MuiChip-icon": { fontSize: 16, ml: 0.75 },
            "& .MuiChip-label": { px: 0.75 },
          }}
        />
      </Box>
    </Tooltip>
  );
}

interface ToolsListProps {
  filterTools: (tools: Tool[]) => Tool[];
  showCreateButton?: boolean;
  pageTitleKey: string;
  baseRoute: string;
}

export default function ToolsList({
  filterTools,
  showCreateButton = true,
  pageTitleKey,
  baseRoute,
}: ToolsListProps) {
  const { t } = useTranslation();
  const { data: tools, isLoading } = useTools();
  const { data: toolTypes } = useToolTypes();
  const { mutateAsync: createTool } = useCreateTool();
  const { mutateAsync: deleteTool } = useDeleteTool();
  const navigate = useNavigate();
  const { palette } = useTheme();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [toolToDelete, setToolToDelete] = useState<Tool | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ToolCreateInput>({
    defaultValues: { type: "", title: "" },
    mode: "onChange",
  });

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const filteredTools = useMemo(() => {
    if (!tools) return [];

    // First apply the specific filter for this page type
    const typeFilteredTools = filterTools(tools);

    // Then apply search filter
    const searchFilter = (tool: Tool) => {
      const titleText = tool.title ?? "";
      const combinedText = `${tool.type} ${titleText}`.toLowerCase();
      return combinedText.includes(searchTerm.toLowerCase());
    };

    return typeFilteredTools.filter(searchFilter);
  }, [tools, searchTerm, filterTools]);

  const handleCreateSubmit = async (data: ToolCreateInput) => {
    try {
      const response = await createTool({ type: data.type, title: data.title });
      toast.success(t("tools.createSuccess"), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
      reset();
      setCreateOpen(false);
      void navigate(`${baseRoute}/${response.id}`);
    } catch (error) {
      console.error("Failed to create tool:", error);
      toast.error(t("tools.createFailed"), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!toolToDelete) return;
    try {
      await deleteTool(toolToDelete.id);
      toast.success(t("tools.deleteSuccess"), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    } catch (error) {
      console.error("Failed to delete tool:", error);
      toast.error(t("tools.deleteFailed"), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    } finally {
      setToolToDelete(null);
    }
  };

  return (
    <Page
      title={t(pageTitleKey)}
      actionButtons={
        showCreateButton ? (
          <CreateButton
            onClick={() => setCreateOpen(true)}
            label={t("tools.createTool")}
          />
        ) : undefined
      }
    >
      <DialogWrapper
        fullWidth
        open={createOpen}
        title={t("tools.createDialogTitle")}
        onClose={() => setCreateOpen(false)}
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(handleCreateSubmit)(e);
        }}
        actions={
          <>
            <Button
              variant="text"
              onClick={() => setCreateOpen(false)}
              color="primary"
            >
              {t("common.dialog.closeBtn")}
            </Button>
            <Button type="submit" color="primary" variant="contained">
              {t("common.dialog.saveBtn")}
            </Button>
          </>
        }
      >
        <Grid container spacing={2}>
          <Grid size={12}>
            <Controller
              name="type"
              control={control}
              rules={{ required: `${t("common.required")}` }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label={t("tools.toolType")}
                  error={!!errors.type}
                  helperText={errors.type?.message}
                >
                  {(toolTypes ?? []).map((toolType) => (
                    <MenuItem key={toolType.type} value={toolType.type}>
                      {`${toolType.title} (${toolType.type})`}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label={t("tools.title")}
              fullWidth
              {...register("title")}
            />
          </Grid>
        </Grid>
      </DialogWrapper>

      <DialogWrapper
        fullWidth
        open={toolToDelete !== null}
        title={t("tools.deleteDialogTitle")}
        onClose={() => setToolToDelete(null)}
        actions={
          <>
            <Button
              variant="text"
              onClick={() => setToolToDelete(null)}
              color="primary"
            >
              {t("common.dialog.closeBtn")}
            </Button>
            <Button
              color="error"
              variant="contained"
              onClick={() => void handleDeleteConfirm()}
            >
              {t("common.delete")}
            </Button>
          </>
        }
      >
        <Typography>
          {t("tools.deleteConfirm", {
            title: toolToDelete?.title ?? toolToDelete?.type ?? "",
          })}
        </Typography>
        {(toolToDelete?.mapsCount ?? 0) > 0 && (
          <>
            <Typography color="warning.main" sx={{ mt: 1 }}>
              {t("tools.deleteUsedInMaps", { count: toolToDelete?.mapsCount })}
            </Typography>
            <Box sx={{ mt: 1 }}>
              {(toolToDelete?.mapNames ?? []).map((mapName) => (
                <Typography
                  key={mapName}
                  variant="body2"
                  color="text.secondary"
                  sx={{ display: "block" }}
                >
                  • {mapName}
                </Typography>
              ))}
            </Box>
          </>
        )}
      </DialogWrapper>

      {isLoading ? (
        <Typography variant="h6">{t("common.loading")}</Typography>
      ) : (
        <>
          <Box sx={{ mb: 2, width: { xs: "100%", sm: "50%", md: "33%" } }}>
            <TextField
              fullWidth
              label={t("tools.searchTitle")}
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Box>

          <Box sx={{ width: "100%", minWidth: 0 }}>
            <StyledDataGrid
              storageKey="tools"
              customSx={{ height: "calc(100vh - 320px)", minHeight: 420 }}
              rows={filteredTools}
              columns={[
                {
                  field: "title",
                  headerName: t("tools.title"),
                  flex: 0.3,
                },
                {
                  field: "type",
                  headerName: t("tools.type"),
                  flex: 0.4,
                },
                {
                  field: "mapsCount",
                  headerName: t("common.usedInMaps"),
                  flex: 0.4,
                  align: "center",
                  headerAlign: "center",
                  renderCell: (params: { row: Tool }) => (
                    <ToolUsedInMapsCell
                      count={params.row.mapsCount}
                      mapNames={params.row.mapNames}
                    />
                  ),
                },
                {
                  field: "lastSavedDate",
                  flex: 0.3,
                  headerName: t("common.lastSaved"),
                  valueFormatter: (value: string) =>
                    value ? new Date(value).toLocaleDateString("sv-SE") : "–",
                },
                {
                  field: "actions",
                  headerName: t("common.actions"),
                  flex: 0.2,
                  sortable: false,
                  renderCell: (params: { row: Tool }) => (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        setToolToDelete(params.row);
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  ),
                },
              ]}
              onRowClick={({ row }) => {
                const toolId: string = row.id;
                if (toolId !== undefined && toolId !== null) {
                  void navigate(`${baseRoute}/${toolId}`);
                }
              }}
            />
          </Box>
        </>
      )}
    </Page>
  );
}
