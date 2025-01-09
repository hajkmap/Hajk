import { ControllerRenderProps, Path, FieldValues } from "react-hook-form";
import React, { ReactElement } from "react";

export type RenderFunction<TFieldValues extends FieldValues> = (
  props: RenderProps<TFieldValues>
) => ReactElement | null;

export interface RenderProps<TFieldValues extends FieldValues> {
  field?: ControllerRenderProps<TFieldValues, Path<TFieldValues>>;
  inputProps?: Record<string, unknown>;
  slotProps?: {
    input?: { endAdornment?: React.ReactNode; style?: React.CSSProperties };
    inputLabel?: { style?: React.CSSProperties };
  };
  errorMessage?: string | null;
  optionList?: { title: string; value: unknown }[];
  title?: string;
  element?: React.ReactNode;
  name?: string;
  disabled?: boolean;
}
