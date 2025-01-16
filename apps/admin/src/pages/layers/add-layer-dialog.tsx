import React, { useState, useEffect } from "react";
import { Button } from "@mui/material";
import DialogWrapper from "../../components/flexible-dialog";
import FormRenderer from "../../components/form-factory/form-renderer";
import { DefaultUseForm } from "../../components/form-factory/default-use-form";
import { createOnSubmitHandler } from "../../components/form-factory/form-utils";
import DynamicFormContainer from "../../components/form-factory/dynamic-form-container";
import INPUT_TYPE from "../../components/form-factory/types/input-type";
import { useTranslation } from "react-i18next";

export default function AddLayerDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [layerForm, setLayerForm] = useState(new DynamicFormContainer());

  useEffect(() => {
    const form = new DynamicFormContainer();
    form.addInput({
      type: INPUT_TYPE.TEXTFIELD,
      gridColumns: 12,
      name: "url",
      title: "URL",
      defaultValue: "",
      registerOptions: { required: t("common.required") },
    });
    setLayerForm(form);
  }, [t]);

  const defaultValues = layerForm.getDefaultValues();
  const { register, handleSubmit, control, formState } =
    DefaultUseForm(defaultValues);

  const onSubmit = createOnSubmitHandler({
    handleSubmit,
    dirtyFields: formState.dirtyFields,
    onValid: (data) => console.log("Valid data:", data),
    onInvalid: (errors) => console.log("Errors:", errors),
  });

  return (
    <DialogWrapper
      open={open}
      onClose={onClose}
      onSubmit={onSubmit}
      title={t("layers.dialog.title")}
      actions={
        <>
          <Button onClick={onClose}>{t("common.dialog.closeBtn")}</Button>
          <Button type="submit">{t("common.dialog.saveBtn")}</Button>
        </>
      }
    >
      <FormRenderer
        data={layerForm}
        register={register}
        control={control}
        errors={formState.errors}
      />
    </DialogWrapper>
  );
}
