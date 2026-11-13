import { memo, useMemo, type ReactNode } from "react";
import { Alert, Box, Typography } from "@mui/material";
import ClientWindowFrame from "./client-window-frame";
import { useTranslation } from "react-i18next";
import {
  renderTemplate,
  type FeatureProperties,
  type FilterIssue,
  type TemplateOptions,
} from "./template-engine";
import {
  FeatureInfoDefaultTable,
  FeatureInfoRendered,
} from "./feature-info-rendered";
import PreviewErrorBoundary from "./preview-error-boundary";

interface FeatureInfoPreviewProps {
  template: string;
  caption: string;
  properties: FeatureProperties;
  options: TemplateOptions;
  controls: ReactNode;
  fill?: boolean;
}

type RenderOutcome =
  | {
      ok: true;
      result: ReturnType<typeof renderTemplate>;
      filterIssues: { placeholder: string; issue: FilterIssue }[];
    }
  | { ok: false; error: string };

export default memo(FeatureInfoPreview);

function FeatureInfoPreview({
  template,
  caption,
  properties,
  options,
  controls,
  fill = false,
}: FeatureInfoPreviewProps) {
  const { t } = useTranslation();
  const allowDangerousHtml = options.allowDangerousHtml ?? true;

  const outcome = useMemo<RenderOutcome>(() => {
    const filterIssues: { placeholder: string; issue: FilterIssue }[] = [];
    try {
      const result = renderTemplate(template, properties, {
        ...options,
        onFilterIssue: (placeholder, issue) =>
          filterIssues.push({ placeholder, issue }),
      });
      return { ok: true, result, filterIssues };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }, [template, properties, options]);

  const renderError = (message: string) => (
    <Alert severity="error">
      {t("layers.featureInfo.renderFailed", { message })}
    </Alert>
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minHeight: 0,
        ...(fill && { flex: 1 }),
      }}
    >
      <Typography variant="subtitle2">{t("layers.featureInfo.preview")}</Typography>
      {controls}
      {!template.trim() && (
        <Typography variant="caption" color="text.secondary">
          {t("layers.featureInfo.defaultTableNotice")}
        </Typography>
      )}
      <ClientWindowFrame title={t("layers.featureInfo.clientWindowTitle")} fill={fill}>
        {caption && (
          <Typography variant="button" component="h6" align="center" gutterBottom>
            {caption}
          </Typography>
        )}
        {!template.trim() ? (
          <FeatureInfoDefaultTable properties={properties} />
        ) : !outcome.ok ? (
          renderError(outcome.error)
        ) : (
          <PreviewErrorBoundary
            key={`${outcome.result.markdown}:${String(allowDangerousHtml)}`}
            fallback={(error) => renderError(error.message)}
          >
            <FeatureInfoRendered
              markdown={outcome.result.markdown}
              externals={outcome.result.externals}
              allowDangerousHtml={allowDangerousHtml}
            />
          </PreviewErrorBoundary>
        )}
      </ClientWindowFrame>
      {outcome.ok &&
        outcome.filterIssues
          .filter(({ issue }) => issue.message !== "unknownFilter")
          .map(({ placeholder, issue }, index) => (
            <Alert key={index} severity="warning" variant="outlined">
              {t("layers.featureInfo.filterFailed", {
                placeholder: `{${placeholder}}`,
                message: issue.message,
              })}
            </Alert>
          ))}
    </Box>
  );
}
