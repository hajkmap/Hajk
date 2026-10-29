import { Radio } from "@mui/material";
import type { GridRowCheckboxProps } from "@mui/x-data-grid";

/**
 * A row's selection as a radio button, for the DataGrid's `rowCheckbox` slot
 * where only one row can be chosen. The grid's own selection cell still runs
 * it: state, change, keyboard and label.
 */
export default function GridRowRadio({
  ref,
  checked,
  disabled,
  onChange,
  onClick,
  onMouseDown,
  onKeyDown,
  tabIndex,
  className,
  slotProps,
}: GridRowCheckboxProps) {
  return (
    <Radio
      ref={ref}
      size="small"
      checked={checked}
      disabled={disabled}
      onChange={onChange}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onKeyDown={onKeyDown}
      tabIndex={tabIndex}
      className={className}
      slotProps={{ input: slotProps?.htmlInput }}
    />
  );
}
