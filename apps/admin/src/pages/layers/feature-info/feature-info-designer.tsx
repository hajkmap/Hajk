import { startTransition, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
  fetchDescribeFeatureType,
  type DescribeFeatureProperty,
} from "../../../api/services/describe-feature-type";
import { fetchFeatureSample } from "../../../api/services/get-feature-sample";
import FeatureInfoEditor, { type FeatureInfoEditorHandle } from "./feature-info-editor";
import { EditorHistory } from "./editor-history";
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
import {
  CLIENT_WINDOW_BODY_HEIGHT,
  CLIENT_WINDOW_CHROME_HEIGHT,
  CLIENT_WINDOW_WIDTH,
} from "./client-window-frame";

const NO_ATTRIBUTES: DescribeFeatureProperty[] = [];

const PANEL_HEIGHT = { xs: 520, lg: 720 } as const;

const WIDE_LAYOUT = "@container feature-info (min-width: 960px)";

const fillColumnSx = {
  position: "relative",
  minWidth: 0,
  maxWidth: "100%",
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
  fill?: boolean;
  emptyShowsAttributes?: boolean;
}

export default function FeatureInfoDesigner({
  inputId,
  value,
  onChange,
  serviceUrl,
  typeNames,
  caption,
  displayFields,
  fill = false,
  emptyShowsAttributes = true,
}: FeatureInfoDesignerProps) {
  const { t } = useTranslation();
  const editorRef = useRef<FeatureInfoEditorHandle>(null);
  const [history] = useState(() => new EditorHistory(value));
  const [typeName, setTypeName] = useState(typeNames[0] ?? "");
  const [sampleId, setSampleId] = useState<string | null>(null);
  const [exampleOverride, setExampleOverride] = useState<FeatureProperties | null>(null);
  const [options, setOptions] = useState<TemplateOptions>({
    allowDangerousHtml: true,
    useNewPlaceholderMatching: false,
  });
  const [expanded, setExpanded] = useState(false);
  const spacious = expanded || fill;
  const [previewWidth, setPreviewWidth] = useState(CLIENT_WINDOW_WIDTH);
  const [previewHeight, setPreviewHeight] = useState(CLIENT_WINDOW_BODY_HEIGHT);
  const [windowPreview, setWindowPreview] = useState(false);
  const [windowAnchor, setWindowAnchor] = useState({ left: 16, top: 16 });
  const [showResizeHint, setShowResizeHint] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState(value);
  const previewTemplateRef = useRef(value);
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (value === previewTemplateRef.current) return;
    previewTemplateRef.current = value;
    setPreviewTemplate(value);
  }, [value]);

  const onPreviewChange = useCallback((next: string) => {
    if (next === previewTemplateRef.current) return;
    previewTemplateRef.current = next;
    startTransition(() => setPreviewTemplate(next));
  }, []);
  const commitTemplate = useCallback((next: string) => {
    onChangeRef.current(next);
  }, []);

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
    () => exampleOverride ?? buildExampleProperties(attributesQuery.data, previewTemplate),
    [exampleOverride, attributesQuery.data, previewTemplate],
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
    () => validateTemplate(previewTemplate, { ...options, attributes: attributeNames }),
    [previewTemplate, options, attributeNames],
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
  const openWindowPreview = useCallback(() => {
    const totalHeight = CLIENT_WINDOW_CHROME_HEIGHT + previewHeight;
    setWindowAnchor({
      left: Math.max(16, Math.round((window.innerWidth - previewWidth) / 2)),
      top: Math.max(16, Math.round((window.innerHeight - totalHeight) / 2)),
    });
    setShowResizeHint(true);
    setWindowPreview(true);
  }, [previewWidth, previewHeight]);
  const changePreviewWidth = useCallback((next: number) => {
    setShowResizeHint(false);
    setPreviewWidth(next);
  }, []);
  const changePreviewHeight = useCallback((next: number) => {
    setShowResizeHint(false);
    setPreviewHeight(next);
  }, []);
  const changeWindowAnchor = useCallback((next: { left: number; top: number }) => {
    setWindowAnchor(next);
  }, []);
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
        containerType: "inline-size",
        containerName: "feature-info",
        minWidth: 0,
        ...(spacious && { flex: 1, height: "100%", minHeight: 0 }),
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
          gridTemplateColumns: "minmax(0, 1fr)",
          alignItems: "stretch",
          ...(spacious && { flex: 1, minHeight: 0 }),
          [WIDE_LAYOUT]: {
            gridTemplateColumns: spacious
              ? "300px minmax(280px, 1fr) minmax(280px, 432px)"
              : "minmax(220px, 0.7fr) minmax(320px, 1.4fr) minmax(280px, 432px)",
            ...(spacious && { gridTemplateRows: "minmax(0, 1fr)" }),
          },
        }}
      >
        <Box
          sx={{
            ...fillColumnSx,
            height: 320,
            ...(spacious && { minHeight: 0 }),
            [WIDE_LAYOUT]: { height: spacious ? "auto" : PANEL_HEIGHT.lg },
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
            height: PANEL_HEIGHT.xs,
            ...(spacious && { minHeight: 0 }),
            [WIDE_LAYOUT]: { height: spacious ? "auto" : PANEL_HEIGHT.lg },
          }}
        >
          <Box sx={{ ...fillInnerSx, gap: 1 }}>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <FeatureInfoEditor
                ref={editorRef}
                id={inputId}
                value={value}
                onChange={commitTemplate}
                onPreviewChange={onPreviewChange}
                expanded={expanded}
                onToggleExpanded={toggleExpanded}
                onOpenWindowPreview={openWindowPreview}
                history={history}
                emptyShowsAttributes={emptyShowsAttributes}
              />
            </Box>
            <FeatureInfoIssues issues={issues} onGoToLine={goToLine} />
          </Box>
        </Box>
        <Box
          sx={{
            ...fillColumnSx,
            height: spacious ? 640 : PANEL_HEIGHT.xs,
            ...(spacious && { minHeight: 0 }),
            [WIDE_LAYOUT]: { height: spacious ? "auto" : PANEL_HEIGHT.lg },
          }}
        >
          <Box sx={fillInnerSx}>
            <FeatureInfoPreview
              template={previewTemplate}
              caption={caption}
              properties={previewProperties}
              options={options}
              controls={samplePicker}
              fill
              emptyShowsAttributes={emptyShowsAttributes}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );

  const title = caption ? `${t("layers.infobox")}: ${caption}` : t("layers.infobox");
  return (
    <>
      {!expanded && (
        <Box
          data-form-wide=""
          sx={
            fill
              ? { flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }
              : undefined
          }
        >
          {workspace}
        </Box>
      )}
      {expanded && (
        <Box data-form-wide="">
          <Alert severity="info" variant="outlined">
            {t("layers.featureInfo.expandedNotice")}
          </Alert>
        </Box>
      )}
      <Dialog
        fullScreen
        open={expanded}
        transitionDuration={0}
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
          {expanded && workspace}
        </DialogContent>
      </Dialog>
      {windowPreview && (
        <Dialog
          open
          maxWidth={false}
          transitionDuration={0}
          onClose={() => setWindowPreview(false)}
          slotProps={{
            container: {
              sx: {
                alignItems: "flex-start",
                justifyContent: "flex-start",
                position: "relative",
              },
            },
            paper: {
              sx: {
                position: "absolute",
                top: windowAnchor.top,
                left: windowAnchor.left,
                width: previewWidth,
                maxWidth: "none",
                maxHeight: "none",
                m: 0,
                bgcolor: "transparent",
                boxShadow: "none",
                overflow: "visible",
              },
            },
          }}
        >
          <FeatureInfoPreview
            windowOnly
            hintResize={showResizeHint}
            template={previewTemplate}
            caption={caption}
            properties={previewProperties}
            options={options}
            controls={samplePicker}
            emptyShowsAttributes={emptyShowsAttributes}
            width={previewWidth}
            height={previewHeight}
            onWidthChange={changePreviewWidth}
            onHeightChange={changePreviewHeight}
            onMove={changeWindowAnchor}
            onClose={() => setWindowPreview(false)}
          />
        </Dialog>
      )}
    </>
  );
}
