import { memo, useCallback, useEffect, useRef } from "react";
import { InputAdornment, TextField } from "@mui/material";

interface WindowSizeFieldProps {
  label: string;
  value?: number;
  placeholder?: string;
  onCommit: (next: number | undefined) => void;
  onPendingChange: (
    nextValue: number | undefined,
    committedValue: number | undefined,
  ) => void;
}

function parseInteger(raw: string): number | undefined {
  if (raw.trim() === "") return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function WindowSizeField({
  label,
  value,
  placeholder,
  onCommit,
  onPendingChange,
}: WindowSizeFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef(value != null ? String(value) : "");
  const valueRef = useRef(value);
  const onCommitRef = useRef(onCommit);
  const onPendingChangeRef = useRef(onPendingChange);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    onPendingChangeRef.current = onPendingChange;
  }, [onPendingChange]);

  useEffect(() => {
    const committed = value != null ? String(value) : "";
    const input = inputRef.current;
    if (!input || document.activeElement === input) return;
    if (input.value !== committed) {
      input.value = committed;
      draftRef.current = committed;
    }
  }, [value]);

  const flushCommit = useCallback(() => {
    const raw = inputRef.current?.value ?? draftRef.current;
    const next = parseInteger(raw);
    onPendingChangeRef.current(next, next);
    if (next === valueRef.current) return;
    onCommitRef.current(next);
  }, []);

  useEffect(() => {
    return () => {
      flushCommit();
    };
  }, [flushCommit]);

  return (
    <TextField
      size="small"
      type="text"
      label={label}
      placeholder={placeholder}
      defaultValue={value != null ? String(value) : ""}
      inputRef={inputRef}
      sx={{ flex: 1, minWidth: 0 }}
      slotProps={{
        inputLabel: { shrink: true },
        input: {
          endAdornment: <InputAdornment position="end">px</InputAdornment>,
        },
        htmlInput: {
          inputMode: "numeric",
          pattern: "[0-9]*",
          "aria-label": label,
        },
      }}
      onChange={(event) => {
        const next = event.target.value;
        if (next !== "" && !/^\d+$/.test(next)) {
          event.target.value = draftRef.current;
          return;
        }
        draftRef.current = next;
        const parsed = parseInteger(next);
        onPendingChangeRef.current(parsed, valueRef.current);
      }}
      onBlur={flushCommit}
      onKeyDown={(event) => {
        if (event.key === "Enter") flushCommit();
      }}
    />
  );
}

export default memo(WindowSizeField);
