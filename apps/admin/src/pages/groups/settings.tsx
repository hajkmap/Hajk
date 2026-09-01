import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { Controller, FieldValues, useForm } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import LayersIcon from "@mui/icons-material/Layers";
import Page from "../../layouts/root/components/page";
import {
  GroupLayer,
  GroupLayerCreateInput,
  GroupLayersUpdateInput,
  GroupType,
  GroupUpdateInput,
  LayerSwitcherTreeNode,
} from "../../api/groups";
import FormActionPanel from "../../components/form-action-panel";
import LayerSwitcherDnDComponent, {
  LayerSwitcherComposition,
} from "./components/layerswitcher-dnd";
import {
  useDeleteGroup,
  useGroupById,
  useLayersByGroupId,
  useMapsByGroupId,
  useUpdateGroupLayers,
} from "../../api/groups";
import { useRoles } from "../../api/users";
import type { Role } from "../../api/users";
import type { Map } from "../../api/maps";
import type { LayerKind } from "../../api/layers";
import { SquareSpinnerComponent } from "../../components/progress/square-progress";
import { HttpError } from "../../lib/http-error";
import { useUpdateGroup } from "../../api/groups";
import { toast } from "react-toastify";
import DialogWrapper from "../../components/flexible-dialog";
import FormContainer from "../../components/form-components/form-container";
import FormPanel from "../../components/form-components/form-panel";
import UsedInMapsPanel from "../../components/used-in-maps-panel";
import FormFieldGrid, {
  FormFieldRow,
} from "../../components/form-components/form-field-grid";
import {
  FieldLabelAbove,
  InlineLabelWithHelp,
  SelectWithHelp,
} from "../../components/form-components/field-label-with-help";
import {
  getDeleteGroupErrorMessage,
  getUpdateGroupErrorMessage,
  applyGroupFormValidationErrors,
} from "./utils/group-errors";
import { groupCompositionKey } from "./utils/group-composition";
import { stripEditingGroupFromTree } from "./utils/layer-switcher-tree";
import { SettingsPageTabs } from "../../components/settings-page-tabs";
import UnsavedChangesGuard from "../../components/unsaved-changes-guard";

const GROUP_PAGE_TABS = [
  {
    key: "settings",
    labelKey: "common.settings",
    icon: <SettingsIcon />,
  },
  {
    key: "layers",
    labelKey: "common.layerSwitcherOrder",
    icon: <LayersIcon />,
  },
] as const;

const EMPTY_GROUP_LAYERS: GroupLayer[] = [];
const EMPTY_MAPS: Map[] = [];
const EMPTY_ROLES: Role[] = [];

type GroupSettingsTab = "settings" | "layers";

function GroupSettings() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const { t } = useTranslation();
  const { groupId } = useParams<{ groupId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { mutateAsync: updateGroup, status: updateStatus } = useUpdateGroup();
  const { mutateAsync: updateGroupLayers } = useUpdateGroupLayers();
  const { mutateAsync: deleteGroup, isPending: isDeletingGroup } =
    useDeleteGroup();
  const { data: group, isLoading, isError } = useGroupById(groupId ?? "");
  const { data: groupLayersData, isLoading: isLoadingGroupLayers } =
    useLayersByGroupId(groupId ?? "");
  const { data: mapsData, isLoading: isLoadingMaps } = useMapsByGroupId(
    groupId ?? "",
  );
  const { data: rolesData, isLoading: isLoadingRoles } = useRoles();
  const groupLayers = groupLayersData?.layers ?? EMPTY_GROUP_LAYERS;
  const savedLayerSwitcherTree = useMemo(
    () =>
      stripEditingGroupFromTree(groupLayersData?.layerSwitcherTree, groupId),
    [groupLayersData?.layerSwitcherTree, groupId],
  );
  const maps = mapsData ?? EMPTY_MAPS;
  const roles = rolesData ?? EMPTY_ROLES;
  const { palette } = useTheme();
  const tabFromUrl = searchParams.get("tab") as GroupSettingsTab | null;
  const activeTab: GroupSettingsTab =
    tabFromUrl === "layers" ? "layers" : "settings";
  const setActiveTab = (tab: GroupSettingsTab) => {
    setSearchParams({ tab }, { replace: true });
  };
  const [compositionLayers, setCompositionLayers] = useState<
    GroupLayerCreateInput[]
  >([]);
  const [compositionTree, setCompositionTree] = useState<
    LayerSwitcherTreeNode[]
  >([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const compositionBaselineRef = useRef<string | null>(null);
  const compositionStateKeyRef = useRef<string>("");
  const [isCompositionDirty, setIsCompositionDirty] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm<FieldValues>({
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const watchGroupType = watch("type") as GroupType | undefined;
  const savedGroupType = group?.type ?? GroupType.LAYER;
  const savedLayerKind: LayerKind =
    savedGroupType === GroupType.SEARCH ? "search" : "display";
  const isGroupTypeChangePending =
    watchGroupType !== undefined && watchGroupType !== savedGroupType;
  const initialDndLayers = useMemo(
    () => groupLayers.filter((layer) => layer.layerKind === savedLayerKind),
    [groupLayers, savedLayerKind],
  );
  const initialComposition = useMemo<GroupLayerCreateInput[]>(
    () =>
      initialDndLayers.map((layer) => ({
        layerId: layer.id,
        usage: "FOREGROUND",
        zIndex: layer.drawOrder ?? 0,
        visibleAtStart: layer.visibleAtStart,
        options: layer.placementOptions,
      })),
    [initialDndLayers],
  );
  const initialCompositionKey = useMemo(
    () => groupCompositionKey(initialComposition),
    [initialComposition],
  );
  const savedLayerSwitcherTreeKey = useMemo(
    () => JSON.stringify(savedLayerSwitcherTree ?? []),
    [savedLayerSwitcherTree],
  );
  const editingGroup = useMemo(
    () => (group ? { id: group.id, name: group.name } : undefined),
    [group?.id, group?.name],
  );
  const isSaveDirty = isDirty || isCompositionDirty;
  const selectedRoleIds =
    (watch("roleIds") as string[] | undefined) ??
    group?.restrictedToRoles?.map((role) => role.roleId) ??
    [];
  const isDeleteConfirmNameMatching =
    Boolean(group?.name) && deleteConfirmName === group?.name;

  useEffect(() => {
    if (!group) return;

    reset(
      {
        name: group.name ?? "",
        internalName: group.internalName ?? "",
        type: group.type ?? GroupType.LAYER,
        locked: group.locked ?? false,
        roleIds: group.restrictedToRoles?.map((role) => role.roleId) ?? [],
      },
      { keepDirty: false },
    );
    clearErrors();
  }, [group, reset, clearErrors]);

  useEffect(() => {
    compositionBaselineRef.current = null;
    compositionStateKeyRef.current = initialCompositionKey;
    setIsCompositionDirty(false);
    setCompositionLayers(initialComposition);
    setCompositionTree(savedLayerSwitcherTree ?? []);
  }, [
    initialCompositionKey,
    savedLayerSwitcherTreeKey,
    initialComposition,
    savedLayerSwitcherTree,
  ]);

  const handleExternalSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const handleCompositionChange = useCallback(
    (composition: LayerSwitcherComposition) => {
      const layers = composition.layers.map((layer) => ({
        layerId: layer.layerId,
        usage: layer.usage,
        zIndex: layer.zIndex,
        visibleAtStart: layer.visibleAtStart,
        options: layer.options,
      }));
      const tree = composition.layerSwitcherTree;
      const key = groupCompositionKey(layers, tree);

      if (key === compositionStateKeyRef.current) {
        return;
      }
      compositionStateKeyRef.current = key;

      setCompositionLayers(layers);
      setCompositionTree(tree);

      if (compositionBaselineRef.current === null) {
        compositionBaselineRef.current = key;
        return;
      }
      setIsCompositionDirty(key !== compositionBaselineRef.current);
    },
    [],
  );

  const handleUpdateGroup = async (
    groupData: GroupUpdateInput,
    roleIds: string[] = selectedRoleIds,
  ) => {
    try {
      const targetLayerKind: LayerKind =
        groupData.type === GroupType.SEARCH ? "search" : "display";
      const layersForType = compositionLayers.filter((layer) => {
        const known = groupLayers.find(
          (groupLayer) => groupLayer.id === layer.layerId,
        );
        if (!known) return true;
        return known.layerKind === targetLayerKind;
      });

      const groupIdValue = group?.id ?? "";
      const metadataPayload: GroupUpdateInput = {
        name: groupData.name?.trim(),
        internalName: groupData.internalName?.trim(),
        type: groupData.type,
        locked: groupData.locked ?? false,
        restrictedToRoles: roleIds.map((roleId) => ({ roleId })),
      };
      const layersPayload: GroupLayersUpdateInput = {
        layers: layersForType,
        layerSwitcherTree:
          stripEditingGroupFromTree(compositionTree, groupIdValue) ?? [],
      };
      const updatedGroup = await updateGroup({
        groupId: groupIdValue,
        data: metadataPayload,
      });
      await updateGroupLayers({
        groupId: groupIdValue,
        data: layersPayload,
      });
      toast.success(t("groups.updateGroupSuccess", { name: groupData.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
      reset(
        {
          name: updatedGroup.name ?? "",
          internalName: updatedGroup.internalName ?? "",
          type: updatedGroup.type ?? GroupType.LAYER,
          locked: updatedGroup.locked ?? false,
          roleIds:
            updatedGroup.restrictedToRoles?.map((role) => role.roleId) ?? [],
        },
        { keepDirty: false },
      );
      compositionBaselineRef.current = groupCompositionKey(
        layersForType,
        compositionTree,
      );
      compositionStateKeyRef.current = compositionBaselineRef.current;
      setIsCompositionDirty(false);
    } catch (error) {
      console.error("Failed to update group:", error);
      applyGroupFormValidationErrors(error, setError);
      toast.error(getUpdateGroupErrorMessage(error, t, group?.name), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

  const handleDeleteClick = () => {
    if (isDeletingGroup) return;
    setDeleteConfirmName("");
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    if (isDeletingGroup) return;
    setIsDeleteDialogOpen(false);
    setDeleteConfirmName("");
  };

  const handleDeleteGroup = async () => {
    if (!group?.id || !isDeleteConfirmNameMatching) return;

    try {
      await deleteGroup(group.id);
      toast.success(t("groups.deleteGroupSuccess", { name: group.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
      handleCloseDeleteDialog();
      void navigate("/groups");
    } catch (error) {
      console.error("Deletion failed:", error);
      toast.error(getDeleteGroupErrorMessage(error, t, group.name), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleSubmit((data: FieldValues) => {
      const payload: GroupUpdateInput = {
        name: data.name as string | undefined,
        internalName: data.internalName as string | undefined,
        type: data.type as GroupType | undefined,
        locked: (data.locked as boolean | undefined) ?? false,
      };
      const roleIds = Array.isArray(data.roleIds)
        ? (data.roleIds as string[])
        : [];
      void handleUpdateGroup(payload, roleIds);
    })(e);
  };

  if (isLoading) {
    return <SquareSpinnerComponent />;
  }
  if (!group) {
    throw new HttpError(404, "Group not found");
  }
  if (isError) return <div>Error fetching group details.</div>;

  return (
    <Page
      title={
        group?.name
          ? `${t("common.settings")} - ${group.name}`
          : t("common.settings")
      }
    >
      <FormActionPanel
        updateStatus={updateStatus}
        onUpdate={handleExternalSubmit}
        saveButtonText="Spara"
        createdBy={group?.createdBy}
        createdDate={group?.createdDate}
        lastSavedBy={group?.lastSavedBy}
        lastSavedDate={group?.lastSavedDate}
        isDirty={isSaveDirty}
        warning={
          <Box sx={{ mt: 1 }}>
            <Alert severity="warning">{t("groups.deleteGroupWarning")}</Alert>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={handleDeleteClick}
              disabled={isDeletingGroup}
              sx={{
                mt: 2,
                width: "100%",
                justifyContent: "center",
                borderStyle: "dashed",
              }}
            >
              {t("groups.deleteGroupButton")}
            </Button>
          </Box>
        }
      >
        <SettingsPageTabs
          value={activeTab}
          onChange={setActiveTab}
          tabs={[...GROUP_PAGE_TABS]}
        />

        <Box sx={{ display: activeTab === "settings" ? "block" : "none" }}>
          <FormContainer
            onSubmit={onSubmit}
            formRef={formRef}
            noValidate={false}
          >
            <FormPanel title={t("common.information")}>
              <FormFieldGrid>
                <FormFieldRow>
                  <TextField
                    label={t("common.name")}
                    fullWidth
                    variant="outlined"
                    {...register("name", {
                      required: `${t("common.required")}`,
                    })}
                    error={!!errors.name}
                    helperText={
                      (errors.name as { message?: string } | undefined)?.message
                    }
                  />
                </FormFieldRow>
                <FormFieldRow>
                  <TextField
                    label={t("groups.internalName")}
                    fullWidth
                    variant="outlined"
                    {...register("internalName")}
                  />
                </FormFieldRow>
                <FormFieldRow>
                  <Controller
                    name="type"
                    control={control}
                    rules={{ required: `${t("common.required")}` }}
                    render={({ field, fieldState }) => (
                      <SelectWithHelp
                        labelKey="groups.type"
                        helpKey="groups.type"
                        {...field}
                        value={(field.value as string) ?? ""}
                        error={Boolean(fieldState.error)}
                        helperText={fieldState.error?.message}
                      >
                        {Object.keys(GroupType).map((key) => {
                          const value =
                            GroupType[key as keyof typeof GroupType];
                          return (
                            <MenuItem key={key} value={value}>
                              {t(`groupType.${key}`)}
                            </MenuItem>
                          );
                        })}
                      </SelectWithHelp>
                    )}
                  />
                </FormFieldRow>
              </FormFieldGrid>
            </FormPanel>
            <FormPanel title={t("groups.rolesAndLocking")}>
              <FormFieldGrid>
                <FormFieldRow>
                  <Controller
                    name="locked"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(field.value)}
                            onChange={(event) =>
                              field.onChange(event.target.checked)
                            }
                          />
                        }
                        label={
                          <InlineLabelWithHelp
                            label={t("groups.locked")}
                            help={t("groups.lockedHelp")}
                          />
                        }
                      />
                    )}
                  />
                </FormFieldRow>
                <FormFieldRow>
                  <Controller
                    name="roleIds"
                    control={control}
                    render={({ field }) => {
                      const value = Array.isArray(field.value)
                        ? (field.value as string[])
                        : [];
                      const selectedRoles = roles.filter((role) =>
                        value.includes(role.id),
                      );

                      return (
                        <Box>
                          <FieldLabelAbove
                            htmlFor="group-restricted-roles"
                            label={t("groups.restrictedToRoles")}
                            help={t("groups.restrictedToRolesHelp")}
                          />
                          <Autocomplete<Role, true, false, false>
                            id="group-restricted-roles"
                            multiple
                            options={roles}
                            value={selectedRoles}
                            loading={isLoadingRoles}
                            disabled={isLoadingRoles}
                            getOptionLabel={(option) =>
                              option.title || option.code
                            }
                            isOptionEqualToValue={(option, value) =>
                              option.id === value.id
                            }
                            onChange={(_, selected) =>
                              field.onChange(selected.map((role) => role.id))
                            }
                            renderTags={(value, getTagProps) =>
                              value.map((option, index) => (
                                <Chip
                                  label={option.title || option.code}
                                  {...getTagProps({ index })}
                                  key={option.id}
                                />
                              ))
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                placeholder={
                                  isLoadingRoles
                                    ? t("common.loading")
                                    : undefined
                                }
                              />
                            )}
                          />
                        </Box>
                      );
                    }}
                  />
                </FormFieldRow>
              </FormFieldGrid>
            </FormPanel>
            <UsedInMapsPanel
              rows={maps.map((map) => ({ id: map.id, map: map.name }))}
              isLoading={isLoadingMaps}
              emptyMessage={t("groups.usedInMapsNone")}
            />
          </FormContainer>
        </Box>

        <Box
          sx={{
            display: activeTab === "layers" ? "block" : "none",
            minWidth: 0,
            width: "100%",
            maxWidth: "100%",
            overflow: "hidden",
          }}
        >
          {isLoadingGroupLayers ? (
            <Typography>{t("common.loading")}</Typography>
          ) : (
            <>
              {isGroupTypeChangePending && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {t("groups.typeChangePending", {
                    savedType: t(
                      savedGroupType === GroupType.SEARCH
                        ? "groupType.SEARCH"
                        : "groupType.LAYER",
                    ),
                    pendingType: t(
                      watchGroupType === GroupType.SEARCH
                        ? "groupType.SEARCH"
                        : "groupType.LAYER",
                    ),
                  })}
                </Alert>
              )}
              <LayerSwitcherDnDComponent
                embedded
                groupId={groupId}
                editingGroup={editingGroup}
                layerKind={savedLayerKind}
                onCompositionChange={handleCompositionChange}
              />
            </>
          )}
        </Box>
      </FormActionPanel>
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
                void handleDeleteGroup();
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
            values={{ name: group?.name ?? "" }}
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
              values={{ name: group?.name ?? "" }}
              components={{ strong: <strong /> }}
            />
          }
          value={deleteConfirmName}
          onChange={(e) => setDeleteConfirmName(e.target.value)}
          disabled={isDeletingGroup}
        />
      </DialogWrapper>
      <UnsavedChangesGuard when={isSaveDirty} />
    </Page>
  );
}

export default GroupSettings;
