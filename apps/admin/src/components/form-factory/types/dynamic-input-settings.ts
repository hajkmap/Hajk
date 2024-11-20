import { FieldValues, Path, RegisterOptions } from "react-hook-form";
import INPUT_TYPE from "./input-type";

class DynamicInputSettings<TFieldValues extends FieldValues> {
  public type!: INPUT_TYPE;
  public name!: Path<TFieldValues>;
  public title!: string;
  public helpText?: string;
  public gridColumns? = 12;
  public registerOptions?: RegisterOptions<TFieldValues>;
  public props?: Record<string, unknown>;
  public inputProps?: Record<string, unknown>;
  public defaultValue?: TFieldValues[Path<TFieldValues>];
  public optionList?: { title: string; value: unknown }[];
  public kind? = "DynamicInputSettings";
}

new DynamicInputSettings();

export default DynamicInputSettings;
