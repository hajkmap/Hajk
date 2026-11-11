import { Alert, Box, Link, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { TemplateIssue } from "./template-validation";

interface FeatureInfoIssuesProps {
  issues: TemplateIssue[];
  onGoToLine: (line: number) => void;
}

export default function FeatureInfoIssues({
  issues,
  onGoToLine,
}: FeatureInfoIssuesProps) {
  const { t } = useTranslation();

  if (issues.length === 0) return null;

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}
    >
      {issues.map((issue, index) => (
        <Alert
          key={`${issue.code}:${issue.line}:${index}`}
          severity={issue.severity}
          variant="outlined"
          sx={{ py: 0, "& .MuiAlert-message": { py: 0.75 } }}
        >
          <Typography variant="body2" component="span">
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={() => onGoToLine(issue.line)}
              sx={{ mr: 1, verticalAlign: "baseline" }}
            >
              {t("layers.featureInfo.line", { line: issue.line })}
            </Link>
            {t(`layers.featureInfo.issue.${issue.code}` as never, issue.params ?? {})}
          </Typography>
        </Alert>
      ))}
    </Box>
  );
}
