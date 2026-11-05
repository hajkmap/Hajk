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

/** A grid item that is `field`, or a settings search wrapper around it. */
const gridItem = (field: string) =>
  `& > ${field}, & > [data-settings-field]:has(> ${field})`;

// :has() can't be nested, so wide rows are matched by a later rule instead
// of being excluded inside the half-width one.
const autoLayoutSx = {
  gridTemplateColumns: {
    xs: "minmax(0, 1fr)",
    md: "repeat(2, minmax(0, 1fr))",
  },
  "& > *": { gridColumnStart: 1, gridColumnEnd: -1 },
  [gridItem("[data-form-field]")]: {
    gridColumnStart: "auto",
    gridColumnEnd: "auto",
  },
  [`${gridItem("[data-grid-full]")}, & > [data-form-field]:has(${WIDE_CONTENT}), & > [data-settings-field]:has(${WIDE_CONTENT})`]:
    { gridColumnStart: 1, gridColumnEnd: -1 },
  [gridItem("[data-grid-span='2']")]: { gridColumnEnd: "span 2" },
  [gridItem("[data-grid-new-row]")]: { gridColumnStart: 1 },
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

/** Marks one grid row so the settings search can show or hide it without re-rendering. */
function SettingsSearchItem({ children }: { children: ReactNode }) {
  return (
    <Box data-settings-field="" sx={{ width: "100%", minWidth: 0 }}>
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
          // Full-width rows span both columns, also when search wraps them.
          "& > [data-grid-full], & > *:has(> [data-grid-full])": {
            gridColumn: "1 / -1",
          },
          "& > [data-grid-span='2'], & > *:has(> [data-grid-span='2'])": {
            // On the end line, so `newRow` (which sets the start) keeps the span.
            gridColumnEnd: "span 2",
          },
          // After the span rule so a spanning field can also start a new row.
          "& > [data-grid-new-row], & > *:has(> [data-grid-new-row])": {
            gridColumnStart: 1,
          },
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
