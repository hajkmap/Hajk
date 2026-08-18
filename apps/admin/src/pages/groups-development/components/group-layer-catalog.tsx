import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FolderIcon from "@mui/icons-material/Folder";
import LayersIcon from "@mui/icons-material/Layers";
import { DragIndicator } from "@mui/icons-material";
import AddIcon from "@mui/icons-material/Add";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useDrag } from "react-dnd";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "react-toastify";

import {
  GroupType,
  useCreateGroup,
  useDeleteGroup,
  useUpdateGroup,
  type Group,
} from "../../../api/groups";
import type { Layer } from "../../../api/layers";
import useAppStateStore from "../../../store/use-app-state-store";
import { DND_ITEM_TITLE_SX } from "../../../components/layerswitcher-dnd/utils";
import {
  getCreateGroupErrorMessage,
  getDeleteGroupErrorMessage,
  getUpdateGroupErrorMessage,
} from "../../groups/utils/group-errors";
import {
  DEFAULT_GROUP_DISPLAY_SETTINGS,
  type CatalogDragItem,
  type GroupDisplaySettings,
  type GroupFormValues,
} from "../types";
import { CATALOG_DRAG_TYPE } from "../types";
import { toDisplaySettings, toFormValues } from "../utils/group-form";
import GroupFormDialog from "./group-form-dialog";

interface GroupLayerCatalogProps {
  groups: Group[];
  layers: Layer[];
  placedGroupIds: Set<string>;
  placedLayerIds: Set<string>;
  groupDisplaySettings: Record<string, GroupDisplaySettings>;
  onGroupDisplaySettingsChange: (
    groupId: string,
    settings: GroupDisplaySettings,
  ) => void;
  onGroupDisplaySettingsRemove: (groupId: string) => void;
}

type CatalogTab = "groups" | "layers";

interface CatalogRowProps {
  item: CatalogDragItem;
  onEdit?: () => void;
  onDelete?: () => void;
  disableActions?: boolean;
}

function CatalogRow({
  item,
  onEdit,
  onDelete,
  disableActions,
}: CatalogRowProps) {
  const { t } = useTranslation();
  const isDarkMode = useAppStateStore((s) => s.themeMode === "dark");
  const isGroup = item.kind === "group";
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: CATALOG_DRAG_TYPE,
      item,
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [item],
  );

  return (
    <ListItem disablePadding sx={{ mb: 0.75 }}>
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 0.5,
          px: 1,
          py: 1,
          backgroundColor: isDarkMode ? "grey.900" : "background.paper",
          border: "1px solid",
          borderColor: isDarkMode ? "grey.800" : "divider",
          borderRadius: 2,
        }}
      >
        <Box
          ref={(node) => {
            drag(node as HTMLDivElement | null);
          }}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flex: 1,
            minHeight: 24,
            cursor: "grab",
            opacity: isDragging ? 0.5 : 1,
            "&:active": {
              cursor: "grabbing",
            },
          }}
        >
          <DragIndicator sx={{ color: "text.secondary", flexShrink: 0 }} />
          {isGroup ? (
            <FolderIcon fontSize="small" color="primary" />
          ) : (
            <LayersIcon fontSize="small" color="action" />
          )}
          <Typography
            variant="body2"
            title={item.name}
            sx={{
              ...DND_ITEM_TITLE_SX,
              fontWeight: isGroup ? 600 : 400,
              color: isGroup ? "primary.main" : "text.primary",
            }}
          >
            {item.name}
          </Typography>
        </Box>

        {isGroup && onEdit && onDelete ? (
          <Box sx={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <IconButton
              size="small"
              aria-label={t("groupsDevelopment.editGroup")}
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
              disabled={disableActions}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              aria-label={t("groups.deleteGroupButton")}
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              disabled={disableActions}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : null}
      </Paper>
    </ListItem>
  );
}

export default function GroupLayerCatalog({
  groups,
  layers,
  placedGroupIds,
  placedLayerIds,
  groupDisplaySettings,
  onGroupDisplaySettingsChange,
  onGroupDisplaySettingsRemove,
}: GroupLayerCatalogProps) {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { mutateAsync: createGroup, isPending: isCreatingGroup } =
    useCreateGroup();
  const { mutateAsync: updateGroup, isPending: isUpdatingGroup } =
    useUpdateGroup();
  const { mutateAsync: deleteGroup, isPending: isDeletingGroup } =
    useDeleteGroup();

  const [activeTab, setActiveTab] = useState<CatalogTab>("groups");
  const [search, setSearch] = useState("");
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

  const normalizedSearch = search.trim().toLowerCase();
  const layerGroups = useMemo(
    () => groups.filter((group) => group.type === GroupType.LAYER),
    [groups],
  );

  const catalogGroups = useMemo(() => {
    const items = layerGroups
      .filter((group) => !placedGroupIds.has(group.id))
      .map((group) => ({
        kind: "group" as const,
        id: group.id,
        name: group.name,
      }));

    if (!normalizedSearch) {
      return items;
    }

    return items.filter((item) =>
      item.name.toLowerCase().includes(normalizedSearch),
    );
  }, [layerGroups, normalizedSearch, placedGroupIds]);

  const availableLayers = useMemo(() => {
    const items = layers
      .filter((layer) => !placedLayerIds.has(layer.id))
      .map((layer) => ({
        kind: "layer" as const,
        id: layer.id,
        name: layer.name,
      }));

    if (!normalizedSearch) {
      return items;
    }

    return items.filter((item) =>
      item.name.toLowerCase().includes(normalizedSearch),
    );
  }, [layers, normalizedSearch, placedLayerIds]);

  const activeItems = activeTab === "groups" ? catalogGroups : availableLayers;

  const emptyMessage =
    activeTab === "groups"
      ? t("groupsDevelopment.noGroupsMatchSearch")
      : "No unplaced layers match your search.";

  const formInitialValues =
    formMode === "edit" && editingGroup
      ? toFormValues(
          editingGroup.name,
          groupDisplaySettings[editingGroup.id] ??
            DEFAULT_GROUP_DISPLAY_SETTINGS,
        )
      : undefined;

  const isDeleteConfirmNameMatching =
    Boolean(deleteTarget?.name) && deleteConfirmName === deleteTarget?.name;

  const handleOpenCreateDialog = () => {
    setFormMode("create");
    setEditingGroup(null);
    setFormDialogOpen(true);
  };

  const handleOpenEditDialog = (groupId: string) => {
    const group = layerGroups.find((entry) => entry.id === groupId);
    if (!group) {
      return;
    }

    setFormMode("edit");
    setEditingGroup(group);
    setFormDialogOpen(true);
  };

  const handleOpenDeleteDialog = (groupId: string) => {
    const group = layerGroups.find((entry) => entry.id === groupId);
    if (!group) {
      return;
    }

    setDeleteTarget(group);
    setDeleteConfirmName("");
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (isDeletingGroup) {
      return;
    }

    setDeleteDialogOpen(false);
    setDeleteTarget(null);
    setDeleteConfirmName("");
  };

  const handleFormSubmit = async (values: GroupFormValues) => {
    const displaySettings = toDisplaySettings(values);

    try {
      if (formMode === "create") {
        const response = await createGroup({
          name: values.name,
          type: GroupType.LAYER,
        });
        onGroupDisplaySettingsChange(response.id, displaySettings);
        toast.success(t("groups.createGroupSuccess", { name: response.name }), {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        });
      } else if (editingGroup) {
        const response = await updateGroup({
          groupId: editingGroup.id,
          data: { name: values.name },
        });
        onGroupDisplaySettingsChange(response.id, displaySettings);
        toast.success(t("groups.updateGroupSuccess", { name: response.name }), {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        });
      }

      setFormDialogOpen(false);
      setEditingGroup(null);
    } catch (error) {
      const message =
        formMode === "create"
          ? getCreateGroupErrorMessage(error, t)
          : getUpdateGroupErrorMessage(error, t, editingGroup?.name);
      toast.error(message, {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !isDeleteConfirmNameMatching) {
      return;
    }

    try {
      await deleteGroup(deleteTarget.id);
      onGroupDisplaySettingsRemove(deleteTarget.id);
      toast.success(
        t("groups.deleteGroupSuccess", { name: deleteTarget.name }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        },
      );
      handleCloseDeleteDialog();
    } catch (error) {
      toast.error(getDeleteGroupErrorMessage(error, t, deleteTarget.name), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1,
              mb: 1,
            }}
          >
            <Typography variant="subtitle1">
              {t("common.groupsDevelopment")}
            </Typography>
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreateDialog}
              sx={{ flexShrink: 0 }}
            >
              {t("common.add")}
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("groupsDragAndDropDescription")}
          </Typography>
          <TextField
            fullWidth
            size="small"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("common.search")}
          />
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value as CatalogTab)}
            sx={{
              mt: 1.5,
              minHeight: 36,
              "& .MuiTabs-indicator": {
                height: 2,
              },
              "& .MuiTab-root": {
                minHeight: 36,
                py: 0.5,
                px: 1,
                minWidth: 0,
                fontSize: "0.8125rem",
                gap: 0.5,
              },
              "& .MuiTab-icon": {
                fontSize: "1rem",
                marginBottom: "0 !important",
              },
            }}
          >
            <Tab
              icon={<FolderIcon />}
              iconPosition="start"
              value="groups"
              label={`${t("common.layerGroups")} (${catalogGroups.length})`}
            />
            <Tab
              icon={<LayersIcon />}
              iconPosition="start"
              value="layers"
              label={`${t("common.layers")} (${availableLayers.length})`}
            />
          </Tabs>
        </Box>

        <List
          dense
          sx={{
            flex: 1,
            overflow: "auto",
            p: 2,
            m: 0,
          }}
        >
          {activeItems.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              {emptyMessage}
            </Typography>
          ) : (
            activeItems.map((item) => (
              <CatalogRow
                key={`${item.kind}:${item.id}`}
                item={item}
                onEdit={
                  item.kind === "group"
                    ? () => handleOpenEditDialog(item.id)
                    : undefined
                }
                onDelete={
                  item.kind === "group"
                    ? () => handleOpenDeleteDialog(item.id)
                    : undefined
                }
                disableActions={
                  item.kind === "group"
                    ? layerGroups.find((group) => group.id === item.id)?.locked
                    : false
                }
              />
            ))
          )}
        </List>
      </Paper>

      <GroupFormDialog
        open={formDialogOpen}
        mode={formMode}
        initialValues={formInitialValues}
        onClose={() => {
          if (isCreatingGroup || isUpdatingGroup) {
            return;
          }
          setFormDialogOpen(false);
          setEditingGroup(null);
        }}
        onSubmit={handleFormSubmit}
        isSubmitting={isCreatingGroup || isUpdatingGroup}
      />

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t("groups.deleteGroupConfirmTitle")}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <Trans
              i18nKey="groups.deleteGroupConfirmMessage"
              values={{ name: deleteTarget?.name ?? "" }}
              components={{ strong: <strong /> }}
            />
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("groups.deleteGroupWarning")}
          </Typography>
          <TextField
            fullWidth
            size="small"
            label={t("groups.deleteGroupTypeNameLabel")}
            value={deleteConfirmName}
            onChange={(event) => setDeleteConfirmName(event.target.value)}
            helperText={
              <Trans
                i18nKey="groups.deleteGroupTypeNameHelper"
                values={{ name: deleteTarget?.name ?? "" }}
                components={{ strong: <strong /> }}
              />
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={isDeletingGroup}>
            {t("common.cancel")}
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleConfirmDelete}
            disabled={!isDeleteConfirmNameMatching || isDeletingGroup}
          >
            {t("groups.deleteGroupButton")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
