import { useMemo, useRef, useState } from "react";
import { Box, MenuItem, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { fetchDescribeFeatureType } from "../../../api/services/describe-feature-type";
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

  return (
    <Box data-form-wide="" sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
            lg: "minmax(200px, 0.7fr) minmax(0, 1.4fr) minmax(0, 1.2fr)",
          },
          alignItems: "start",
        }}
      >
        <Box sx={{ height: { lg: 520 }, maxHeight: { xs: 320, lg: "none" } }}>
          <FeatureInfoAttributes
            attributes={canQuery ? attributesQuery.data : []}
            isLoading={attributesQuery.isLoading}
            isError={attributesQuery.isError}
            onRetry={() => void attributesQuery.refetch()}
            sampleProperties={previewProperties}
            onInsert={(placeholder) => editorRef.current?.insert(placeholder)}
          />
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
          <FeatureInfoEditor
            ref={editorRef}
            id={inputId}
            value={value}
            onChange={onChange}
          />
          <FeatureInfoIssues
            issues={issues}
            onGoToLine={(line) => editorRef.current?.goToLine(line)}
          />
        </Box>
        <FeatureInfoPreview
          template={debouncedTemplate}
          caption={caption}
          properties={previewProperties}
          options={options}
          controls={
            <FeatureInfoSamplePicker
              samples={samples}
              samplesLoading={samplesQuery.isFetching}
              samplesFailed={samplesQuery.isError}
              onRetrySamples={() => void samplesQuery.refetch()}
              selectedId={selectedId}
              onSelect={setSampleId}
              exampleProperties={exampleProperties}
              onExampleChange={setExampleOverride}
              options={options}
              onOptionsChange={setOptions}
              displayFields={displayFieldNames(displayFields)}
            />
          }
        />
      </Box>
    </Box>
  );
}
