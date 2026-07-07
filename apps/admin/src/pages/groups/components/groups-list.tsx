import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import Grid from "@mui/material/Grid";
import {
  Autocomplete,
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  useTheme,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  Menu,
  Select,
  MenuItem,
  Chip,
  Typography,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import { Trans, useTranslation } from "react-i18next";
import type { GridRenderCellParams } from "@mui/x-data-grid";
import Page from "../../../layouts/root/components/page";
import {
  useGroups,
  Group,
  useCreateGroup,
  useDeleteGroup,
  GroupCreateInput,
  GroupType,
} from "../../../api/groups";
import { useLayers } from "../../../api/layers";
import type { Layer } from "../../../api/layers";
import DialogWrapper from "../../../components/flexible-dialog";
import CreateButton from "../../../components/create-button";
import { SquareSpinnerComponent } from "../../../components/progress/square-progress";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import StyledDataGrid from "../../../components/data-grid";
import {
  getCreateGroupErrorMessage,
  getDeleteGroupErrorMessage,
} from "../utils/group-errors";
import {
  GroupCompositionIconsCell,
} from "../../../components/group-composition-summary";

interface GroupCreateForm {
  name: string;
  internalName?: string;
  type: GroupType | "";
  layerIds: string[];
}

interface GroupsListProps {
  filterGroups: (groups: Group[]) => Group[];
  showCreateButton?: boolean;
  pageTitleKey: string;
  baseRoute: string;
}

export default function GroupsList({
  filterGroups,
  showCreateButton = true,
  pageTitleKey,
  baseRoute,
}: GroupsListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: groups, isLoading } = useGroups();
  const { data: layers = [] } = useLayers();
  const { mutateAsync: createGroup, isPending: isCreatingGroup } =
    useCreateGroup();
  const { mutateAsync: removeGroup, isPending: isDeletingGroup } =
    useDeleteGroup();
  const { palette } = useTheme();

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [open, setOpen] = useState<boolean>(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const actionsMenuOpen = Boolean(anchorEl);
  const selectedGroup = useMemo(
    () => groups?.find((group) => group.id === selectedGroupId),
    [groups, selectedGroupId],
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  const handleOpenActionsMenu = (
    event: React.MouseEvent<HTMLElement>,
    groupId: string,
  ) => {
    if (isDeletingGroup) return;
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedGroupId(groupId);
  };

  const handleCloseActionsMenu = () => {
    setAnchorEl(null);
  };

  const handleOpenDeleteDialog = () => {
    handleCloseActionsMenu();
    setDeleteConfirmName("");
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (isDeletingGroup) return;
    setIsDeleteDialogOpen(false);
    setSelectedGroupId(null);
    setDeleteConfirmName("");
  };

  const isDeleteConfirmNameMatching =
    Boolean(selectedGroup?.name) && deleteConfirmName === selectedGroup?.name;

  const handleConfirmDelete = async () => {
    if (!selectedGroupId || !selectedGroup || !isDeleteConfirmNameMatching) {
      return;
    }

    try {
      await removeGroup(selectedGroupId);
      toast.success(
        t("groups.deleteGroupSuccess", { name: selectedGroup.name }),
        {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        },
      );
      handleCloseDeleteDialog();
    } catch (error) {
      console.error("Failed to delete group:", error);
      toast.error(getDeleteGroupErrorMessage(error, t, selectedGroup.name), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

  const filteredGroups = useMemo(() => {
    if (!groups) return [];

    // First apply the specific filter for this page type
    const typeFilteredGroups = filterGroups(groups);

    // Then apply search filter
    const searchFilter = (group: Group) => {
      const combinedText = `${group.name} ${group.internalName ?? ""} ${
        group.type
      }`.toLowerCase();
      return combinedText.includes(searchTerm.toLowerCase());
    };

    return typeFilteredGroups.filter(searchFilter);
  }, [groups, searchTerm, filterGroups]);

  const defaultValues: GroupCreateForm = {
    name: "",
    internalName: "",
    type: "",
    layerIds: [],
  };

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<GroupCreateForm>({
    defaultValues,
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const watchGroupType = watch("type");

  useEffect(() => {
    setValue("layerIds", []);
  }, [setValue, watchGroupType]);

  const availableLayerOptions = useMemo(() => {
    if (!watchGroupType) return [];
    const allowedKind =
      watchGroupType === GroupType.SEARCH ? "search" : "display";
    return layers
      .filter((layer) => layer.layerKind === allowedKind)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [layers, watchGroupType]);

  const handleGroupSubmit = async (groupData: GroupCreateForm) => {
    try {
      const payload: GroupCreateInput = {
        name: groupData.name,
        internalName: groupData.internalName,
        type: groupData.type as GroupType,
        layers: groupData.layerIds.map((layerId) => ({
          layerId,
          usage: "FOREGROUND",
        })),
      };
      const response = await createGroup(payload);
      toast.success(t("groups.createGroupSuccess", { name: response.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
      void navigate(`${baseRoute}/${response.id}`);
      reset();
      handleClose();
    } catch (error) {
      console.error("Failed to submit group:", error);
      toast.error(getCreateGroupErrorMessage(error, t), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

  const onSubmit = (data: GroupCreateForm) => {
    void handleGroupSubmit(data);
  };

  return (
    <Page
      title={t(pageTitleKey)}
      actionButtons={
        showCreateButton ? (
          <CreateButton onClick={handleClickOpen} label={t("groups.create")} />
        ) : undefined
      }
    >
      <DialogWrapper
        fullWidth
        open={open}
        title={t("groups.dialog.title")}
        onClose={handleClose}
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit(onSubmit)(e);
        }}
        actions={
          <>
            <Button variant="text" onClick={handleClose} color="primary">
              {t("common.dialog.closeBtn")}
            </Button>
            <Button
              type="submit"
              color="primary"
              variant="contained"
              disabled={isCreatingGroup}
            >
              {t("common.dialog.saveBtn")}
            </Button>
          </>
        }
      >
        <Grid container spacing={2}>
          <Grid size={12}>
            <TextField
              label={t("common.name")}
              fullWidth
              {...register("name", {
                required: `${t("common.required")}`,
              })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid size={12}>
            <TextField
              label={t("groups.internalName")}
              fullWidth
              {...register("internalName")}
            />
          </Grid>
          <Grid size={12}>
            <FormControl fullWidth error={!!errors.type}>
              <InputLabel id="type-label">{t("groups.type")}</InputLabel>
              <Controller
                name="type"
                control={control}
                rules={{ required: `${t("common.required")}` }}
                render={({ field }) => (
                  <>
                    <Select
                      labelId="type-label"
                      label={t("groups.type")}
                      error={!!errors.type}
                      {...field}
                    >
                      {Object.keys(GroupType).map((key) => {
                        const value = GroupType[key as keyof typeof GroupType];
                        return (
                          <MenuItem key={key} value={value}>
                            {t(`groupType.${key}`)}
                          </MenuItem>
                        );
                      })}
                    </Select>
                    <FormHelperText error={!!errors.type}>
                      {errors.type?.message}
                    </FormHelperText>
                  </>
                )}
              />
            </FormControl>
          </Grid>
          <Grid size={12}>
            <Controller
              name="layerIds"
              control={control}
              render={({ field }) => {
                const selectedLayers = availableLayerOptions.filter((layer) =>
                  field.value.includes(layer.id),
                );
                return (
                  <Autocomplete<Layer, true, false, false>
                    multiple
                    disabled={!watchGroupType}
                    options={availableLayerOptions}
                    value={selectedLayers}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    onChange={(_, value) =>
                      field.onChange(value.map((layer) => layer.id))
                    }
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          label={option.name}
                          {...getTagProps({ index })}
                          key={option.id}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={t("groups.layers")}
                        helperText={t("groups.layersHelp")}
                      />
                    )}
                    noOptionsText={t("common.noLayersAvailable")}
                  />
                );
              }}
            />
          </Grid>
        </Grid>
      </DialogWrapper>
      {isLoading ? (
        <SquareSpinnerComponent />
      ) : (
        <>
          <Box sx={{ mb: 2, width: { xs: "100%", sm: "50%", md: "33%" } }}>
            <TextField
              fullWidth
              label={t("groups.search")}
              variant="outlined"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </Box>

          <Grid size={12}>
            <StyledDataGrid<Group>
              storageKey="groups"
              customSx={{ height: "calc(100vh - 320px)", minHeight: 420 }}
              onRowClick={({ row }) => {
                const id: string = row.id;
                if (id) {
                  void navigate(`${baseRoute}/${id}`);
                }
              }}
              rows={filteredGroups}
              columns={[
                {
                  field: "name",
                  headerName: t("common.name"),
                  flex: 0.4,
                },
                {
                  field: "type",
                  headerName: t("groups.type"),
                  flex: 0.35,
                  valueFormatter: (value: GroupType) => {
                    const key = Object.keys(GroupType).find(
                      (enumKey) =>
                        GroupType[enumKey as keyof typeof GroupType] === value,
                    );
                    return key ? t(`groupType.${key}`) : value;
                  },
                },
                {
                  field: "composition",
                  headerName: t("groups.layers"),
                  flex: 0.2,
                  sortable: false,
                  filterable: false,
                  renderCell: (params: GridRenderCellParams<Group>) => (
                    <GroupCompositionIconsCell
                      layerCount={params.row.layerCount}
                      nestedGroupCount={params.row.nestedGroupCount}
                    />
                  ),
                },
                {
                  field: "internalName",
                  headerName: t("groups.internalName"),
                  flex: 0.25,
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
                  headerName: "",
                  width: 60,
                  align: "center",
                  sortable: false,
                  filterable: false,
                  disableColumnMenu: true,
                  renderCell: (params: GridRenderCellParams<Group>) => (
                    <IconButton
                      aria-label={t("common.actions")}
                      size="small"
                      disabled={isDeletingGroup}
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
            <Menu
              anchorEl={anchorEl}
              open={actionsMenuOpen}
              onClose={handleCloseActionsMenu}
              onClick={(event) => event.stopPropagation()}
            >
              <MenuItem
                onClick={handleOpenDeleteDialog}
                data-group-id={selectedGroupId ?? ""}
                disabled={isDeletingGroup}
              >
                {t("common.delete")}
              </MenuItem>
            </Menu>
            <DialogWrapper
              fullWidth
              open={isDeleteDialogOpen}
              title={t("groups.deleteGroupConfirmTitle")}
              onClose={handleCloseDeleteDialog}
              actions={
                <>
                  <Button
                    variant="text"
                    onClick={handleCloseDeleteDialog}
                    color="primary"
                    disabled={isDeletingGroup}
                  >
                    {t("common.cancel")}
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    disabled={isDeletingGroup || !isDeleteConfirmNameMatching}
                    onClick={() => {
                      void handleConfirmDelete();
                    }}
                    startIcon={
                      isDeletingGroup ? (
                        <CircularProgress color="inherit" size={18} />
                      ) : (
                        <DeleteOutlineIcon />
                      )
                    }
                  >
                    {t("common.delete")}
                  </Button>
                </>
              }
            >
              <Typography>
                <Trans
                  i18nKey="groups.deleteGroupConfirmMessage"
                  values={{ name: selectedGroup?.name ?? "" }}
                  components={{ strong: <strong /> }}
                />
              </Typography>
              <Alert severity="warning" sx={{ mt: 2 }}>
                {t("groups.deleteGroupWarning")}
              </Alert>
              <TextField
                fullWidth
                autoComplete="off"
                margin="normal"
                label={t("groups.deleteGroupTypeNameLabel")}
                helperText={
                  <Trans
                    i18nKey="groups.deleteGroupTypeNameHelper"
                    values={{ name: selectedGroup?.name ?? "" }}
                    components={{ strong: <strong /> }}
                  />
                }
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                disabled={isDeletingGroup}
              />
            </DialogWrapper>
          </Grid>
        </>
      )}
    </Page>
  );
}
