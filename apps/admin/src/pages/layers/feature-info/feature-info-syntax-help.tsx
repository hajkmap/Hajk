import { useState } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Link,
  Tooltip,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import HelpOutlineIcon from "@mui/icons-material/Help";
import { useTranslation } from "react-i18next";
import { FILTERS } from "./template-engine";

const SYNTAX_EXAMPLES = [
  { key: "attribute", code: "{namn}" },
  { key: "filterChain", code: "{datum|dateAddDays(1)|date}" },
  { key: "fallback", code: "{telefon|default('Saknas')}" },
  { key: "hasValue", code: "{{if {status}}}\nStatus: {status}\n{{/if}}" },
  { key: "equals", code: '{{if {status}="Aktiv"}}\nObjektet är aktivt\n{{/if}}' },
  { key: "notEquals", code: '{{if {status}!="Aktiv"}}\nObjektet är inte aktivt\n{{/if}}' },
  { key: "plugin", code: "{dokument@@documenthandler}" },
  { key: "linkAttributes", code: "[Öppna]({url}){target=_blank}" },
];

interface FeatureInfoSyntaxHelpProps {
  /** Inserts a filter, e.g. `|date`, at the caret. */
  onInsertFilter: (snippet: string) => void;
}

const codeSx = {
  fontFamily: "monospace",
  fontSize: "0.8rem",
  whiteSpace: "pre-wrap" as const,
  bgcolor: "action.hover",
  borderRadius: 1,
  px: 1,
  py: 0.5,
};

function ExampleRow({ label, code }: { label: string; code: string }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) minmax(0, 1fr)" },
        gap: 1,
        alignItems: "center",
        py: 1,
        borderBottom: 1,
        borderColor: "divider",
      }}
    >
      <Typography variant="body2">{label}</Typography>
      <Box component="code" sx={codeSx}>
        {code}
      </Box>
    </Box>
  );
}

export default function FeatureInfoSyntaxHelp({ onInsertFilter }: FeatureInfoSyntaxHelpProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip title={t("layers.featureInfo.syntaxHelp")}>
        <IconButton
          size="small"
          aria-label={t("layers.featureInfo.syntaxHelp")}
          onClick={() => setOpen(true)}
          sx={{ ml: "auto" }}
        >
          <HelpOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        hideBackdrop
        disableScrollLock
        disableEnforceFocus
        disableAutoFocus
        disableRestoreFocus
        slotProps={{
          root: { sx: { pointerEvents: "none" } },
          paper: {
            sx: {
              pointerEvents: "auto",
              position: "fixed",
              top: 16,
              right: 16,
              m: 0,
              width: { xs: "min(100% - 32px, 500px)", sm: 500 },
              maxWidth: "none",
              maxHeight: "calc(100% - 32px)",
            },
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1, pr: 1 }}>
          <HelpOutlineIcon color="action" />
          <Box sx={{ flex: 1 }}>{t("layers.featureInfo.syntaxHelp")}</Box>
          <IconButton
            aria-label={t("common.dialog.closeBtn")}
            onClick={() => setOpen(false)}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t("layers.featureInfo.syntaxIntro")}
          </Typography>
          {SYNTAX_EXAMPLES.map((example) => (
            <ExampleRow
              key={example.key}
              label={t(`layers.featureInfo.syntax.${example.key}` as never)}
              code={example.code}
            />
          ))}
          <Typography variant="subtitle1" sx={{ mt: 3, mb: 0.5 }}>
            {t("layers.featureInfo.filters")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {t("layers.featureInfo.filtersHelp")}
          </Typography>
          {FILTERS.map((filter) => {
            const snippet = filter.args.length
              ? `|${filter.name}(${filter.args.join(", ")})`
              : `|${filter.name}`;
            return (
              <Box
                key={filter.name}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1.2fr) minmax(0, 1fr)" },
                  gap: 1,
                  alignItems: "center",
                  py: 1,
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Box>
                  <Link
                    component="button"
                    type="button"
                    onClick={() => onInsertFilter(snippet)}
                    sx={{ ...codeSx, bgcolor: "transparent", px: 0, py: 0 }}
                  >
                    {filter.name}
                  </Link>
                  <Typography variant="caption" color="text.secondary" component="div">
                    {t(`layers.featureInfo.filterDesc.${filter.name}` as never)}
                  </Typography>
                </Box>
                <Box component="code" sx={codeSx}>
                  {filter.example}
                </Box>
              </Box>
            );
          })}
        </DialogContent>
      </Dialog>
    </>
  );
}
