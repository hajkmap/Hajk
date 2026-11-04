import { Alert } from "@mui/material";
import { useWatch, type Control, type FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";

import {
  formatWhen,
  hasValidPeriod,
  mapVisibilityOf,
  mapVisibilityState,
} from "../map-visibility";

/** Whether the map's users see it now, as the visibility fields are filled in. */
export default function MapVisibilityStatus({
  control,
}: {
  control: Control<FieldValues>;
}) {
  const { t, i18n } = useTranslation();
  const [visible, visibleFrom, visibleUntil] = useWatch({
    control,
    name: ["options.visible", "options.visibleFrom", "options.visibleUntil"],
  }) as [unknown, unknown, unknown];
  const visibility = mapVisibilityOf({ visible, visibleFrom, visibleUntil });

  if (!hasValidPeriod(visibility)) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {t("map.visibilityStatus.invalidPeriod")}
      </Alert>
    );
  }

  const state = mapVisibilityState(visibility);
  const when = (date: Date) => formatWhen(date, i18n.language);
  const text =
    state.kind === "hidden"
      ? t("map.visibilityStatus.hidden")
      : state.kind === "notYet"
        ? t("map.visibilityStatus.notYet", { from: when(state.from) })
        : state.kind === "ended"
          ? t("map.visibilityStatus.ended", { until: when(state.until) })
          : state.until
            ? t("map.visibilityStatus.shownUntil", { until: when(state.until) })
            : t("map.visibilityStatus.shown");

  return (
    <Alert
      severity={state.kind === "shown" ? "info" : "warning"}
      sx={{ mt: 2 }}
    >
      {text}
    </Alert>
  );
}
