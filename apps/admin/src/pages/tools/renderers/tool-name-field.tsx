import { Control, FieldValues, useWatch } from "react-hook-form";
import { TextOption } from "./tool-option-fields";

/** Tool types whose plugin reads its heading from `options.title`. */
const TYPES_WITH_TITLE = new Set([
  "documenthandler",
  "floodsimulator",
  "layerswitcher",
]);

interface ToolNameFieldProps {
  control: Control<FieldValues>;
}

/** `internalName` is only shown in admin. `options.title` is shown on the map. */
export default function ToolNameField({ control }: ToolNameFieldProps) {
  const type = useWatch({ control, name: "type" }) as string | undefined;

  return (
    <>
      <TextOption
        control={control}
        name="internalName"
        labelKey="layers.internalName"
        helpKey="tools.internalNameHelp"
      />
      {type && TYPES_WITH_TITLE.has(type) && (
        <TextOption
          control={control}
          name="options.title"
          labelKey="tools.title"
          helpKey="tools.titleHelp"
        />
      )}
    </>
  );
}
