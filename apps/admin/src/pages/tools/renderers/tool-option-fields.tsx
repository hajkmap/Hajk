import { useState } from "react";
import { Checkbox, FormControlLabel, TextField } from "@mui/material";
import { Control, Controller, FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormFieldRow } from "../../../components/form-components/form-field-grid";
import { TextFieldWithHelp } from "../../../components/form-components/field-label-with-help";
import { FieldLabelWithHelp } from "../../../components/form-components/field-help-tooltip";

interface OptionFieldProps {
  control: Control<FieldValues>;
  name: string;
  labelKey: string;
  helpKey?: string;
}

export function parseNumberList(text: string): number[] | null {
  const numbers = text
    .split(",")
    .map((part) => parseFloat(part.trim()))
    .filter((n) => Number.isFinite(n));
  return numbers.length > 0 ? numbers : null;
}

export function formatNumberList(value: unknown): string {
  return Array.isArray(value) ? value.join(", ") : "";
}

export function parseTerrainBreakpoints(
  text: string,
): Record<string, number> | null {
  const result: Record<string, number> = {};
  text.split(",").forEach((part) => {
    const trimmed = part.trim();
    const separator = trimmed.indexOf(":");
    if (separator === -1) return;
    const zoom = parseFloat(trimmed.slice(0, separator));
    const terrainZoom = parseFloat(trimmed.slice(separator + 1));
    if (Number.isFinite(zoom) && Number.isFinite(terrainZoom)) {
      result[String(Math.trunc(zoom))] = terrainZoom;
    }
  });
  return Object.keys(result).length > 0 ? result : null;
}

export function formatTerrainBreakpoints(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  return Object.keys(value)
    .sort((a, b) => Number(a) - Number(b))
    .map((zoom) => `${zoom}:${(value as Record<string, number>)[zoom]}`)
    .join(", ");
}

function storedNumber(raw: string): number | null {
  if (raw === "") return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function TextOption({
  control,
  name,
  labelKey,
  helpKey,
  multiline = false,
}: OptionFieldProps & { multiline?: boolean }) {
  const { t } = useTranslation();
  return (
    <FormFieldRow>
      <Controller
        name={name}
        control={control}
        render={({ field }) =>
          helpKey ? (
            <TextFieldWithHelp
              labelKey={labelKey}
              helpKey={helpKey}
              fullWidth
              multiline={multiline}
              minRows={multiline ? 3 : undefined}
              value={typeof field.value === "string" ? field.value : ""}
              onChange={(event) => field.onChange(event.target.value)}
              onBlur={field.onBlur}
            />
          ) : (
            <TextField
              label={t(labelKey as never)}
              fullWidth
              multiline={multiline}
              minRows={multiline ? 3 : undefined}
              value={typeof field.value === "string" ? field.value : ""}
              onChange={(event) => field.onChange(event.target.value)}
              onBlur={field.onBlur}
            />
          )
        }
      />
    </FormFieldRow>
  );
}

export function NumberOption({
  control,
  name,
  labelKey,
  helpKey,
}: OptionFieldProps) {
  const { t } = useTranslation();
  return (
    <FormFieldRow>
      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const value =
            typeof field.value === "number" && Number.isFinite(field.value)
              ? field.value
              : "";
          const onChange = (raw: string) => field.onChange(storedNumber(raw));
          return helpKey ? (
            <TextFieldWithHelp
              labelKey={labelKey}
              helpKey={helpKey}
              fullWidth
              type="number"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onBlur={field.onBlur}
            />
          ) : (
            <TextField
              label={t(labelKey as never)}
              fullWidth
              type="number"
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onBlur={field.onBlur}
            />
          );
        }}
      />
    </FormFieldRow>
  );
}

/** Keeps the typed text while the stored value is the parsed form. */
export function DraftTextOption({
  control,
  name,
  labelKey,
  helpKey,
  format,
  parse,
  disabled,
}: OptionFieldProps & {
  helpKey: string;
  format: (value: unknown) => string;
  parse: (text: string, current: unknown) => unknown;
  disabled?: (value: unknown) => boolean;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <FormFieldRow>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <TextFieldWithHelp
            labelKey={labelKey}
            helpKey={helpKey}
            fullWidth
            disabled={disabled?.(field.value) ?? false}
            value={draft ?? format(field.value)}
            onChange={(event) => {
              setDraft(event.target.value);
              field.onChange(parse(event.target.value, field.value));
            }}
            onBlur={() => {
              setDraft(null);
              field.onBlur();
            }}
          />
        )}
      />
    </FormFieldRow>
  );
}

export function NumberListOption({
  control,
  name,
  labelKey,
  helpKey,
}: OptionFieldProps & { helpKey: string }) {
  return (
    <DraftTextOption
      control={control}
      name={name}
      labelKey={labelKey}
      helpKey={helpKey}
      format={formatNumberList}
      parse={(text) => parseNumberList(text)}
    />
  );
}

export function CheckboxOption({
  control,
  name,
  labelKey,
  helpKey,
}: OptionFieldProps) {
  const { t } = useTranslation();
  const label = String(t(labelKey as never));
  return (
    <FormFieldRow>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <FormControlLabel
            control={
              <Checkbox
                checked={!!field.value}
                onChange={(_, checked) => field.onChange(checked)}
              />
            }
            label={
              helpKey ? (
                <FieldLabelWithHelp
                  label={label}
                  help={String(t(helpKey as never))}
                />
              ) : (
                label
              )
            }
          />
        )}
      />
    </FormFieldRow>
  );
}

export function GroupsOption({ control }: { control: Control<FieldValues> }) {
  const { t } = useTranslation();
  return (
    <FormFieldRow>
      <Controller
        name="options.visibleForGroups"
        control={control}
        render={({ field }) => (
          <TextField
            label={t("tools.visibleForGroups")}
            fullWidth
            value={
              Array.isArray(field.value) ? (field.value as string[]).join(", ") : ""
            }
            onChange={(event) =>
              field.onChange(
                event.target.value
                  ? event.target.value.split(",").map((part) => part.trim())
                  : [],
              )
            }
            onBlur={field.onBlur}
          />
        )}
      />
    </FormFieldRow>
  );
}
