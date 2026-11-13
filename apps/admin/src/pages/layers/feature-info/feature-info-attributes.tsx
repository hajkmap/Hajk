import { memo, useMemo, useState } from "react";
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
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import { useTranslation } from "react-i18next";
import type { DescribeFeatureProperty } from "../../../api/services/describe-feature-type";
import type { FeatureProperties } from "./template-engine";
import { isGeometryAttribute } from "./sample-data";
import {
  DOCUMENT_HANDLER_PLUGIN,
  documentLinkAttributeNames,
  isDocumentLinkValue,
} from "./document-link";

interface FeatureInfoAttributesProps {
  attributes: DescribeFeatureProperty[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  sampleProperties?: FeatureProperties;
  onInsert: (placeholder: string) => void;
}

type InsertMode = "value" | "documentLink";

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

export default memo(FeatureInfoAttributes);

function FeatureInfoAttributes({
  attributes,
  isLoading,
  isError,
  onRetry,
  sampleProperties,
  onInsert,
}: FeatureInfoAttributesProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("");
  const [mode, setMode] = useState<InsertMode>("value");
  const linkAttributes = useMemo(
    () => documentLinkAttributeNames(sampleProperties),
    [sampleProperties],
  );

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return (attributes ?? []).filter((a) => {
      const isLink = linkAttributes.has(a.name);
      if (mode === "documentLink" && !isLink) return false;
      if (mode === "value" && isLink) return false;
      return a.name.toLowerCase().includes(term);
    });
  }, [attributes, filter, mode, linkAttributes]);

  const renderItem = (attribute: DescribeFeatureProperty) => {
    const { name, localType: type } = attribute;
    const sample = sampleProperties?.[name];
    const placeholder =
      mode === "documentLink" ? `{${name}@@${DOCUMENT_HANDLER_PLUGIN}}` : `{${name}}`;

    const disabledReason = isGeometryAttribute(attribute)
      ? t("layers.featureInfo.geometryNotInsertable")
      : null;
    const holdsLink = mode === "documentLink" && isDocumentLinkValue(sample);

    return (
      <Tooltip
        key={name}
        placement="left"
        title={disabledReason ?? t("layers.featureInfo.insertAttribute", { placeholder })}
      >
        <Box component="span" sx={{ display: "block", minWidth: 0 }}>
          <ListItemButton
            dense
            disabled={disabledReason !== null}
            onClick={() => onInsert(placeholder)}
            sx={{ borderRadius: 1, gap: 1 }}
          >
            <ListItemText
              primary={name}
              secondary={formatSample(sample)}
              sx={{ my: 0.25, minWidth: 0 }}
              slotProps={{
                primary: {
                  noWrap: true,
                  sx: { fontFamily: "monospace", fontSize: "0.85rem" },
                },
                secondary: { noWrap: true },
              }}
            />
            {holdsLink ? (
              <DescriptionOutlinedIcon
                fontSize="small"
                color="info"
                titleAccess={t("layers.featureInfo.documentLinkFound")}
                sx={{ flexShrink: 0 }}
              />
            ) : (
              type && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={type}
                  sx={{ flexShrink: 0, maxWidth: "46%" }}
                />
              )
            )}
          </ListItemButton>
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {t("layers.featureInfo.attributes")}
      </Typography>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        color="primary"
        value={mode}
        onChange={(_event, next: InsertMode | null) => {
          if (next) setMode(next);
        }}
        aria-label={t("layers.featureInfo.insertAs")}
        sx={{ mb: 1 }}
      >
        <ToggleButton value="value" sx={{ textTransform: "none", py: 0.25 }}>
          {t("layers.featureInfo.insertAsValue")}
        </ToggleButton>
        <ToggleButton value="documentLink" sx={{ textTransform: "none", py: 0.25 }}>
          {t("layers.featureInfo.insertAsDocumentLink")}
        </ToggleButton>
      </ToggleButtonGroup>
      {mode === "documentLink" && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1 }}>
          {t("layers.featureInfo.documentLinkHelp")}{" "}
          {t(
            linkAttributes.size > 0
              ? "layers.featureInfo.documentLinkShowingLinks"
              : "layers.featureInfo.documentLinkNoneFound",
          )}
        </Typography>
      )}
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
          sx={{ mt: 1, "& .MuiAlert-message": { flex: 1, overflow: "visible", py: 0.5 } }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "stretch", gap: 0.5 }}>
            <Button size="small" onClick={onRetry} sx={{ alignSelf: "flex-end" }}>
              {t("common.retry")}
            </Button>
            {t("layers.featureInfo.attributesFailed")}
          </Box>
        </Alert>
      )}
      <List dense sx={{ overflow: "auto", flex: 1, minHeight: 0, mt: 1 }}>
        {visible.map(renderItem)}
        {!isLoading && !isError && attributes?.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 1 }}>
            {t("layers.featureInfo.noAttributes")}
          </Typography>
        )}
      </List>
    </Box>
  );
}
