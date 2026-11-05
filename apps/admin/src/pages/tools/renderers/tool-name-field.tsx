import { Control, FieldValues } from "react-hook-form";
import { TextOption } from "./tool-option-fields";

interface ToolNameFieldProps {
  control: Control<FieldValues>;
}

/** `options.title` is shown on the map. `internalName` is only shown in admin. */
export default function ToolNameField({ control }: ToolNameFieldProps) {
  return (
    <>
      <TextOption
        control={control}
        name="options.title"
        labelKey="tools.title"
        helpKey="tools.titleHelp"
      />
      <TextOption
        control={control}
        name="internalName"
        labelKey="layers.internalName"
        helpKey="tools.internalNameHelp"
      />
    </>
  );
}
