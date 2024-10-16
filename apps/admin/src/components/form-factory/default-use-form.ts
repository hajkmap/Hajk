import { useForm, FieldValues, UseFormProps, UseFormReturn, DefaultValues } from "react-hook-form";

// Wrapper function for useForm that enforces specific configurations
export const DefaultUseForm = <TFieldValues extends FieldValues = FieldValues>(
  defaultValues: DefaultValues<TFieldValues>,
  options?: Omit<UseFormProps<TFieldValues>, "defaultValues" | "mode">
): UseFormReturn<TFieldValues> => {
  return useForm<TFieldValues>({
    defaultValues,
    mode: "onChange",  // Force the mode to "onChange"
    ...options,        // Pass in any other options
  });
};