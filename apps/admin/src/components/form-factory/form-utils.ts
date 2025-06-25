import { FormEventHandler } from "react";
import {
  FieldErrors,
  FieldNamesMarkedBoolean,
  FieldValues,
  UseFormHandleSubmit,
} from "react-hook-form";
import { FormElement } from "./dynamic-form-container";
import DynamicInputSettings from "./types/dynamic-input-settings";
import DynamicFormContainer from "./dynamic-form-container";

/*

The function below hopefully simplifies the process of handling form submission.


Using the function results in this syntax:

const onSubmit = createOnSubmitHandler({
  handleSubmit, // Pass handleSubmit from react-hook-form
  dirtyFields,  // Pass dirtyFields from formState
  onValid: (data, dirtyData) => {
    console.log("All Data: ", data);
    console.log("Dirty Data: ", dirtyData);
    console.log("Let's send some data to the server!!");
  },
  onInvalid: (errors) => {
    console.log("Errors: ", errors);
  }
});

  and in form:

  <form onSubmit={onSubmit}>

*/

interface OnSubmitHandlerArgs {
  handleSubmit: UseFormHandleSubmit<FieldValues>;
  dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<FieldValues>>>;
  onValid: (data: FieldValues, dirtyData: FieldValues) => void;
  onInvalid?: (errors: FieldErrors<FieldValues>) => void;
}

export const createOnSubmitHandler = ({
  handleSubmit,
  dirtyFields,
  onValid,
  onInvalid,
}: OnSubmitHandlerArgs): FormEventHandler<HTMLFormElement> => {
  return (e) => {
    e.preventDefault();

    void handleSubmit(
      (data: FieldValues) => {
        const dirtyFieldsData = Object.keys(dirtyFields).reduce(
          (acc: Record<string, unknown>, key) => {
            if (dirtyFields[key]) {
              acc[key] = data[key];
            }
            return acc;
          },
          {}
        );

        onValid(data, dirtyFieldsData);
      },
      (errors: FieldErrors<FieldValues>) => {
        if (onInvalid) {
          onInvalid(errors);
        }
      }
    )();
  };
};

// helper functions for form elements

export const isFormElementInput = <TFieldValues extends FieldValues>(
  item: FormElement<TFieldValues>
): boolean => {
  return (
    item.kind === "DynamicInputSettings" || item.kind === "CustomInputSettings"
  );
};

export const isFormElementContainer = <TFieldValues extends FieldValues>(
  item: FormElement<TFieldValues>
): boolean => {
  return item.kind === "DynamicFormContainer";
};

export const isFormElementStatic = <TFieldValues extends FieldValues>(
  item: FormElement<TFieldValues>
): boolean => {
  return item.kind === "StaticElement";
};

// Function to get the value of a FormElement by name (including custom inputs)
export const getFormElementValue = <TFieldValues extends FieldValues>(
  elementName: string,
  elements: FormElement<TFieldValues>[],
  formGetValues: () => Record<string, unknown>
): unknown => {
  const searchForElement = (elements: FormElement<TFieldValues>[]): unknown => {
    for (const item of elements) {
      if (isFormElementInput(item)) {
        // Note: Custom inputs are also handled by isFormElementInput(item)
        // because CustomInputSettings extends DynamicInputSettings
        const inputItem = item as DynamicInputSettings<TFieldValues>;
        if (inputItem.name === elementName) {
          // Get the current value from the form
          return formGetValues()[elementName];
        }
      } else if (isFormElementContainer(item)) {
        const container = item as DynamicFormContainer<TFieldValues>;
        const result = searchForElement(container.getElements());
        if (result !== undefined) {
          return result;
        }
      }
    }
    return undefined;
  };

  return searchForElement(elements);
};
