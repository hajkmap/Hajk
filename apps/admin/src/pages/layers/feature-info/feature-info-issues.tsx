import { memo } from "react";
import { Alert, Box, Link, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import type { TemplateIssue } from "./template-validation";

interface FeatureInfoIssuesProps {
  issues: TemplateIssue[];
  onGoToLine: (line: number) => void;
}

const NARROW_VISIBLE = 3;
const WIDE_VISIBLE = 5;
const ALERT_HEIGHT = 40;
const GAP = 4;
const CHROME = 10;

const listHeight = (count: number) =>
  count * ALERT_HEIGHT + Math.max(0, count - 1) * GAP + CHROME;

const scrollListSx = (count: number) => ({
  maxHeight: listHeight(count),
  overflowY: "auto",
  overscrollBehavior: "contain",
  border: 1,
  borderColor: "divider",
  borderRadius: 1,
  p: 0.5,
});

export default memo(FeatureInfoIssues);

function FeatureInfoIssues({
  issues,
  onGoToLine,
}: FeatureInfoIssuesProps) {
  const { t } = useTranslation();

  if (issues.length === 0) return null;

  const gathered = issues.length > NARROW_VISIBLE;

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={(theme) => ({
        display: "flex",
        flexDirection: "column",
        gap: 0.5,
        flexShrink: 0,
        minHeight: 0,
        ...(gathered ? scrollListSx(NARROW_VISIBLE) : {}),
        [theme.breakpoints.up("xl")]: gathered
          ? issues.length > WIDE_VISIBLE
            ? scrollListSx(WIDE_VISIBLE)
            : {
                maxHeight: "none",
                overflowY: "visible",
                border: 0,
                p: 0,
              }
          : {},
      })}
    >
      {issues.map((issue, index) => (
        <Alert
          key={`${issue.code}:${issue.line}:${index}`}
          severity={issue.severity}
          variant="outlined"
          sx={{ py: 0, flexShrink: 0, "& .MuiAlert-message": { py: 0.75 } }}
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
