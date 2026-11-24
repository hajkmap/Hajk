import { Alert } from "@mui/material";
import { useWatch, type Control, type FieldValues } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { useActiveDirectoryStatus } from "../../api/active-directory";
import {
  availabilityOf,
  availabilityState,
  formatWhen,
  hasValidPeriod,
  isAvailableNow,
} from "../../lib/availability";

/**
 * Whether users get the map, the layer, the service or the group now, as the
 * availability fields (options.visible, options.visibleFrom,
 * options.visibleUntil) are filled in, and while the backend looks users up
 * in AD, which users: the members of the AD groups in visibleForGroups. A
 * layer passes its service: while users don't get the service, they don't
 * get the layer either.
 */
export default function AvailabilityStatus({
  control,
  service,
}: {
  control: Control<FieldValues>;
  service?: { name: string; options: Record<string, unknown> };
}) {
  const { t, i18n } = useTranslation();
  const [visible, visibleFrom, visibleUntil, visibleForGroups] = useWatch({
    control,
    name: [
      "options.visible",
      "options.visibleFrom",
      "options.visibleUntil",
      "visibleForGroups",
    ],
  }) as [unknown, unknown, unknown, string[] | undefined];
  const { data: activeDirectory } = useActiveDirectoryStatus();
  const availability = availabilityOf({ visible, visibleFrom, visibleUntil });
  const groups = activeDirectory?.lookupActive ? (visibleForGroups ?? []) : [];

  if (!hasValidPeriod(availability)) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {t("availability.status.invalidPeriod")}
      </Alert>
    );
  }

  const state = availabilityState(availability);
  const serviceAlert =
    service && !isAvailableNow(service.options) ? (
      <Alert severity="warning" sx={{ mt: 2 }}>
        {t("availability.status.serviceUnavailable", { name: service.name })}
      </Alert>
    ) : null;
  if (serviceAlert && state.kind === "shown") return serviceAlert;

  const when = (date: Date) => formatWhen(date, i18n.language);
  const text =
    state.kind === "hidden"
      ? t("availability.status.hidden")
      : state.kind === "notYet"
        ? t("availability.status.notYet", { from: when(state.from) })
        : state.kind === "ended"
          ? t("availability.status.ended", { until: when(state.until) })
          : state.until
            ? t("availability.status.shownUntil", { until: when(state.until) })
            : t("availability.status.shown");
  const onlyGroups =
    state.kind === "shown" && groups.length > 0
      ? ` ${t("availability.status.onlyGroups", { groups: groups.join(", ") })}`
      : "";

  return (
    <>
      <Alert
        severity={state.kind === "shown" ? "info" : "warning"}
        sx={{ mt: 2 }}
      >
        {text}
        {onlyGroups}
      </Alert>
      {serviceAlert}
    </>
  );
}
