import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useTranslation } from "react-i18next";
import type { DescribeFeatureProperty } from "../../../api/services/describe-feature-type";
import type { FeatureProperties } from "./template-engine";
import { isGeometryAttribute } from "./sample-data";

interface FeatureInfoAttributesProps {
  attributes: DescribeFeatureProperty[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  sampleProperties?: FeatureProperties;
  onInsert: (placeholder: string) => void;
}

const formatSample = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return "—";
  let text: string;
  switch (typeof value) {
    case "string":
    case "number":
    case "boolean":
    case "bigint":
      text = String(value);
      break;
    case "object": {
      const json = JSON.stringify(value);
      text = typeof json === "string" ? json : "—";
      break;
    }
    default:
      return "—";
  }
  return text.length > 60 ? `${text.slice(0, 57)}…` : text;
};

export default function FeatureInfoAttributes({
  attributes,
  isLoading,
  isError,
  onRetry,
  sampleProperties,
  onInsert,
}: FeatureInfoAttributesProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("");

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return (attributes ?? []).filter((a) => a.name.toLowerCase().includes(term));
  }, [attributes, filter]);

  const renderItem = (name: string, type: string, disabled = false) => (
    <Tooltip
      key={name}
      placement="left"
      title={
        disabled
          ? t("layers.featureInfo.geometryNotInsertable")
          : t("layers.featureInfo.insertAttribute", { placeholder: `{${name}}` })
      }
    >
      <span>
        <ListItemButton
          dense
          disabled={disabled}
          onClick={() => onInsert(`{${name}}`)}
          sx={{ borderRadius: 1 }}
        >
          <ListItemText
            primary={name}
            secondary={formatSample(sampleProperties?.[name])}
            slotProps={{
              primary: { sx: { fontFamily: "monospace", fontSize: "0.85rem" } },
              secondary: { noWrap: true },
            }}
          />
          {type && <Chip size="small" variant="outlined" label={type} sx={{ ml: 1 }} />}
        </ListItemButton>
      </span>
    </Tooltip>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {t("layers.featureInfo.attributes")}
      </Typography>
      <TextField
        size="small"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder={t("layers.featureInfo.searchAttributes")}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />
      {isLoading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
      {isError && (
        <Alert
          severity="warning"
          sx={{ mt: 1 }}
          action={
            <Button size="small" onClick={onRetry}>
              {t("common.retry")}
            </Button>
          }
        >
          {t("layers.featureInfo.attributesFailed")}
        </Alert>
      )}
      <List dense sx={{ overflow: "auto", flex: 1, mt: 1 }}>
        {visible.map((a) => renderItem(a.name, a.localType, isGeometryAttribute(a)))}
        {!isLoading && !isError && attributes?.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
            {t("layers.featureInfo.noAttributes")}
          </Typography>
        )}
      </List>
    </Box>
  );
}
