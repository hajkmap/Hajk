import { Chip } from "@mui/material";
import { useTranslation } from "react-i18next";

import { isAvailableNow } from "../../lib/availability";

/** Marks a layer whose service its users don't get now. */
export default function ServiceAvailabilityChip({
  options,
}: {
  options: Record<string, unknown> | undefined;
}) {
  const { t } = useTranslation();
  if (isAvailableNow(options)) return null;
  return (
    <Chip
      size="small"
      color="warning"
      label={t("availability.chip.serviceUnavailable")}
    />
  );
}
