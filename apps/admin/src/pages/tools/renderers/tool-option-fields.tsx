import { useState } from "react";
import { Checkbox, FormControlLabel, TextField } from "@mui/material";
import { Control, Controller, FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormFieldRow } from "../../../components/form-components/form-field-grid";
import { TextFieldWithHelp } from "../../../components/form-components/field-label-with-help";
import { FieldLabelWithHelp } from "../../../components/form-components/field-help-tooltip";
import {
  decodeInstruction,
  encodeInstruction,
  formatGroups,
  formatNumberList,
  parseGroups,
  parseNumberList,
  storedNumber,
} from "./tool-option-parsers";

interface OptionFieldProps {
  control: Control<FieldValues>;
  name: string;
  labelKey: string;
  helpKey?: string;
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

/** Instruction is stored base64-encoded, the same way the legacy admin did. */
export function InstructionOption({
  control,
}: {
  control: Control<FieldValues>;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  return (
    <FormFieldRow>
      <Controller
        name="options.instruction"
        control={control}
        render={({ field }) => (
          <TextField
            label={t("tools.instruction")}
            fullWidth
            multiline
            minRows={3}
            error={invalid}
            helperText={
              invalid ? t("tools.instructionUnsupportedCharacters") : undefined
            }
            value={draft ?? decodeInstruction(field.value)}
            onChange={(event) => {
              const text = event.target.value;
              const encoded = encodeInstruction(text);
              setDraft(text);
              setInvalid(encoded === null);
              if (encoded !== null) field.onChange(encoded);
            }}
            onBlur={() => {
              setDraft(null);
              setInvalid(false);
              field.onBlur();
            }}
          />
        )}
      />
    </FormFieldRow>
  );
}

/** Keeps the typed text so spaces inside group names survive until blur. */
export function GroupsOption({ control }: { control: Control<FieldValues> }) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <FormFieldRow>
      <Controller
        name="options.visibleForGroups"
        control={control}
        render={({ field }) => (
          <TextField
            label={t("tools.visibleForGroups")}
            fullWidth
            value={draft ?? formatGroups(field.value)}
            onChange={(event) => {
              setDraft(event.target.value);
              field.onChange(parseGroups(event.target.value));
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
