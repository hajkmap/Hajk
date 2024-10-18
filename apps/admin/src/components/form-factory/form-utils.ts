import { FormEventHandler } from "react";
import { FieldErrors, FieldNamesMarkedBoolean, FieldValues, UseFormHandleSubmit } from "react-hook-form"



/*

The function below hopefully simplifies the process of handling form submission.


Using the function results in this syntax:

  const onSubmit = createOnSubmitHandler(
    handleSubmit, // Pass handleSubmit from react-hook-form
    dirtyFields, // Pass dirtyFields from formState
    (data, dirtyData) => {
      console.log("All Data: ", data);
      console.log("Dirty Data: ", dirtyData);
    },
    (errors) => {
      console.log("Errors: ", errors);
    }
  );

  and in form:

  <form onSubmit={onSubmit}>

*/

export const createOnSubmitHandler = (
    handleSubmit: UseFormHandleSubmit<FieldValues>,
    dirtyFields: Partial<Readonly<FieldNamesMarkedBoolean<FieldValues>>>,
    successCallback: (
      data: FieldValues,
      dirtyData: FieldValues
    ) => void,
    errorCallback: (errors: FieldErrors<FieldValues>) => void
  ): FormEventHandler<HTMLFormElement> => {
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

          successCallback(data, dirtyFieldsData);
        },
        (errors: FieldErrors<FieldValues>) => {
          if (errorCallback) {
            errorCallback(errors);
          }
        }
      )();
    };
  };