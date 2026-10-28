import { Children, type ReactNode } from "react";
import { Box, Stack, type SxProps, type Theme } from "@mui/material";
import { useSettingsSearchTerm } from "./settings-search";

/** Vertical gap between stacked fields in settings panels (12px). */
export const FORM_FIELD_ROW_SPACING = 1.5;

/** First field in a settings tab — full width on md+. */
// eslint-disable-next-line react-refresh/only-export-components
export const FORM_FIELD_COL_SIZE_FIRST = { xs: 12, md: 12 } as const;
/** Remaining fields in a settings tab — 10/12 width on md+. */
// eslint-disable-next-line react-refresh/only-export-components
export const FORM_FIELD_COL_SIZE = { xs: 12, md: 10 } as const;

interface FormFieldGridProps {
  children: ReactNode;
  /** @deprecated column layout is no longer used; kept for call-site compatibility */
  columnSpacing?: number;
  sx?: SxProps<Theme>;
}

/** One full-width form field row inside a settings panel. */
export function FormFieldRow({ children }: { children: ReactNode }) {
  return <Box sx={{ width: "100%", minWidth: 0 }}>{children}</Box>;
}

/** Marks one grid row so the settings search can show or hide it without re-rendering. */
function SettingsSearchItem({ children }: { children: ReactNode }) {
  return (
    <Box data-settings-field="" sx={{ width: "100%", minWidth: 0 }}>
      {children}
    </Box>
  );
}

/** Standard single-column field layout for FormPanel / FormAccordion content. */
export default function FormFieldGrid({ children, sx }: FormFieldGridProps) {
  const term = useSettingsSearchTerm();

  return (
    <Stack spacing={FORM_FIELD_ROW_SPACING} sx={{ width: "100%", ...sx }}>
      {term === null
        ? children
        : Children.map(children, (child) =>
            child == null || typeof child === "boolean" ? (
              child
            ) : (
              <SettingsSearchItem>{child}</SettingsSearchItem>
            ),
          )}
    </Stack>
  );
}
