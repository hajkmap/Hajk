import { Autocomplete, Stack, TextField } from "@mui/material";
import { Control, Controller, FieldValues, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useFmeSuggestions } from "@/api/fme-server";

interface FmeSuggestFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: string[];
}

// Free text with suggestions from FME. Any value can always be typed, and
// without suggestions it works like a plain TextField, so the form never
// depends on FME answering.
// Trimmed on blur: the client puts the value straight into the FME URL, where
// a stray space means "not found".
export function FmeSuggestField({
  label,
  value,
  onChange,
  onBlur,
  options,
}: FmeSuggestFieldProps) {
  const handleBlur = () => {
    if (value !== value.trim()) onChange(value.trim());
    onBlur?.();
  };

  return (
    <Autocomplete
      freeSolo
      options={options}
      value={value || null}
      inputValue={value}
      onChange={(_, selected) => onChange(selected ?? "")}
      onInputChange={(_, typed) => onChange(typed)}
      onBlur={handleBlur}
      forcePopupIcon={options.length > 0}
      sx={{ flex: 1 }}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}

interface FmeProductSourceFieldsProps {
  control: Control<FieldValues>;
  index: number;
  // Repository names from the connection check; empty when it failed.
  repositories: string[];
}

const asString = (value: unknown) => (typeof value === "string" ? value : "");

// Repository, workspace and geoAttribute for one product row.
export function FmeProductSourceFields({
  control,
  index,
  repositories,
}: FmeProductSourceFieldsProps) {
  const { t } = useTranslation();
  const prefix = `options.products.${index}`;
  const repository: unknown = useWatch({
    control,
    name: `${prefix}.repository`,
  });
  const workspace: unknown = useWatch({ control, name: `${prefix}.workspace` });
  const suggestions = useFmeSuggestions(
    repositories,
    asString(repository),
    asString(workspace),
  );

  const fields = [
    {
      key: "repository",
      label: t("tools.fmeserver.productRepository"),
      options: repositories,
    },
    {
      key: "workspace",
      label: t("tools.fmeserver.productWorkspace"),
      options: suggestions.workspaces,
    },
    {
      key: "geoAttribute",
      label: t("tools.fmeserver.productGeoAttribute"),
      options: suggestions.parameters,
    },
  ];

  return (
    <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
      {fields.map(({ key, label, options }) => (
        <Controller
          key={key}
          name={`${prefix}.${key}`}
          control={control}
          defaultValue=""
          render={({ field }) => (
            <FmeSuggestField
              label={label}
              value={asString(field.value)}
              onChange={field.onChange}
              onBlur={field.onBlur}
              options={options}
            />
          )}
        />
      ))}
    </Stack>
  );
}
