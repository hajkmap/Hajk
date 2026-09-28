declare module "react-color" {
  import type { ComponentType, CSSProperties } from "react";

  export interface ColorResult {
    hex: string;
  }

  export interface ChromePickerProps {
    color?: string;
    disableAlpha?: boolean;
    onChange?: (color: ColorResult) => void;
    styles?: {
      default?: {
        picker?: CSSProperties;
      };
    };
  }

  export const ChromePicker: ComponentType<ChromePickerProps>;
}
