import DynamicInputSettings from "./dynamic-input-settings";
import { RendererFunction } from "./renderer-props";
import { FieldValues } from "react-hook-form";

class CustomInputSettings<
  TFieldValues extends FieldValues
> extends DynamicInputSettings<TFieldValues> {
  public renderer: RendererFunction<TFieldValues>;

  constructor(
    renderer: RendererFunction<TFieldValues>,
    settings: Partial<DynamicInputSettings<TFieldValues>> = {}
  ) {
    super();
    this.renderer = renderer;

    Object.assign(this, settings);
  }
}

export default CustomInputSettings;
