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
  public slotProps?: {
    input?: { endAdornment?: React.ReactNode; style?: React.CSSProperties };
    inputLabel?: { style?: React.CSSProperties };
  };
  public inputProps?: Record<string, unknown>;
  public defaultValue?: TFieldValues[Path<TFieldValues>];
  public optionList?: { title: string; value: unknown }[];
  public kind? = "DynamicInputSettings";
  public disabled? = false;
}

new DynamicInputSettings();

export default DynamicInputSettings;
