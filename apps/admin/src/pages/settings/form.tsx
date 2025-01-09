import { useState, useEffect } from "react";
import DynamicFormContainer from "../../components/form-factory/dynamic-form-container";
import { FieldValues } from "react-hook-form";
import CONTAINER_TYPE from "../../components/form-factory/types/container-types";
import INPUT_TYPE from "../../components/form-factory/types/input-type";
import { DefaultUseForm } from "../../components/form-factory/default-use-form";
import FormRenderer from "../../components/form-factory/form-renderer";
import { createOnSubmitHandler } from "../../components/form-factory/form-utils";
import { useTranslation } from "react-i18next";

export default function SettingsForm() {
  const { t, i18n } = useTranslation();

  const [settingsContainerData, setSettingsContainerData] = useState<
    DynamicFormContainer<FieldValues>
  >(new DynamicFormContainer<FieldValues>());

  const createTranslatedSettingsContainer = () => {
    const settingsContainer = new DynamicFormContainer<FieldValues>();

    const accordionContainer = new DynamicFormContainer<FieldValues>(
      t("settings.common.title"),
      CONTAINER_TYPE.ACCORDION
    );
    const accordionContainer2 = new DynamicFormContainer<FieldValues>(
      t("settings.service.title"),
      CONTAINER_TYPE.ACCORDION
    );
    const accordionContainer3 = new DynamicFormContainer<FieldValues>(
      t("settings.layer.title"),
      CONTAINER_TYPE.ACCORDION
    );
    const accordionContainer4 = new DynamicFormContainer<FieldValues>(
      t("settings.map.title"),
      CONTAINER_TYPE.ACCORDION
    );
    const accordionContainer5 = new DynamicFormContainer<FieldValues>(
      t("settings.tools.title"),
      CONTAINER_TYPE.ACCORDION
    );
    const accordionContainer6 = new DynamicFormContainer<FieldValues>(
      t("settings.authorization.title"),
      CONTAINER_TYPE.ACCORDION
    );

    accordionContainer.addInput({
      type: INPUT_TYPE.SELECT,
      gridColumns: 6,
      name: "availableCoordinateSystem",
      title: t("settings.available.coordinateSystem"),
      defaultValue: "1",
      optionList: [
        { title: "Option 1", value: "1" },
        { title: "Option 2", value: "2" },
        { title: "Option 3", value: "3" },
      ],
    });

    accordionContainer.addInput({
      type: INPUT_TYPE.SELECT,
      gridColumns: 6,
      name: "preSelectedCoordinateSystem",
      title: t("settings.preSelected.coordinateSystem"),
      defaultValue: "1",
      optionList: [
        { title: "Option 1", value: "1" },
        { title: "Option 2", value: "2" },
        { title: "Option 3", value: "3" },
      ],
    });

    settingsContainer.addContainer(accordionContainer);
    settingsContainer.addContainer(accordionContainer2);
    settingsContainer.addContainer(accordionContainer3);
    settingsContainer.addContainer(accordionContainer4);
    settingsContainer.addContainer(accordionContainer5);
    settingsContainer.addContainer(accordionContainer6);

    return settingsContainer;
  };

  useEffect(() => {
    setSettingsContainerData(createTranslatedSettingsContainer());
  }, [i18n.language]);

  const defaultValues = settingsContainerData.getDefaultValues();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, dirtyFields },
  } = DefaultUseForm(defaultValues);

  const onSubmit = createOnSubmitHandler({
    handleSubmit,
    dirtyFields,
    onValid: (data, dirtyData) => {
      console.log("All Data: ", data);
      console.log("Dirty Data: ", dirtyData);
    },
    onInvalid: (errors) => {
      console.log("Errors: ", errors);
    },
  });

  return (
    <form onSubmit={onSubmit}>
      <FormRenderer
        data={settingsContainerData}
        register={register}
        control={control}
        errors={errors}
      />
    </form>
  );
}
