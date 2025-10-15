import { useState, useRef } from "react";
import { useParams } from "react-router";
import { useTheme } from "@mui/material";
import DynamicFormContainer from "../../components/form-factory/dynamic-form-container";
import { FieldValues } from "react-hook-form";
import CONTAINER_TYPE from "../../components/form-factory/types/container-types";
import { useTranslation } from "react-i18next";
import { DefaultUseForm } from "../../components/form-factory/default-use-form";
import INPUT_TYPE from "../../components/form-factory/types/input-type";
import Page from "../../layouts/root/components/page";
import FormRenderer from "../../components/form-factory/form-renderer";
import { createOnSubmitHandler } from "../../components/form-factory/form-utils";
import { GroupType, GroupUpdateInput } from "../../api/groups";
import FormActionPanel from "../../components/form-action-panel";
import LayerSwitcherOrderList from "./components/layerswitcher-dnd-orderlist";
import { useGroupById } from "../../api/groups";
import { SquareSpinnerComponent } from "../../components/progress/square-progress";
import { HttpError } from "../../lib/http-error";
import { useUpdateGroup, useDeleteGroup } from "../../api/groups";
import { toast } from "react-toastify";

function GroupSettings() {
  const formRef = useRef<HTMLFormElement | null>(null);
  const { t } = useTranslation();
  const { groupId } = useParams<{ groupId: string }>();
  const { mutateAsync: updateGroup, status: updateStatus } = useUpdateGroup();
  const { mutateAsync: deleteGroup, status: deleteStatus } = useDeleteGroup();
  const { data: group, isLoading, isError } = useGroupById(groupId ?? "");
  const { palette } = useTheme();

  const [updateGroupDefaultData] = useState<DynamicFormContainer<FieldValues>>(
    new DynamicFormContainer<FieldValues>()
  );

  const defaultValues = updateGroupDefaultData.getDefaultValues();
  const {
    register,
    handleSubmit,
    control,
    getValues,
    formState: { errors, dirtyFields },
  } = DefaultUseForm(defaultValues);
  const updateGroupContainer = new DynamicFormContainer<FieldValues>();
  const groupInformationSettings = new DynamicFormContainer<FieldValues>(
    t("common.information"),
    CONTAINER_TYPE.PANEL
  );

  groupInformationSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 12,
    name: "name",
    title: `${t("common.name")}`,
    defaultValue: group?.name,
  });
  groupInformationSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "internalName",
    title: `${t("groups.internalName")}`,
    defaultValue: group?.internalName,
  });
  groupInformationSettings.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 6,
    name: "type",
    title: `${t("groups.type")}`,
    defaultValue: group?.type,
    optionList: Object.keys(GroupType).map((key) => {
      const value = GroupType[key as keyof typeof GroupType];
      return {
        title: t(`groupType.${key}`),
        value: value,
      };
    }),
  });

  updateGroupContainer.addContainer([groupInformationSettings]);

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

  const onSubmit = createOnSubmitHandler({
    handleSubmit,
    dirtyFields,
    onValid: (data: FieldValues) => {
      const groupData = data as GroupUpdateInput;
      void handleUpdateGroup(groupData);
    },
  });

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
      >
        <form ref={formRef} onSubmit={onSubmit}>
          <FormRenderer
            formControls={updateGroupContainer}
            formGetValues={getValues}
            register={register}
            control={control}
            errors={errors}
          />
          <LayerSwitcherOrderList />
        </form>
      </FormActionPanel>
    </Page>
  );
}

export default GroupSettings;
