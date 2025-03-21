import { useState } from "react";
import DynamicFormContainer from "../../components/form-factory/dynamic-form-container";
import { FieldValues } from "react-hook-form";
import CONTAINER_TYPE from "../../components/form-factory/types/container-types";
import { useTranslation } from "react-i18next";
import { DefaultUseForm } from "../../components/form-factory/default-use-form";
import INPUT_TYPE from "../../components/form-factory/types/input-type";
import Page from "../../layouts/root/components/page";
import FormRenderer from "../../components/form-factory/form-renderer";
import { createOnSubmitHandler } from "../../components/form-factory/form-utils";
import { GroupType } from "../../api/groups";

function GroupSettings() {
  const { t } = useTranslation();

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
    defaultValue: "",
  });
  groupInformationSettings.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "internalName",
    title: "internal name",
    defaultValue: "",
  });
  groupInformationSettings.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 6,
    name: "type",
    title: "Typ av lager",
    defaultValue: "",
    optionList: Object.keys(GroupType).map((type) => ({
      title: type,
      value: type,
    })),
  });

  updateGroupContainer.addContainer([groupInformationSettings]);

  const onSubmit = createOnSubmitHandler({
    handleSubmit,
    dirtyFields,
    onValid: (data, dirtyData) => {
      console.log("All Data: ", data);
      console.log("Dirty Data: ", dirtyData);
      console.log("Let's send some data to the server!!");
    },
    onInvalid: (errors) => {
      console.log("Errors: ", errors);
    },
  });
  return (
    <Page title={t("common.settings")}>
      <form onSubmit={onSubmit}>
        <FormRenderer
          formControls={updateGroupContainer}
          formGetValues={getValues}
          register={register}
          control={control}
          errors={errors}
        />
      </form>
    </Page>
  );
}

export default GroupSettings;
