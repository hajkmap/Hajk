import { useState } from "react";
import { Controller, type Control, type FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useActiveDirectoryStatus } from "../../api/active-directory";
import { formatGroups, parseGroups } from "../../lib/availability";
import { TextFieldWithHelp } from "../form-components/field-label-with-help";

/**
 * The AD groups whose members get a map, a group, a layer or a tool, typed
 * with commas between; none means everyone. The backend applies them only
 * while it looks users up in AD (AD_LOOKUP_ACTIVE in its .env); otherwise the
 * field is disabled and says so. The typed text stays while the field has
 * focus, so a space inside a group's name survives.
 */
export function VisibleForGroupsInput({
  value,
  onChange,
  onBlur,
  size,
}: {
  value: unknown;
  onChange: (groups: string[]) => void;
  onBlur?: () => void;
  size?: "small" | "medium";
}) {
  const { t } = useTranslation();
  const { data: activeDirectory } = useActiveDirectoryStatus();
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <TextFieldWithHelp
      labelKey="availability.visibleForGroups"
      helpKey="availability.help.visibleForGroups"
      fullWidth
      size={size}
      disabled={activeDirectory?.lookupActive === false}
      helperText={
        activeDirectory?.lookupActive === false
          ? t("availability.adLookupInactive")
          : undefined
      }
      value={draft ?? formatGroups(value)}
      onChange={(event) => {
        setDraft(event.target.value);
        onChange(parseGroups(event.target.value));
      }}
      onBlur={() => {
        setDraft(null);
        onBlur?.();
      }}
    />
  );
}

/** The AD groups field for a form's `name`, by default visibleForGroups. */
export default function VisibleForGroupsField({
  control,
  name = "visibleForGroups",
  size,
}: {
  control: Control<FieldValues>;
  name?: string;
  size?: "small" | "medium";
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <VisibleForGroupsInput
          value={field.value as unknown}
          onChange={field.onChange}
          onBlur={field.onBlur}
          size={size}
        />
      )}
    />
  );
}
