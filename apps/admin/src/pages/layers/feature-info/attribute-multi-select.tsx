import { Checkbox, ListItemText, MenuItem } from "@mui/material";
import { useQueries } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { fetchDescribeFeatureType } from "../../../api/services/describe-feature-type";
import { SelectWithHelp } from "../../../components/form-components/field-label-with-help";
import { isGeometryAttribute } from "./sample-data";

interface AttributeMultiSelectProps {
  labelKey: string;
  helpKey: string;
  serviceUrl: string;
  typeNames: string[];
  value: string;
  onChange: (value: string) => void;
}

const splitList = (value: string) =>
  value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

/**
 * Picks one or more of the layer's attributes. The stored value stays a
 * comma-separated list, which is what the map client reads.
 */
export default function AttributeMultiSelect({
  labelKey,
  helpKey,
  serviceUrl,
  typeNames,
  value,
  onChange,
}: AttributeMultiSelectProps) {
  const { t } = useTranslation();
  const names = [...new Set(typeNames.filter(Boolean))];
  const queries = useQueries({
    queries: names.map((typeName) => ({
      queryKey: ["describeFeatureType", serviceUrl, typeName],
      queryFn: () => fetchDescribeFeatureType(serviceUrl, typeName),
      enabled: Boolean(serviceUrl && typeName),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const selected = splitList(value);
  const seen = new Set<string>();
  const attributes: string[] = [];
  const add = (name: string) => {
    if (!name || seen.has(name)) return;
    seen.add(name);
    attributes.push(name);
  };
  for (const query of queries) {
    for (const attribute of query.data ?? []) {
      if (!isGeometryAttribute(attribute)) add(attribute.name);
    }
  }
  for (const name of selected) add(name);

  const loading = names.length > 0 && queries.some((query) => query.isLoading);
  const failed =
    names.length > 0 &&
    queries.every((query) => query.isError || query.data?.length === 0) &&
    queries.some((query) => query.isError);

  return (
    <SelectWithHelp
      labelKey={labelKey}
      helpKey={helpKey}
      multiple
      displayEmpty
      value={selected}
      onChange={(event) => {
        const next = event.target.value;
        const list = typeof next === "string" ? splitList(next) : next;
        onChange(list.join(", "));
      }}
      renderValue={(picked) => (picked as string[]).join(", ")}
      helperText={
        failed
          ? t("layers.featureInfo.attributesFailed")
          : loading
            ? t("common.loading")
            : undefined
      }
    >
      {attributes.map((name) => (
        <MenuItem key={name} value={name}>
          <Checkbox checked={selected.includes(name)} size="small" />
          <ListItemText primary={name} />
        </MenuItem>
      ))}
    </SelectWithHelp>
  );
}
