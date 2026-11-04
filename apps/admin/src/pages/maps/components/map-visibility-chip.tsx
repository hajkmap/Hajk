import { Chip } from "@mui/material";
import { useTranslation } from "react-i18next";

import {
  formatWhen,
  mapVisibilityOf,
  mapVisibilityState,
} from "../map-visibility";

/** Marks a map in the list that its users don't see now, or will stop seeing. */
export default function MapVisibilityChip({
  options,
}: {
  options: Record<string, unknown> | undefined;
}) {
  const { t, i18n } = useTranslation();
  const state = mapVisibilityState(mapVisibilityOf(options));
  const when = (date: Date) => formatWhen(date, i18n.language, "short");

  switch (state.kind) {
    case "hidden":
      return (
        <Chip
          size="small"
          color="warning"
          label={t("maps.visibility.hidden")}
        />
      );
    case "notYet":
      return (
        <Chip
          size="small"
          color="warning"
          variant="outlined"
          label={t("maps.visibility.notYet", { from: when(state.from) })}
        />
      );
    case "ended":
      return (
        <Chip
          size="small"
          color="warning"
          label={t("maps.visibility.ended", { until: when(state.until) })}
        />
      );
    case "shown":
      return state.until ? (
        <Chip
          size="small"
          variant="outlined"
          label={t("maps.visibility.until", { until: when(state.until) })}
        />
      ) : null;
  }
}
