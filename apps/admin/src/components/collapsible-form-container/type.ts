export type INPUT_TYPE =
  | "TEXT"
  | "NUMBER"
  | "CHECKBOX"
  | "RADIO"
  | "SELECT"
  | "SLIDER"
  | "DATE";

export interface Input {
  type: INPUT_TYPE;
  key: string;
  title: string;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string | number; key?: string }[];
  showToolTip?: boolean;
  toolTipDescription?: string;
}

export interface InputFieldProps {
  input: Input;
  value: string | number | boolean | Record<string, boolean>;
  onChange: (
    key: string,
    value: string | number | boolean | Record<string, boolean>
  ) => void;
}

export interface AccordionProps {
  title: string;
  description?: string;
  inputs: Input[];
  values: Record<string, string | number | boolean | Record<string, boolean>>;
  setValues: (
    key: string,
    value: string | number | boolean | Record<string, boolean>
  ) => void;
}
