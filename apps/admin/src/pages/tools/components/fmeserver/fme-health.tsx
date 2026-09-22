import { useEffect, useMemo, useState } from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Control, FieldValues, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";
import ServiceStatusIndicator from "@/pages/services/components/service-status-indicator";
import { SERVICE_STATUS } from "@/api/services";
import {
  FmeConnectionResult,
  FmeProductRef,
  FmeProductResult,
  FmeWorkspaceResult,
  useFmeProductCheck,
  useFmeServerConnection,
  useRecheckFmeServer,
} from "@/api/fme-server";

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

const toIndicatorStatus = (
  fetching: boolean,
  result: FmeConnectionResult | FmeProductResult | undefined,
) =>
  fetching || !result
    ? SERVICE_STATUS.UNKNOWN
    : result.status === "ok"
      ? SERVICE_STATUS.HEALTHY
      : SERVICE_STATUS.UNHEALTHY;

// Whether the backend can reach FME-server, shown like a service's status:
// an icon with the reason and last-checked time in its tooltip. Clicking it
// re-runs this and every product check.
export function FmeConnectionStatus() {
  const { t } = useTranslation();
  const { data, isFetching, dataUpdatedAt } = useFmeServerConnection();
  const recheck = useRecheckFmeServer();

  const message = (() => {
    if (!data) return undefined;
    switch (data.status) {
      case "ok":
        return t("tools.fmeserver.health.ok");
      case "notConfigured":
        return t("tools.fmeserver.health.notConfigured");
      case "unreachable":
        return t("tools.fmeserver.health.unreachable");
      case "unauthorized":
        return t("tools.fmeserver.health.unauthorized");
      case "unexpected":
        return t("tools.fmeserver.health.unexpected", {
          status: data.httpStatus,
        });
    }
  })();

  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Typography>{t("tools.fmeserver.health.label")}</Typography>
      <Box sx={{ width: 32, height: 32, flexShrink: 0 }}>
        <ServiceStatusIndicator
          status={toIndicatorStatus(isFetching, data)}
          message={message}
          lastChecked={
            dataUpdatedAt > 0
              ? new Date(dataUpdatedAt).toISOString()
              : undefined
          }
          onClick={() => void recheck()}
        />
      </Box>
    </Stack>
  );
}

interface FmeProductHealthIconProps {
  control: Control<FieldValues>;
  index: number;
  // The connection check passed — product checks only make sense then.
  enabled: boolean;
}

// Not trimmed: the check must use the value exactly as the client will, and
// the client puts it straight into the URL.
const asString = (value: unknown) => (typeof value === "string" ? value : "");

// Mirrors FmeServerModel.noGeomAttributeSupplied in the client: an empty
// geoAttribute or "none" means the product sends no geometry.
const toProductResult = (
  workspace: FmeWorkspaceResult,
  geoAttribute: string,
): FmeProductResult => {
  if (workspace.status !== "ok") {
    return { status: workspace.status, httpStatus: workspace.httpStatus };
  }
  const usesGeometry = geoAttribute !== "" && geoAttribute !== "none";
  return usesGeometry && !(workspace.parameters ?? []).includes(geoAttribute)
    ? { status: "geoAttributeMissing" }
    : { status: "ok" };
};

// Checks that a product's repository/workspace exist and that geoAttribute is
// one of the workspace's parameters. Clicking the icon re-runs the check.
export function FmeProductHealthIcon({
  control,
  index,
  enabled,
}: FmeProductHealthIconProps) {
  const { t } = useTranslation();
  const recheck = useRecheckFmeServer();
  const row: unknown = useWatch({ control, name: `options.products.${index}` });
  const values = (row ?? {}) as Record<string, unknown>;
  const repository = asString(values.repository);
  const workspace = asString(values.workspace);
  const geoAttribute = asString(values.geoAttribute);

  // Debounce the row as one unit, so editing two fields quickly doesn't run
  // a check with one new and one old value. Only repository and workspace are
  // fetched; geoAttribute is checked against the workspace's parameters.
  const current = useMemo<FmeProductRef>(
    () => ({ repository, workspace, geoAttribute }),
    [repository, workspace, geoAttribute],
  );
  const product = useDebouncedValue(current, 600);

  const { data, isFetching } = useFmeProductCheck(product, enabled);

  if (!enabled || !product.repository || !product.workspace) return null;

  const result = data && toProductResult(data, product.geoAttribute);
  const message = (() => {
    if (!result) return undefined;
    switch (result.status) {
      case "ok":
        return t("tools.fmeserver.health.productOk");
      case "notFound":
        return t("tools.fmeserver.health.productNotFound");
      case "geoAttributeMissing":
        return t("tools.fmeserver.health.productGeoAttributeMissing", {
          geoAttribute: product.geoAttribute,
        });
      case "error":
        return result.httpStatus
          ? t("tools.fmeserver.health.productErrorStatus", {
              status: result.httpStatus,
            })
          : t("tools.fmeserver.health.productError");
    }
  })();

  return (
    <Box
      sx={{
        width: 40,
        height: 56,
        alignSelf: "flex-start",
        flexShrink: 0,
      }}
    >
      <ServiceStatusIndicator
        status={toIndicatorStatus(isFetching, result)}
        message={message}
        onClick={() => void recheck(product)}
      />
    </Box>
  );
}
