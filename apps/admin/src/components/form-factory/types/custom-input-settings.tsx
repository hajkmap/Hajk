import DynamicInputSettings from "./dynamic-input-settings";
import { RenderFunction } from "./render";
import { FieldValues } from "react-hook-form";

class CustomInputSettings<
  TFieldValues extends FieldValues
> extends DynamicInputSettings<TFieldValues> {
  public renderer: RenderFunction<TFieldValues>;

  constructor(
    renderer: RenderFunction<TFieldValues>,
    settings: Partial<DynamicInputSettings<TFieldValues>> = {}
  ) {
    super();
    this.renderer = renderer;

    Object.assign(this, settings);
  }
}

export default CustomInputSettings;
