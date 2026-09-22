import { UI_STRINGS } from "../constants";
import SliderNumberField from "./SliderNumberField";

interface OpacityControlProps {
  opacity: number;
  onChange: (opacity: number) => void;
}

function OpacityControl({ opacity, onChange }: OpacityControlProps) {
  return (
    <SliderNumberField
      id="flood-simulator-opacity-label"
      label={UI_STRINGS.opacityLabel}
      inputAriaLabel={UI_STRINGS.opacityAriaLabel}
      value={Math.round(opacity * 100)}
      onChange={(percent) => {
        onChange(percent / 100);
      }}
      min={0}
      max={100}
      step={5}
      decimals={0}
      unit="%"
      inputMode="numeric"
    />
  );
}

export default OpacityControl;
