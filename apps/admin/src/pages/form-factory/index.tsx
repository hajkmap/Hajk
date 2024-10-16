import Page from "../../layouts/root/components/page";
import { FieldValues } from "react-hook-form";
import { FormEventHandler, useEffect } from "react";
import INPUT_TYPE from "../../components/form-factory/types/input-type";
import React from "react";
import DynamicFormContainer from "../../components/form-factory/dynamic-form-container";
import FormRenderer from "../../components/form-factory/form-renderer";
import STATIC_TYPE from "../../components/form-factory/types/static-type";
import CONTAINER_TYPE from "../../components/form-factory/types/container-types";
import { DefaultUseForm } from "../../components/form-factory/default-use-form";

export default function FormFactoryPage() {
  const [formContainerData, setFormContainerData] = React.useState<
    DynamicFormContainer<FieldValues>
  >(new DynamicFormContainer<FieldValues>());

  const formContainer = new DynamicFormContainer<FieldValues>();

  const nestedContainer = new DynamicFormContainer<FieldValues>(
    "Panel test",
    CONTAINER_TYPE.PANEL
  );

  nestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "text1",
    title: "First name",
    defaultValue: "",
    registerOptions: {
      required: "This field is required.",
      minLength: {
        value: 5,
        message: "Minimum length is 5 characters.",
      },
    },
  });

  nestedContainer.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "text2",
    title: "Last name",
    defaultValue: "",
    registerOptions: {
      required: "This field is required.",
      minLength: {
        value: 5,
        message: "Minimum length is 5 characters.",
      },
    },
  });

  formContainer.addContainer(nestedContainer);

  const nestedContainer2 = new DynamicFormContainer<FieldValues>(
    "Accordion test",
    CONTAINER_TYPE.ACCORDION,
    { triggerExpanded: false }
  );

  nestedContainer2.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "text11",
    title: "First name 2",
    defaultValue: "",
    registerOptions: {
      required: "This field is required.",
      minLength: {
        value: 5,
        message: "Minimum length is 5 characters.",
      },
    },
  });

  nestedContainer2.addInput({
    type: INPUT_TYPE.TEXTFIELD,
    gridColumns: 6,
    name: "text22",
    title: "Last name 2",
    defaultValue: "",
    registerOptions: {
      required: "This field is required.",
      minLength: {
        value: 5,
        message: "Minimum length is 5 characters.",
      },
    },
  });

  formContainer.addContainer(nestedContainer2);

  const nestedContainer3 = new DynamicFormContainer<FieldValues>(
    "Information",
    CONTAINER_TYPE.ACCORDION,
    { triggerExpanded: false }
  );

  nestedContainer3.addInput({
    type: INPUT_TYPE.TEXTAREA,
    gridColumns: 12,
    name: "textareaTest",
    title: "Textarea",
    defaultValue: "",
  });

  formContainer.addContainer(nestedContainer3);

  formContainer.addInput({
    type: INPUT_TYPE.SELECT,
    gridColumns: 6,
    name: "selectTest",
    title: "Select an Option",
    defaultValue: "1",
    optionList: [
      { title: "Option 1", value: "1" },
      { title: "Option 2", value: "2" },
      { title: "Option 3", value: "3" },
    ],
  });

  formContainer.addStaticElement({
    type: STATIC_TYPE.SPACER,
    gridColumns: 6,
  });

  formContainer.addInput({
    type: INPUT_TYPE.SLIDER,
    gridColumns: 6,
    name: "sliderTest",
    title: "Adjust the Slider",
    defaultValue: 50,
    inputProps: {
      min: 0,
      max: 100,
      step: 1,
    },
  });

  formContainer.addInput({
    type: INPUT_TYPE.RADIO,
    name: "radioGroupTest",
    title: "Select an Option from Radio Group",
    defaultValue: "option1",
    inputProps: {
      row: true,
    },
    optionList: [
      { title: "Radio 1", value: "Radio1" },
      { title: "Radio 2", value: "Radio2" },
      { title: "Radio 3", value: "Radio3" },
      { title: "Radio 4", value: "Radio4" },
    ],
  });

  formContainer.addStaticElement({
    type: STATIC_TYPE.HEADER,
    title: "Header 2",
    gridColumns: 12,
  });

  formContainer.addStaticElement({
    type: STATIC_TYPE.DIVIDER,
    title: "Divider with text",
  });

  formContainer.addStaticElement({
    type: STATIC_TYPE.DIVIDER,
    title: "",
  });

  formContainer.addInput({
    type: INPUT_TYPE.CHECKBOX,
    name: "termsCheckbox",
    title: "Accept Terms and Conditions",
    defaultValue: false,
  });

  formContainer.addInput({
    type: INPUT_TYPE.SWITCH,
    name: "notifications",
    title: "Enable Notifications",
    defaultValue: false,
  });

  formContainer.addInput({
    type: INPUT_TYPE.NUMBER,
    name: "online",
    title: "Number of hours online",
    defaultValue: 5,
    gridColumns: 6,
    inputProps: {
      min: 0,
      max: 10,
      step: 1,
    },
  });

  formContainer.addInput({
    type: INPUT_TYPE.NUMBER,
    name: "live",
    title: "Number of maps",
    defaultValue: 5,
    gridColumns: 6,
    inputProps: {
      min: 0,
      max: 10,
      step: 1,
    },
  });

  useEffect(() => {
    setFormContainerData(formContainer);
  }, []);

  const defaultValues = formContainer.getDefaultValues();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, dirtyFields /*, isDirty, dirtyFields*/ },
    // watch,
  } = DefaultUseForm(defaultValues);

  const onSubmit = (data: FieldValues) => {
    console.log(data);
  };

  const onSubmitHandler: FormEventHandler = (e) => {
    e.preventDefault();
    void handleSubmit(onSubmit)();
  };

  // const formData = watch();

  return (
    <Page title={"Form factory"}>
      <form onSubmit={onSubmitHandler}>
        <FormRenderer
          data={formContainerData}
          register={register}
          control={control}
          errors={errors}
        />
        <p>Will add form button soon</p>

        <p>dirtyFields:</p>
        <pre>{JSON.stringify(dirtyFields ?? {}, null, 2)}</pre>
      </form>
    </Page>
  );
}
