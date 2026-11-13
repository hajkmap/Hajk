import { useCallback, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import {
  fetchDescribeFeatureType,
  type DescribeFeatureProperty,
} from "../../../api/services/describe-feature-type";
import { fetchFeatureSample } from "../../../api/services/get-feature-sample";
import FeatureInfoEditor, { type FeatureInfoEditorHandle } from "./feature-info-editor";
import FeatureInfoAttributes from "./feature-info-attributes";
import FeatureInfoPreview from "./feature-info-preview";
import FeatureInfoIssues from "./feature-info-issues";
import FeatureInfoSamplePicker, { EXAMPLE_SAMPLE_ID } from "./feature-info-sample-picker";
import {
  extractPropertiesFromJson,
  type FeatureProperties,
  type TemplateOptions,
} from "./template-engine";
import { validateTemplate } from "./template-validation";
import { buildExampleProperties, withSchemaAttributes } from "./sample-data";
import { displayFieldNames } from "./sample-label";

const NO_ATTRIBUTES: DescribeFeatureProperty[] = [];

const PANEL_HEIGHT = { xs: 520, lg: 720 } as const;

const fillColumnSx = {
  position: "relative",
  minWidth: 0,
  minHeight: { lg: PANEL_HEIGHT.lg },
} as const;
const fillInnerSx = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
} as const;

interface FeatureInfoDesignerProps {
  inputId?: string;
  value: string;
  onChange: (value: string) => void;
  serviceUrl: string;
  typeNames: string[];
  caption: string;
  displayFields?: string;
}

export default function FeatureInfoDesigner({
  inputId,
  value,
  onChange,
  serviceUrl,
  typeNames,
  caption,
  displayFields,
}: FeatureInfoDesignerProps) {
  const { t } = useTranslation();
  const editorRef = useRef<FeatureInfoEditorHandle>(null);
  const [typeName, setTypeName] = useState(typeNames[0] ?? "");
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [exampleOverride, setExampleOverride] = useState<FeatureProperties | null>(null);
  const [options, setOptions] = useState<TemplateOptions>({
    allowDangerousHtml: true,
    useNewPlaceholderMatching: false,
  });
  const [expanded, setExpanded] = useState(false);
  const [debouncedTemplate] = useDebounce(value, 250);

  const activeTypeName = typeNames.includes(typeName) ? typeName : (typeNames[0] ?? "");
  const canQuery = Boolean(serviceUrl && activeTypeName);

  const attributesQuery = useQuery({
    queryKey: ["describeFeatureType", serviceUrl, activeTypeName],
    queryFn: () => fetchDescribeFeatureType(serviceUrl, activeTypeName),
    enabled: canQuery,
  });
  const samplesQuery = useQuery({
    queryKey: ["featureSample", serviceUrl, activeTypeName],
    queryFn: () => fetchFeatureSample(serviceUrl, activeTypeName),
    enabled: canQuery,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const samples = samplesQuery.data;
  const selectedId =
    sampleId ?? (samples && samples.length > 0 ? samples[0].id : EXAMPLE_SAMPLE_ID);
  const selectedSample = samples?.find((s) => s.id === selectedId);

  const exampleProperties = useMemo(
    () => exampleOverride ?? buildExampleProperties(attributesQuery.data, debouncedTemplate),
    [exampleOverride, attributesQuery.data, debouncedTemplate],
  );

  const previewProperties = useMemo(
    () =>
      withSchemaAttributes(
        extractPropertiesFromJson(selectedSample?.properties ?? exampleProperties),
        attributesQuery.data,
      ),
    [selectedSample, exampleProperties, attributesQuery.data],
  );

  const attributeNames = useMemo(
    () => attributesQuery.data?.map((a) => a.name),
    [attributesQuery.data],
  );
  const issues = useMemo(
    () => validateTemplate(debouncedTemplate, { ...options, attributes: attributeNames }),
    [debouncedTemplate, options, attributeNames],
  );

  const { refetch: refetchAttributes } = attributesQuery;
  const { refetch: refetchSamples } = samplesQuery;
  const retryAttributes = useCallback(() => void refetchAttributes(), [refetchAttributes]);
  const retrySamples = useCallback(() => void refetchSamples(), [refetchSamples]);
  const insertPlaceholder = useCallback(
    (placeholder: string) => editorRef.current?.insert(placeholder),
    [],
  );
  const goToLine = useCallback((line: number) => editorRef.current?.goToLine(line), []);
  const toggleExpanded = useCallback(() => setExpanded((open) => !open), []);
  const displayFieldList = useMemo(() => displayFieldNames(displayFields), [displayFields]);

  const samplePicker = useMemo(
    () => (
      <FeatureInfoSamplePicker
        samples={samples}
        samplesLoading={samplesQuery.isFetching}
        samplesFailed={samplesQuery.isError}
        onRetrySamples={retrySamples}
        selectedId={selectedId}
        onSelect={setSampleId}
        exampleProperties={exampleProperties}
        onExampleChange={setExampleOverride}
        options={options}
        onOptionsChange={setOptions}
        displayFields={displayFieldList}
      />
    ),
    [
      samples,
      samplesQuery.isFetching,
      samplesQuery.isError,
      retrySamples,
      selectedId,
      exampleProperties,
      options,
      displayFieldList,
    ],
  );

  const workspace = (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        ...(expanded && { flex: 1, height: "100%", minHeight: 0 }),
      }}
    >
      {typeNames.length > 1 && (
        <TextField
          select
          size="small"
          label={t("layers.featureInfo.attributesFrom")}
          value={activeTypeName}
          onChange={(e) => {
            setTypeName(e.target.value);
            setSampleId(null);
          }}
          sx={{ maxWidth: 360 }}
        >
          {typeNames.map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </TextField>
      )}
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            lg: expanded
              ? "300px minmax(0, 1fr) minmax(0, 432px)"
              : "minmax(200px, 0.7fr) minmax(0, 1.4fr) minmax(0, 432px)",
          },
          alignItems: "stretch",
          ...(expanded && {
            flex: 1,
            minHeight: 0,
            gridTemplateRows: { lg: "minmax(0, 1fr)" },
          }),
        }}
      >
        <Box
          sx={{
            ...fillColumnSx,
            height: expanded ? { xs: 320, lg: "auto" } : { xs: 320, lg: PANEL_HEIGHT.lg },
            ...(expanded && { minHeight: 0 }),
          }}
        >
          <Box sx={fillInnerSx}>
            <FeatureInfoAttributes
              attributes={canQuery ? attributesQuery.data : NO_ATTRIBUTES}
              isLoading={attributesQuery.isLoading}
              isError={attributesQuery.isError}
              onRetry={retryAttributes}
              sampleProperties={previewProperties}
              onInsert={insertPlaceholder}
            />
          </Box>
        </Box>
        <Box
          sx={{
            ...fillColumnSx,
            height: expanded ? { xs: PANEL_HEIGHT.xs, lg: "auto" } : PANEL_HEIGHT,
            ...(expanded && { minHeight: 0 }),
          }}
        >
          <Box sx={{ ...fillInnerSx, gap: 1 }}>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <FeatureInfoEditor
                ref={editorRef}
                id={inputId}
                value={value}
                onChange={onChange}
                expanded={expanded}
                onToggleExpanded={toggleExpanded}
              />
            </Box>
            <Box sx={{ maxHeight: "35%", overflowY: "auto", flexShrink: 0 }}>
              <FeatureInfoIssues issues={issues} onGoToLine={goToLine} />
            </Box>
          </Box>
        </Box>
        {expanded ? (
          <Box
            sx={{
              ...fillColumnSx,
              height: { xs: 640, lg: "auto" },
              minHeight: 0,
            }}
          >
            <Box sx={fillInnerSx}>
              <FeatureInfoPreview
                template={debouncedTemplate}
                caption={caption}
                properties={previewProperties}
                options={options}
                controls={samplePicker}
                fill
              />
            </Box>
          </Box>
        ) : (
          <Box sx={{ ...fillColumnSx, height: PANEL_HEIGHT }}>
            <Box sx={fillInnerSx}>
              <FeatureInfoPreview
                template={debouncedTemplate}
                caption={caption}
                properties={previewProperties}
                options={options}
                controls={samplePicker}
                fill
              />
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );

  if (!expanded) return <Box data-form-wide="">{workspace}</Box>;

  const title = caption
    ? `${t("layers.infobox")}: ${caption}`
    : t("layers.infobox");
  return (
    <>
      <Box data-form-wide="">
        <Alert severity="info" variant="outlined">
          {t("layers.featureInfo.expandedNotice")}
        </Alert>
      </Box>
      <Dialog
        fullScreen
        open
        onClose={() => setExpanded(false)}
        slotProps={{
          paper: { sx: { display: "flex", flexDirection: "column", height: "100%" } },
        }}
      >
        <DialogTitle
          sx={{ display: "flex", alignItems: "center", gap: 2, py: 1.5, flexShrink: 0 }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }} className="truncate-overflow">
            {title}
          </Box>
          <Button variant="contained" onClick={() => setExpanded(false)}>
            {t("layers.featureInfo.done")}
          </Button>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: "1 1 auto",
            minHeight: 0,
            overflow: { xs: "auto", lg: "hidden" },
          }}
        >
          {workspace}
        </DialogContent>
      </Dialog>
    </>
  );
}
