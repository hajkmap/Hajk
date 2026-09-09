import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
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
import Page from "../../layouts/root/components/page";
import { GroupType, GroupUpdateInput } from "../../api/groups";
import FormActionPanel from "../../components/form-action-panel";
import {
  useDeleteGroup,
  useGroupById,
  useMapsByGroupId,
} from "../../api/groups";
import { useRoles } from "../../api/users";
import type { Role } from "../../api/users";
import type { Map } from "../../api/maps";
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
import UnsavedChangesGuard from "../../components/unsaved-changes-guard";

const EMPTY_MAPS: Map[] = [];
const EMPTY_ROLES: Role[] = [];

function GroupSettings() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const { t } = useTranslation();
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { mutateAsync: updateGroup, status: updateStatus } = useUpdateGroup();
  const { mutateAsync: deleteGroup, isPending: isDeletingGroup } =
    useDeleteGroup();
  const { data: group, isLoading, isError } = useGroupById(groupId ?? "");
  const { data: mapsData, isLoading: isLoadingMaps } = useMapsByGroupId(
    groupId ?? "",
  );
  const { data: rolesData, isLoading: isLoadingRoles } = useRoles();
  const maps = mapsData ?? EMPTY_MAPS;
  const roles = rolesData ?? EMPTY_ROLES;
  const { palette } = useTheme();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");

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

  const handleExternalSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const handleUpdateGroup = async (
    groupData: GroupUpdateInput,
    roleIds: string[] = selectedRoleIds,
  ) => {
    try {
      const groupIdValue = group?.id ?? "";
      const metadataPayload: GroupUpdateInput = {
        name: groupData.name?.trim(),
        internalName: groupData.internalName?.trim(),
        type: groupData.type,
        locked: groupData.locked ?? false,
        restrictedToRoles: roleIds.map((roleId) => ({ roleId })),
      };
      const updatedGroup = await updateGroup({
        groupId: groupIdValue,
        data: metadataPayload,
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
        isDirty={isDirty}
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
      <UnsavedChangesGuard when={isDirty} />
    </Page>
  );
}

export default GroupSettings;
