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
  /**
   * "auto" = two columns from `md` up, where wide content (text areas, lists,
   * tables, sliders, checkbox groups and anything outside a FormFieldRow)
   * takes the whole row. 2 = two equal columns from `md` up. 4 = four columns
   * from `md` up, two from `sm`. 1 = a single stacked column. Default "auto".
   */
  columns?: "auto" | 1 | 2 | 4;
  sx?: SxProps<Theme>;
}

/** Content that needs the whole row in the "auto" layout. */
const WIDE_CONTENT = [
  "textarea",
  "table",
  "[data-form-wide]",
  "[data-form-grid]",
  ".MuiFormGroup-root",
  ".MuiDataGrid-root",
  ".MuiSlider-root",
  ".MuiList-root",
  ".MuiPaper-root",
  ".MuiToggleButtonGroup-root",
].join(", ");

// Field rows sit inside display:contents wrappers (the search markers), so the
// grid rules target the row itself rather than a direct child.
const autoLayoutSx = {
  gridTemplateColumns: {
    xs: "minmax(0, 1fr)",
    md: "repeat(2, minmax(0, 1fr))",
  },
  "& > *": { gridColumn: "1 / -1" },
  "& [data-form-field]": {
    gridColumnStart: "auto",
    gridColumnEnd: "auto",
  },
  [`& [data-form-field][data-grid-full], & [data-form-field]:has(${WIDE_CONTENT})`]:
    { gridColumn: "1 / -1" },
  "& [data-form-field][data-grid-span='2']": { gridColumnEnd: "span 2" },
  "& [data-form-field][data-grid-new-row]": { gridColumnStart: 1 },
  // A nested field grid, such as the DPI rows, takes the row under the field above it.
  "& [data-form-grid]": { gridColumn: "1 / -1" },
};

/**
 * One form field inside a settings panel. In a column grid it takes one
 * column; `span={2}` takes two and `fullWidth` takes the whole row.
 * `newRow` starts it in the first column of a new row.
 */
export function FormFieldRow({
  children,
  fullWidth = false,
  span,
  newRow = false,
}: {
  children: ReactNode;
  fullWidth?: boolean;
  span?: 2;
  newRow?: boolean;
}) {
  return (
    <Box
      data-form-field=""
      data-grid-full={fullWidth ? "" : undefined}
      data-grid-span={span}
      data-grid-new-row={newRow ? "" : undefined}
      sx={{ width: "100%", minWidth: 0 }}
    >
      {children}
    </Box>
  );
}

/**
 * Marks one grid child so the settings search can show or hide it.
 * `display: contents` leaves the field rows as the grid items, so opening
 * the search tab does not change which fields share a row.
 */
function SettingsSearchItem({ children }: { children: ReactNode }) {
  return (
    <Box data-settings-field="" sx={{ display: "contents" }}>
      {children}
    </Box>
  );
}

/** Field layout for FormPanel / FormAccordion content. See `columns`. */
export default function FormFieldGrid({
  children,
  columns = "auto",
  sx,
}: FormFieldGridProps) {
  const term = useSettingsSearchTerm();

  const content =
    term === null
      ? children
      : Children.map(children, (child) =>
          child == null || typeof child === "boolean" ? (
            child
          ) : (
            <SettingsSearchItem>{child}</SettingsSearchItem>
          ),
        );

  if (columns === "auto") {
    return (
      <Box
        data-form-grid=""
        sx={{
          width: "100%",
          display: "grid",
          columnGap: 2,
          rowGap: FORM_FIELD_ROW_SPACING,
          alignItems: "start",
          ...autoLayoutSx,
          ...sx,
        }}
      >
        {content}
      </Box>
    );
  }

  if (columns === 2 || columns === 4) {
    return (
      <Box
        data-form-grid=""
        sx={{
          width: "100%",
          display: "grid",
          gridTemplateColumns:
            columns === 4
              ? {
                  xs: "minmax(0, 1fr)",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                }
              : {
                  xs: "minmax(0, 1fr)",
                  md: "repeat(2, minmax(0, 1fr))",
                },
          columnGap: 2,
          rowGap: FORM_FIELD_ROW_SPACING,
          alignItems: "start",
          "& [data-form-field][data-grid-full]": { gridColumn: "1 / -1" },
          "& [data-form-field][data-grid-span='2']": { gridColumnEnd: "span 2" },
          "& [data-form-field][data-grid-new-row]": { gridColumnStart: 1 },
          ...sx,
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <Stack
      data-form-grid=""
      spacing={FORM_FIELD_ROW_SPACING}
      sx={{ width: "100%", ...sx }}
    >
      {content}
    </Stack>
  );
}
