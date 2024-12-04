import { useState, useEffect } from "react";
import Page from "../../layouts/root/components/page";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";
import DynamicFormContainer from "../../components/form-factory/dynamic-form-container";
import { FieldValues } from "react-hook-form";
import CONTAINER_TYPE from "../../components/form-factory/types/container-types";
import INPUT_TYPE from "../../components/form-factory/types/input-type";
import FormRenderer from "../../components/form-factory/form-renderer";
import { createOnSubmitHandler } from "../../components/form-factory/form-utils";
import { DefaultUseForm } from "../../components/form-factory/default-use-form";

export default function LayerSettings() {
  const { t } = useTranslation();

  const [formLayerData, setFormLayerData] = useState<
    DynamicFormContainer<FieldValues>
  >(new DynamicFormContainer<FieldValues>());

  const layerSettingsFormContainer = new DynamicFormContainer<FieldValues>();
  const panelNestedContainer = new DynamicFormContainer<FieldValues>(
    "",
    CONTAINER_TYPE.PANEL
  );

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 12,
    name: "name",
    title: `${t("common.name")}`,
    defaultValue: "",
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "service",
    title: `Tjänst`,
    defaultValue: "Byggnader v3 WMS",
    registerOptions: { required: `${t("common.required")}` },
    optionList: [{ title: "Byggnader v3 WMS", value: "Byggnader v3 WMS" }],
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 8,
    name: "layerService",
    title: `Lagernamn i tjänsten`,
    defaultValue: "",
    registerOptions: { required: `${t("common.required")}` },
    optionList: [{ title: "Testlayer", value: "Testlayer" }],
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "adminName",
    title: `Internt adminnamn`,
    defaultValue: "",
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "copyRight",
    title: `Upphovsrätt`,
    defaultValue: "",
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 8,
    name: "descriptionLayer",
    title: `Beskrivning av lagret`,
    defaultValue: "",
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "keyWord",
    title: `Nyckelord`,
    defaultValue: "",
  });

  panelNestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 8,
    name: "category",
    title: `Kategori`,
    defaultValue: "",
  });

  layerSettingsFormContainer.addContainer(panelNestedContainer);

  const defaultValues = formLayerData.getDefaultValues();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, dirtyFields },
  } = DefaultUseForm(defaultValues);

  const onSubmit = createOnSubmitHandler({
    handleSubmit,
    dirtyFields,
    onValid: (data: FieldValues) => {
      console.log("Data: ", data);
    },
  });

  useEffect(() => {
    setFormLayerData(layerSettingsFormContainer);
  }, []);

  return (
    <Page title={t("common.settings")}>
      <Box>
        <form onSubmit={onSubmit}>
          <FormRenderer
            data={formLayerData}
            register={register}
            control={control}
            errors={errors}
          />
        </form>
      </Box>
    </Page>
  );
}
