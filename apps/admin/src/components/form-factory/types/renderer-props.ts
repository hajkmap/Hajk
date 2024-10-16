import { ControllerRenderProps, Path, FieldValues } from "react-hook-form";
import React from "react";

export interface RendererProps<TFieldValues extends FieldValues> {
  field?: ControllerRenderProps<TFieldValues, Path<TFieldValues>>;
  inputProps?: Record<string, unknown>;
  errorMessage?: string | null;
  optionList?: { title: string; value: unknown }[];
  title?: string;
  element?: React.ReactNode;
  name?: string;
}