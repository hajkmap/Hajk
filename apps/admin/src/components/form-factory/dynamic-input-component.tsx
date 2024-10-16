import {
  Control,
  Controller,
  FieldValues,
  Path,
  PathValue,
  UseFormRegister,
} from "react-hook-form";
import DynamicInputSettings from "./types/dynamic-input-settings";
import { getRenderer } from "./renderers";

interface DynamicInputComponentProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
  settings: DynamicInputSettings<TFieldValues>;
  errorMessage?: string | null;
}

export const DynamicInputComponent = <TFieldValues extends FieldValues>({
  control,
  settings,
  errorMessage,
}: DynamicInputComponentProps<TFieldValues>) => {
  return (
    <Controller
      name={settings.name}
      control={control}
      defaultValue={
        settings.defaultValue as
          | PathValue<TFieldValues, Path<TFieldValues>>
          | undefined
      }
      rules={settings.registerOptions}
      render={({ field }) => {
        const renderer = getRenderer(settings.type);

        return (
          renderer({
            field,
            inputProps: settings.inputProps,
            errorMessage,
            optionList: settings.optionList,
            title: settings.title,
            name: settings.name,
          }) ?? <div />
        );
      }}
    />
  );
};
