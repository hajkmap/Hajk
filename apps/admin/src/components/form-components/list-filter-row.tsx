import { memo, useEffect, useRef, type ReactNode } from "react";
import { Box, TextField, type SxProps, type Theme } from "@mui/material";

/** Pause before a list re-filters, so typing does not re-render the grid. */
const LIST_SEARCH_PAUSE_MS = 200;

interface ListFilterRowProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
}

/** Horizontal filter bar for list pages (search + dropdowns on one row). */
export function ListFilterRow({ children, sx }: ListFilterRowProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: { xs: "wrap", md: "nowrap" },
        alignItems: "flex-start",
        gap: 2,
        mb: 2,
        width: "100%",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

/** Search field on a list page: full width on phones, half on tablets, a third on desktop. */
export function ListFilterSearch({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        width: { xs: "100%", sm: "50%", md: "33%" },
        flexShrink: 0,
        minWidth: 0,
      }}
    >
      {children}
    </Box>
  );
}

/**
 * Search box for a list page. The input is left to the browser, so the
 * letter shows up with the key. The grid is told after a short pause.
 */
export const ListSearchField = memo(function ListSearchField({
  label,
  onSearch,
}: {
  label: string;
  onSearch: (value: string) => void;
}) {
  const onSearchRef = useRef(onSearch);
  const timerRef = useRef<number>(0);
  onSearchRef.current = onSearch;

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  return (
    <TextField
      fullWidth
      label={label}
      variant="outlined"
      defaultValue=""
      onChange={(event) => {
        const next = event.target.value;
        window.clearTimeout(timerRef.current);
        timerRef.current = window.setTimeout(() => {
          onSearchRef.current(next);
        }, next ? LIST_SEARCH_PAUSE_MS : 0);
      }}
    />
  );
});

/** Secondary filter dropdown — narrower fixed share of the row. */
export function ListFilterField({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        flex: { xs: "1 1 calc(50% - 8px)", sm: "1 1 calc(50% - 8px)", md: "2 1 160px" },
        minWidth: { md: 160 },
        maxWidth: { md: 220 },
      }}
    >
      {children}
    </Box>
  );
}
