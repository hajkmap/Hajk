import { FormEventHandler } from "react";
import {
  FieldErrors,
  FieldNamesMarkedBoolean,
  FieldValues,
  UseFormHandleSubmit,
} from "react-hook-form";

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
