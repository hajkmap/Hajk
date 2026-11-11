import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";
import type { SampleFeature } from "../../../api/services/get-feature-sample";
import { sampleFeatureLabel } from "./sample-label";
import type { FeatureProperties, TemplateOptions } from "./template-engine";

export const EXAMPLE_SAMPLE_ID = "__example__";

interface FeatureInfoSamplePickerProps {
  samples: SampleFeature[] | undefined;
  samplesLoading: boolean;
  samplesFailed: boolean;
  onRetrySamples: () => void;
  selectedId: string;
  onSelect: (id: string) => void;
  exampleProperties: FeatureProperties;
  onExampleChange: (properties: FeatureProperties) => void;
  options: TemplateOptions;
  onOptionsChange: (options: TemplateOptions) => void;
  displayFields?: string[];
}

export default function FeatureInfoSamplePicker({
  samples,
  samplesLoading,
  samplesFailed,
  onRetrySamples,
  selectedId,
  onSelect,
  exampleProperties,
  onExampleChange,
  options,
  onOptionsChange,
  displayFields = [],
}: FeatureInfoSamplePickerProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [draftError, setDraftError] = useState(false);
  const isExample = selectedId === EXAMPLE_SAMPLE_ID;

  const startEditing = () => {
    setDraft(JSON.stringify(exampleProperties, null, 2));
    setDraftError(false);
    setEditing(true);
  };

  const applyDraft = (text: string) => {
    setDraft(text);
    try {
      const parsed = JSON.parse(text) as unknown;
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        throw new Error();
      }
      setDraftError(false);
      onExampleChange(parsed as FeatureProperties);
    } catch {
      setDraftError(true);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
        <TextField
          select
          size="small"
          fullWidth
          label={t("layers.featureInfo.testFeature")}
          value={selectedId}
          onChange={(e) => {
            setEditing(false);
            onSelect(e.target.value);
          }}
        >
          <MenuItem value={EXAMPLE_SAMPLE_ID}>{t("layers.featureInfo.exampleData")}</MenuItem>
          {(samples ?? []).map((sample, index) => {
            const label = sampleFeatureLabel(sample.properties, displayFields);
            return (
              <MenuItem key={sample.id} value={sample.id}>
                {label
                  ? t("layers.featureInfo.featureNamed", { n: index + 1, label })
                  : t("layers.featureInfo.featureN", { n: index + 1 })}
              </MenuItem>
            );
          })}
        </TextField>
        {samplesLoading && <CircularProgress size={20} />}
        <Chip
          size="small"
          color={isExample ? "warning" : "success"}
          variant="outlined"
          label={t(isExample ? "layers.featureInfo.isExample" : "layers.featureInfo.isReal")}
        />
      </Box>
      {samplesFailed && (
        <Alert
          severity="warning"
          action={
            <Button size="small" onClick={onRetrySamples}>
              {t("common.retry")}
            </Button>
          }
        >
          {t("layers.featureInfo.samplesFailed")}
        </Alert>
      )}
      {isExample && (
        <Box>
          <Button
            size="small"
            aria-expanded={editing}
            endIcon={editing ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={editing ? () => setEditing(false) : startEditing}
          >
            {t(
              editing
                ? "layers.featureInfo.hideExampleData"
                : "layers.featureInfo.editExampleData",
            )}
          </Button>
        </Box>
      )}
      {isExample && editing && (
        <TextField
          multiline
          minRows={4}
          maxRows={12}
          size="small"
          value={draft}
          onChange={(e) => applyDraft(e.target.value)}
          error={draftError}
          helperText={draftError ? t("layers.featureInfo.invalidJson") : " "}
          slotProps={{
            htmlInput: { spellCheck: false, style: { fontFamily: "monospace" } },
          }}
        />
      )}
      <Box sx={{ display: "flex", flexWrap: "wrap", columnGap: 2 }}>
        <Tooltip title={t("layers.featureInfo.allowHtmlHelp")}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={options.allowDangerousHtml ?? true}
                onChange={(e) =>
                  onOptionsChange({ ...options, allowDangerousHtml: e.target.checked })
                }
              />
            }
            label={<Typography variant="body2">{t("layers.featureInfo.allowHtml")}</Typography>}
          />
        </Tooltip>
        <Tooltip title={t("layers.featureInfo.newPlaceholderMatchingHelp")}>
          <FormControlLabel
            control={
              <Switch
                size="small"
                checked={options.useNewPlaceholderMatching === true}
                onChange={(e) =>
                  onOptionsChange({
                    ...options,
                    useNewPlaceholderMatching: e.target.checked,
                  })
                }
              />
            }
            label={
              <Typography variant="body2">
                {t("layers.featureInfo.newPlaceholderMatching")}
              </Typography>
            }
          />
        </Tooltip>
      </Box>
    </Box>
  );
}
