import { useRef } from "react";
import { useParams } from "react-router";
import {
  useTheme,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { Controller, FieldValues, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import Page from "../../layouts/root/components/page";
import { GroupType, GroupUpdateInput } from "../../api/groups";
import FormActionPanel from "../../components/form-action-panel";
import LayerSwitcherDnD from "./components/layerswitcher-dnd";
import { useGroupById } from "../../api/groups";
import { SquareSpinnerComponent } from "../../components/progress/square-progress";
import { HttpError } from "../../lib/http-error";
import {
  useUpdateGroup,
  //useDeleteGroup
} from "../../api/groups";
import { toast } from "react-toastify";
import FormContainer from "../../components/form-components/form-container";
import FormPanel from "../../components/form-components/form-panel";

function GroupSettings() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const { t } = useTranslation();
  const { groupId } = useParams<{ groupId: string }>();
  const { mutateAsync: updateGroup, status: updateStatus } = useUpdateGroup();
  //const { mutateAsync: deleteGroup, status: deleteStatus } = useDeleteGroup();
  const { data: group, isLoading, isError } = useGroupById(groupId ?? "");
  const { palette } = useTheme();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FieldValues>({
    defaultValues: {},
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const handleExternalSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  };

  const handleUpdateGroup = async (groupData: GroupUpdateInput) => {
    try {
      const payload = {
        name: groupData.name,
        internalName: groupData.internalName,
        type: groupData.type,
      };
      await updateGroup({
        groupId: group?.id ?? "",
        data: payload,
      });
      toast.success(t("groups.updateGroupSuccess", { name: groupData.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    } catch (error) {
      console.error("Failed to update group:", error);
      toast.error(t("groups.updateGroupFailed", { name: group?.name }), {
        position: "bottom-left",
        theme: palette.mode,
        hideProgressBar: true,
      });
    }
  };
  // TODO?: Add delete group
  /*
  const handleDeleteGroup = async () => {
    if (!isLoading && group?.id) {
      try {
        await deleteGroup(group.id);
        toast.success(t("groups.deleteGroupSuccess", { name: group.name }), {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        });
      } catch (error) {
        console.error("Deletion failed:", error);
        toast.error(t("groups.deleteGroupFailed", { name: group.name }), {
          position: "bottom-left",
          theme: palette.mode,
          hideProgressBar: true,
        });
      }
    } else {
      console.error("Group data is still loading or unavailable.");
    }
  };
  */
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    void handleSubmit((data: FieldValues) => {
      const payload: GroupUpdateInput = {
        name: data.name as string | undefined,
        internalName: data.internalName as string | undefined,
        type: data.type as GroupType | undefined,
      };
      void handleUpdateGroup(payload);
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
    <Page title={t("common.settings")}>
      <FormActionPanel
        updateStatus={updateStatus}
        onUpdate={handleExternalSubmit}
        saveButtonText="Spara"
        createdBy={group?.createdBy}
        createdDate={group?.createdDate}
        lastSavedBy={group?.lastSavedBy}
        lastSavedDate={group?.lastSavedDate}
      >
        <FormContainer onSubmit={onSubmit} formRef={formRef} noValidate={false}>
          <FormPanel title={t("common.information")}>
            <Grid container>
              <Grid size={12}>
                <TextField
                  label={t("common.name")}
                  fullWidth
                  defaultValue={group?.name}
                  {...register("name", {
                    required: `${t("common.required")}`,
                  })}
                  error={!!errors.name}
                  helperText={
                    (errors.name as { message?: string } | undefined)?.message
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label={t("groups.internalName")}
                  fullWidth
                  defaultValue={group?.internalName}
                  {...register("internalName")}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="group-type-label">
                    {t("groups.type")}
                  </InputLabel>
                  <Controller
                    name="type"
                    control={control}
                    defaultValue={group?.type}
                    render={({ field }) => (
                      <Select
                        labelId="group-type-label"
                        label={t("groups.type")}
                        {...field}
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
                      </Select>
                    )}
                  />
                </FormControl>
              </Grid>
            </Grid>
          </FormPanel>
        </FormContainer>
        <LayerSwitcherDnD />
      </FormActionPanel>
    </Page>
  );
}

export default GroupSettings;
