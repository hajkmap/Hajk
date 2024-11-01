import {
  Control,
  Controller,
  FieldValues,
  Path,
  PathValue,
  UseFormRegister,
} from "react-hook-form";
import DynamicInputSettings from "./types/dynamic-input-settings";
import CustomInputSettings from "./types/custom-input-settings";
import { getRenderer } from "./renderers";

// Accept both DynamicInputSettings and CustomInputSettings
interface DynamicInputComponentProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  register: UseFormRegister<TFieldValues>;
  settings:
    | DynamicInputSettings<TFieldValues>
    | CustomInputSettings<TFieldValues>;
  errorMessage?: string | null;
}

export const DynamicInputComponent = <TFieldValues extends FieldValues>({
  control,
  settings,
  errorMessage,
}: DynamicInputComponentProps<TFieldValues>) => {
  const renderer =
    (settings as CustomInputSettings<TFieldValues>).renderer ||
    getRenderer(settings.type);

  if (!renderer) {
    console.error(`Renderer for type "${settings.type}" not found.`);
    return <div>Error: Renderer not found</div>;
  }

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
        return (
          renderer({
            field,
            slotProps: settings.slotProps,
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
