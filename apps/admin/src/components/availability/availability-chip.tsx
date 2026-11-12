import { Chip } from "@mui/material";
import { useTranslation } from "react-i18next";

import {
  availabilityOf,
  availabilityState,
  formatWhen,
} from "../../lib/availability";

/**
 * Marks a map, a layer, a service or a group its users don't get now, or will
 * stop getting.
 */
export default function AvailabilityChip({
  options,
}: {
  options: Record<string, unknown> | undefined;
}) {
  const { t, i18n } = useTranslation();
  const state = availabilityState(availabilityOf(options));
  const when = (date: Date) => formatWhen(date, i18n.language, "short");

  switch (state.kind) {
    case "hidden":
      return (
        <Chip
          size="small"
          color="warning"
          label={t("availability.chip.hidden")}
        />
      );
    case "notYet":
      return (
        <Chip
          size="small"
          color="warning"
          variant="outlined"
          label={t("availability.chip.notYet", { from: when(state.from) })}
        />
      );
    case "ended":
      return (
        <Chip
          size="small"
          color="warning"
          label={t("availability.chip.ended", { until: when(state.until) })}
        />
      );
    case "shown":
      return state.until ? (
        <Chip
          size="small"
          variant="outlined"
          label={t("availability.chip.until", { until: when(state.until) })}
        />
      ) : null;
  }
}
